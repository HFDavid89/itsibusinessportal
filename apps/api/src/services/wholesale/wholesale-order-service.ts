import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@itsi-business/database';
import {
  BLOCKED_WHOLESALE_ORDER_STATUSES,
  ORDERABLE_WHOLESALE_STATUSES,
} from '@itsi-business/core';
import {
  itsiMobileClient,
  loadWholesaleConfig,
  isWholesaleEnabled,
  WholesaleConfigError,
  WholesaleDisabledError,
  WholesaleCircuitOpenError,
  WholesaleApiError,
  WholesaleTimeoutError,
  type WholesaleOrderPayload,
} from './itsi-mobile-client';
import {
  mapWholesaleLinkStatus,
  shouldPromoteRetailToActive,
  sanitizeStatusResponse,
  buildWholesaleStaffInsights,
  extractUpstreamStatusFromResponse,
  isUpstreamFailureStatus,
} from './status-mapper';
import { writeServiceLifecycleEvent } from '../service-lifecycle-events';

export const RequestWholesaleOrderSchema = z.object({
  quoteId:      z.string().max(200).optional(),
  productCode:  z.string().max(100).optional(),
  contactName:  z.string().max(200).optional(),
  contactPhone: z.string().max(30).optional(),
  notes:        z.string().max(2000).optional(),
  confirm:      z.literal(true, { errorMap: () => ({ message: 'confirm must be true' }) }),
});

const CATALOGUE_SELECT = {
  id: true, sku: true, name: true, serviceType: true, contractTermMonths: true,
} as const;

const SERVICE_INCLUDE = {
  account: { select: { id: true, companyName: true, accountNumber: true } },
  catalogueItem: { select: CATALOGUE_SELECT },
  wholesaleLink: true,
} as const;

const SAFE_WHOLESALE_ERROR_MESSAGES: Record<string, string> = {
  WHOLESALE_CONFIG_ERROR: 'Wholesale integration is misconfigured. Contact platform admin.',
  WHOLESALE_DISABLED: 'Wholesale API is disabled. Enable ITSI_MOBILE_WHOLESALE_ENABLED to request orders.',
  CIRCUIT_OPEN: 'Wholesale API is temporarily unavailable after repeated failures. Try again shortly.',
  WHOLESALE_TIMEOUT: 'Wholesale status check timed out. You can retry safely.',
  WHOLESALE_API_ERROR: 'Wholesale service returned an error. No provider details are exposed here.',
};

export function handleWholesaleOrderError(err: unknown): { status: number; body: object } {
  if (err instanceof WholesaleConfigError) {
    return { status: 503, body: { success: false, error: { code: 'WHOLESALE_CONFIG_ERROR', message: SAFE_WHOLESALE_ERROR_MESSAGES.WHOLESALE_CONFIG_ERROR, field: err.field } } };
  }
  if (err instanceof WholesaleDisabledError) {
    return { status: 503, body: { success: false, error: { code: 'WHOLESALE_DISABLED', message: SAFE_WHOLESALE_ERROR_MESSAGES.WHOLESALE_DISABLED } } };
  }
  if (err instanceof WholesaleCircuitOpenError) {
    return { status: 503, body: { success: false, error: { code: 'CIRCUIT_OPEN', message: SAFE_WHOLESALE_ERROR_MESSAGES.CIRCUIT_OPEN } } };
  }
  if (err instanceof WholesaleTimeoutError) {
    return { status: 504, body: { success: false, error: { code: 'WHOLESALE_TIMEOUT', message: SAFE_WHOLESALE_ERROR_MESSAGES.WHOLESALE_TIMEOUT } } };
  }
  if (err instanceof WholesaleApiError) {
    return { status: 502, body: { success: false, error: { code: 'WHOLESALE_API_ERROR', message: SAFE_WHOLESALE_ERROR_MESSAGES.WHOLESALE_API_ERROR } } };
  }
  return { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected wholesale order error' } } };
}

type ServiceType = 'MOBILE' | 'BROADBAND';

function attachWholesaleInsights<T extends { status: string; wholesaleLink?: { lastStatusResponse?: unknown } | null }>(
  service: T,
  wholesaleLink: T['wholesaleLink'],
) {
  const upstreamStatus = wholesaleLink
    ? extractUpstreamStatusFromResponse(wholesaleLink.lastStatusResponse)
    : null;
  const insights = buildWholesaleStaffInsights(upstreamStatus, {
    hasWholesaleLink: Boolean(wholesaleLink),
    retailStatus: service.status,
  });
  return {
    upstreamStatus,
    upstreamFailure: upstreamStatus ? isUpstreamFailureStatus(upstreamStatus) : false,
    ...insights,
  };
}

async function loadMobileService(id: string) {
  return prisma.businessMobileService.findUnique({
    where: { id },
    include: SERVICE_INCLUDE,
  });
}

async function loadBroadbandService(id: string) {
  return prisma.businessBroadbandService.findUnique({
    where: { id },
    include: { ...SERVICE_INCLUDE, site: { select: { id: true, name: true, postcode: true } } },
  });
}

function validateServiceForOrder(
  service: { status: string; accountId: string; wholesaleServiceLinkId: string | null },
  serviceType: ServiceType,
  broadbandPostcode?: string,
): string | null {
  if (!service.accountId) return 'Service has no linked account';
  if (BLOCKED_WHOLESALE_ORDER_STATUSES.has(service.status)) return `Cannot request wholesale order for ${service.status} service`;
  if (!ORDERABLE_WHOLESALE_STATUSES.has(service.status)) return `Service status must be DRAFT or REQUESTED (current: ${service.status})`;
  if (service.wholesaleServiceLinkId) return 'Service already has a wholesale link';
  if (serviceType === 'BROADBAND' && !broadbandPostcode?.trim()) return 'Broadband service requires a postcode before wholesale order';
  return null;
}

function buildOrderPayload(
  serviceType: ServiceType,
  service: {
    accountId: string;
    serviceReference: string;
    catalogueItem?: { sku: string; contractTermMonths: number | null } | null;
    postcode?: string;
    uprn?: string | null;
  },
  body: z.infer<typeof RequestWholesaleOrderSchema>,
): WholesaleOrderPayload {
  return {
    serviceType,
    businessAccountId: service.accountId,
    businessServiceReference: service.serviceReference,
    quoteId: body.quoteId,
    productCode: body.productCode ?? service.catalogueItem?.sku,
    contactName: body.contactName,
    contactPhone: body.contactPhone,
    notes: body.notes,
    contractTermMonths: service.catalogueItem?.contractTermMonths ?? undefined,
    ...(serviceType === 'BROADBAND' ? {
      postcode: service.postcode!,
      uprn: service.uprn ?? undefined,
    } : {}),
  };
}

export async function requestWholesaleOrderForService(
  serviceType: ServiceType,
  serviceId: string,
  body: z.infer<typeof RequestWholesaleOrderSchema>,
  actorId?: string,
) {
  if (!isWholesaleEnabled()) throw new WholesaleDisabledError();

  const service = serviceType === 'MOBILE'
    ? await loadMobileService(serviceId)
    : await loadBroadbandService(serviceId);

  if (!service) return { error: { status: 404, body: { success: false, error: { code: 'NOT_FOUND', message: `${serviceType} service not found` } } } };

  const validationMsg = validateServiceForOrder(
    service,
    serviceType,
    serviceType === 'BROADBAND' ? (service as { postcode: string }).postcode : undefined,
  );
  if (validationMsg) {
    return { error: { status: 400, body: { success: false, error: { code: 'VALIDATION_ERROR', message: validationMsg } } } };
  }

  const config = loadWholesaleConfig();
  const payload = buildOrderPayload(serviceType, service, body);
  const orderResult = await itsiMobileClient.createOrder(config, payload);

  const raw = orderResult.raw as Record<string, unknown> | undefined;
  const serviceOrderId = typeof raw?.serviceOrderId === 'string' ? raw.serviceOrderId
    : typeof raw?.itsiMobileServiceOrderId === 'string' ? raw.itsiMobileServiceOrderId
    : null;

  const linkStatus = mapWholesaleLinkStatus(orderResult.status);
  const newRetailStatus = service.status === 'DRAFT' ? 'REQUESTED' : service.status;
  const staffWarning = buildWholesaleStaffInsights(orderResult.status, {
    hasWholesaleLink: true,
    retailStatus: newRetailStatus,
  }).staffWarning;

  const result = await prisma.$transaction(async (tx) => {
    const link = await tx.itsiMobileWholesaleServiceLink.create({
      data: {
        businessAccountId: service.accountId,
        businessServiceType: serviceType,
        businessServiceReference: service.serviceReference,
        itsiMobileWholesaleOrderId: orderResult.orderId,
        itsiMobileServiceOrderId: serviceOrderId,
        safeProviderReference: null,
        status: linkStatus,
        lastSyncedAt: new Date(),
        lastStatusCheckedAt: new Date(),
        lastStatusResponse: sanitizeStatusResponse({
          orderId: orderResult.orderId,
          status: orderResult.status,
          lastUpdatedAt: new Date().toISOString(),
        }) as Prisma.InputJsonValue,
      },
    });

    let updatedService;
    if (serviceType === 'MOBILE') {
      updatedService = await tx.businessMobileService.update({
        where: { id: serviceId },
        data: { wholesaleServiceLinkId: link.id, status: newRetailStatus },
        include: SERVICE_INCLUDE,
      });
    } else {
      updatedService = await tx.businessBroadbandService.update({
        where: { id: serviceId },
        data: { wholesaleServiceLinkId: link.id, status: newRetailStatus },
        include: { ...SERVICE_INCLUDE, site: { select: { id: true, name: true, postcode: true } } },
      });
    }

    await writeServiceLifecycleEvent(
      service.accountId,
      'WHOLESALE_ORDER_REQUESTED',
      {
        source: 'ITSI_MOBILE',
        serviceId,
        serviceReference: service.serviceReference,
        businessServiceType: serviceType,
        orderId: orderResult.orderId,
        linkId: link.id,
        previousStatus: service.status,
        newStatus: newRetailStatus,
        upstreamStatus: orderResult.status,
        staffWarning: staffWarning ?? undefined,
        reason: 'wholesale_order_requested',
      },
      actorId,
      tx,
    );

    if (newRetailStatus !== service.status) {
      await writeServiceLifecycleEvent(
        service.accountId,
        'SERVICE_STATUS_UPDATED',
        {
          source: 'ITSI_MOBILE',
          serviceId,
          serviceReference: service.serviceReference,
          businessServiceType: serviceType,
          previousStatus: service.status,
          newStatus: newRetailStatus,
          reason: 'wholesale_order_requested',
        },
        actorId,
        tx,
      );
    }

    return { service: updatedService, wholesaleLink: link };
  });

  const insights = attachWholesaleInsights(result.service, result.wholesaleLink);
  return {
    data: {
      ...result.service,
      _serviceType: serviceType,
      wholesaleLink: result.wholesaleLink,
      wholesaleInsights: insights,
    },
  };
}

export async function getWholesaleStatusForService(serviceType: ServiceType, serviceId: string) {
  const service = serviceType === 'MOBILE'
    ? await loadMobileService(serviceId)
    : await loadBroadbandService(serviceId);

  if (!service) return { error: { status: 404, body: { success: false, error: { code: 'NOT_FOUND', message: `${serviceType} service not found` } } } };

  const insights = attachWholesaleInsights(service, service.wholesaleLink);

  return {
    data: {
      service: { ...service, _serviceType: serviceType },
      wholesaleLink: service.wholesaleLink,
      wholesaleEnabled: isWholesaleEnabled(),
      wholesaleInsights: insights,
    },
  };
}

export async function refreshWholesaleStatusForService(
  serviceType: ServiceType,
  serviceId: string,
  actorId?: string,
) {
  if (!isWholesaleEnabled()) throw new WholesaleDisabledError();

  const service = serviceType === 'MOBILE'
    ? await loadMobileService(serviceId)
    : await loadBroadbandService(serviceId);

  if (!service) return { error: { status: 404, body: { success: false, error: { code: 'NOT_FOUND', message: `${serviceType} service not found` } } } };
  if (!service.wholesaleLink) {
    return { error: { status: 404, body: { success: false, error: { code: 'NO_WHOLESALE_LINK', message: 'No wholesale link on this service' } } } };
  }

  const orderId = service.wholesaleLink.itsiMobileWholesaleOrderId;
  if (!orderId) {
    return { error: { status: 400, body: { success: false, error: { code: 'NO_ORDER_ID', message: 'Wholesale link has no Itsi Mobile order ID' } } } };
  }

  const config = loadWholesaleConfig();
  const statusResult = await itsiMobileClient.getOrderStatus(config, orderId);
  const sanitized = sanitizeStatusResponse(statusResult);
  const linkStatus = mapWholesaleLinkStatus(statusResult.status);
  const promoteActive = shouldPromoteRetailToActive(statusResult.status, service.status);
  const insights = buildWholesaleStaffInsights(statusResult.status, {
    hasWholesaleLink: true,
    retailStatus: promoteActive ? 'ACTIVE' : service.status,
  });

  const result = await prisma.$transaction(async (tx) => {
    const link = await tx.itsiMobileWholesaleServiceLink.update({
      where: { id: service.wholesaleLink!.id },
      data: {
        status: linkStatus,
        safeProviderReference: statusResult.safeProviderReference ?? service.wholesaleLink!.safeProviderReference,
        lastStatusCheckedAt: new Date(),
        lastSyncedAt: new Date(),
        lastStatusResponse: sanitized as Prisma.InputJsonValue,
      },
    });

    let updatedService = service;
    if (promoteActive) {
      const data = { status: 'ACTIVE' as const };
      if (serviceType === 'MOBILE') {
        updatedService = await tx.businessMobileService.update({ where: { id: serviceId }, data, include: SERVICE_INCLUDE });
      } else {
        updatedService = await tx.businessBroadbandService.update({
          where: { id: serviceId },
          data,
          include: { ...SERVICE_INCLUDE, site: { select: { id: true, name: true, postcode: true } } },
        });
      }
      await writeServiceLifecycleEvent(
        service.accountId,
        'SERVICE_STATUS_UPDATED',
        {
          source: 'ITSI_MOBILE',
          serviceId,
          serviceReference: service.serviceReference,
          businessServiceType: serviceType,
          previousStatus: service.status,
          newStatus: 'ACTIVE',
          upstreamStatus: statusResult.status,
          reason: 'wholesale_status_refresh',
        },
        actorId,
        tx,
      );
    }

    await writeServiceLifecycleEvent(
      service.accountId,
      'WHOLESALE_STATUS_REFRESHED',
      {
        source: 'ITSI_MOBILE',
        serviceId,
        serviceReference: service.serviceReference,
        businessServiceType: serviceType,
        orderId,
        linkId: link.id,
        previousStatus: service.status,
        newStatus: promoteActive ? 'ACTIVE' : service.status,
        upstreamStatus: statusResult.status,
        staffWarning: insights.staffWarning ?? undefined,
        reason: 'wholesale_status_refresh',
      },
      actorId,
      tx,
    );

    return { service: updatedService, wholesaleLink: link };
  });

  return {
    data: {
      ...result.service,
      _serviceType: serviceType,
      wholesaleLink: result.wholesaleLink,
      wholesaleInsights: attachWholesaleInsights(result.service, result.wholesaleLink),
    },
  };
}
