import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import {
  ENERGY_TRACKING_STATUSES,
  ENERGY_FUEL_TYPES,
  type EnergyTrackingStatus,
  computeRenewalWindowStart,
  computeNextCheckInDate,
  isRenewalDue,
} from '@itsi-business/core';
import { writeServiceLifecycleEvent } from '../service-lifecycle-events';
import { ensureEnergyReviewWorkItem } from '../work-items/work-item-service';

export const ENERGY_STATUSES = ENERGY_TRACKING_STATUSES;
export const FUEL_TYPES = ENERGY_FUEL_TYPES;

const ENERGY_INCLUDE = {
  account: { select: { id: true, companyName: true, accountNumber: true } },
  site: { select: { id: true, name: true, postcode: true } },
  catalogueItem: { select: { id: true, sku: true, name: true, serviceType: true } },
} as const;

export const CreateEnergyRecordSchema = z.object({
  accountId:                z.string().min(1),
  siteId:                   z.string().min(1),
  catalogueItemId:          z.string().optional(),
  displayName:              z.string().min(1).max(200),
  status:                   z.enum(ENERGY_STATUSES).optional(),
  fuelType:                 z.enum(FUEL_TYPES),
  supplierName:             z.string().max(200).optional(),
  fidelityReference:        z.string().max(200).optional(),
  meterPointReference:      z.string().max(100).optional(),
  mpan:                     z.string().max(50).optional(),
  mprn:                     z.string().max(50).optional(),
  contractStartDate:        z.string().datetime().optional(),
  contractEndDate:          z.string().datetime().optional(),
  renewalWindowStartDate:   z.string().datetime().optional(),
  nextCheckInDate:          z.string().datetime().optional(),
  checkInCadenceDays:       z.number().int().min(1).max(365).optional(),
  estimatedAnnualSpendPence: z.number().int().min(0).optional(),
  notes:                    z.string().max(5000).optional(),
  customerVisible:          z.boolean().optional(),
  retailPriceDescription:   z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.contractStartDate && data.contractEndDate) {
    if (new Date(data.contractEndDate) <= new Date(data.contractStartDate)) {
      ctx.addIssue({ code: 'custom', message: 'contractEndDate must be after contractStartDate', path: ['contractEndDate'] });
    }
  }
});

export const PatchEnergyRecordSchema = z.object({
  catalogueItemId:          z.string().optional(),
  displayName:              z.string().min(1).max(200).optional(),
  status:                   z.enum(ENERGY_STATUSES).optional(),
  fuelType:                 z.enum(FUEL_TYPES).optional(),
  supplierName:             z.string().max(200).optional(),
  fidelityReference:        z.string().max(200).optional(),
  meterPointReference:      z.string().max(100).optional(),
  mpan:                     z.string().max(50).optional(),
  mprn:                     z.string().max(50).optional(),
  contractStartDate:        z.string().datetime().optional(),
  contractEndDate:          z.string().datetime().optional(),
  renewalWindowStartDate:   z.string().datetime().optional(),
  nextCheckInDate:          z.string().datetime().optional(),
  checkInCadenceDays:       z.number().int().min(1).max(365).optional(),
  estimatedAnnualSpendPence: z.number().int().min(0).optional(),
  notes:                    z.string().max(5000).optional(),
  customerVisible:          z.boolean().optional(),
  retailPriceDescription:   z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.contractStartDate && data.contractEndDate) {
    if (new Date(data.contractEndDate) <= new Date(data.contractStartDate)) {
      ctx.addIssue({ code: 'custom', message: 'contractEndDate must be after contractStartDate', path: ['contractEndDate'] });
    }
  }
});

export const CompleteCheckInSchema = z.object({
  notes: z.string().max(2000).optional(),
  scheduleNext: z.boolean().default(true),
  checkInCadenceDays: z.number().int().min(1).max(365).optional(),
});

export const MarkContractedSchema = z.object({
  contractStartDate: z.string().datetime(),
  contractEndDate: z.string().datetime(),
  supplierName: z.string().max(200).optional(),
  fidelityReference: z.string().max(200).optional(),
  estimatedAnnualSpendPence: z.number().int().min(0).optional(),
  checkInCadenceDays: z.number().int().min(1).max(365).optional(),
}).superRefine((data, ctx) => {
  if (new Date(data.contractEndDate) <= new Date(data.contractStartDate)) {
    ctx.addIssue({ code: 'custom', message: 'contractEndDate must be after contractStartDate', path: ['contractEndDate'] });
  }
});

function serviceRefSeq(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ENE-${ts}-${rand}`;
}

function parseDates(input: Record<string, unknown>) {
  const data = { ...input };
  for (const key of ['contractStartDate', 'contractEndDate', 'renewalWindowStartDate', 'nextCheckInDate'] as const) {
    if (typeof data[key] === 'string') data[key] = new Date(data[key] as string);
  }
  return data;
}

function applyRenewalDefaults(data: {
  contractEndDate?: Date | null;
  renewalWindowStartDate?: Date | null;
  nextCheckInDate?: Date | null;
  checkInCadenceDays?: number | null;
  lastCheckInDate?: Date | null;
}) {
  if (data.contractEndDate && !data.renewalWindowStartDate) {
    data.renewalWindowStartDate = computeRenewalWindowStart(data.contractEndDate);
  }
  const cadence = data.checkInCadenceDays ?? 90;
  if (!data.nextCheckInDate && !data.lastCheckInDate) {
    data.nextCheckInDate = computeNextCheckInDate(new Date(), cadence);
  }
  return data;
}

function maybePromoteRenewalDue(status: string, contractEndDate: Date | null | undefined, renewalWindowStartDate: Date | null | undefined): string {
  if (status !== 'CONTRACTED' || !contractEndDate) return status;
  const now = new Date();
  const windowStart = renewalWindowStartDate ?? computeRenewalWindowStart(contractEndDate);
  if (now >= windowStart && now <= contractEndDate) return 'RENEWAL_DUE';
  return status;
}

export async function listEnergyRecords(query: Record<string, string | undefined>) {
  const {
    accountId, status, fuelType, supplier, renewalDue, checkInDue,
    page = '1', limit = '50',
  } = query;

  const take = Math.min(parseInt(limit, 10) || 50, 200);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
  const now = new Date();

  const where: Record<string, unknown> = {
    ...(accountId ? { accountId } : {}),
    ...(status ? { status } : {}),
    ...(fuelType ? { fuelType } : {}),
    ...(supplier ? { supplierName: { contains: supplier, mode: 'insensitive' } } : {}),
  };

  if (renewalDue) {
    const days = parseInt(renewalDue, 10);
    if (!isNaN(days)) {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + days);
      where.contractEndDate = { gte: now, lte: limitDate };
      where.status = { in: ['CONTRACTED', 'RENEWAL_DUE'] };
    }
  }

  if (checkInDue === 'true') {
    where.nextCheckInDate = { lte: now };
    where.status = { notIn: ['LOST', 'CEASED'] };
  }

  const [records, total] = await Promise.all([
    prisma.businessEnergyService.findMany({
      where: where as any,
      include: ENERGY_INCLUDE,
      orderBy: [{ contractEndDate: 'asc' }, { nextCheckInDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
    prisma.businessEnergyService.count({ where: where as any }),
  ]);

  return { records: records.map((r) => ({ ...r, _serviceType: 'ENERGY' as const })), total, page: parseInt(page, 10), limit: take };
}

export async function getEnergyDashboardStats() {
  const now = new Date();
  const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

  const baseActive = { status: { in: ['CONTRACTED', 'RENEWAL_DUE'] } };
  const referralStatuses = { status: { in: ['REFERRED_TO_FIDELITY', 'QUOTE_IN_PROGRESS'] } };

  const [
    total,
    ending30, ending60, ending90, ending180,
    renewalDue,
    checkInsDue,
    referralsInProgress,
    contracted,
    lost,
  ] = await Promise.all([
    prisma.businessEnergyService.count({ where: { status: { not: 'CEASED' } } }),
    prisma.businessEnergyService.count({ where: { ...baseActive, contractEndDate: { gte: now, lte: inDays(30) } } }),
    prisma.businessEnergyService.count({ where: { ...baseActive, contractEndDate: { gte: now, lte: inDays(60) } } }),
    prisma.businessEnergyService.count({ where: { ...baseActive, contractEndDate: { gte: now, lte: inDays(90) } } }),
    prisma.businessEnergyService.count({ where: { ...baseActive, contractEndDate: { gte: now, lte: inDays(180) } } }),
    prisma.businessEnergyService.count({ where: { status: 'RENEWAL_DUE' } }),
    prisma.businessEnergyService.count({ where: { nextCheckInDate: { lte: now }, status: { notIn: ['LOST', 'CEASED'] } } }),
    prisma.businessEnergyService.count({ where: referralStatuses }),
    prisma.businessEnergyService.count({ where: { status: 'CONTRACTED' } }),
    prisma.businessEnergyService.count({ where: { status: 'LOST' } }),
  ]);

  return {
    total,
    contractsEnding: { days30: ending30, days60: ending60, days90: ending90, days180: ending180 },
    renewalDue,
    checkInsDue,
    referralsInProgress,
    contracted,
    lost,
  };
}

export async function getEnergyRecord(id: string) {
  const record = await prisma.businessEnergyService.findUnique({
    where: { id },
    include: ENERGY_INCLUDE,
  });
  if (!record) return null;
  return { ...record, _serviceType: 'ENERGY' as const };
}

export async function createEnergyRecord(body: z.infer<typeof CreateEnergyRecordSchema>, actorId?: string) {
  const { accountId, siteId, catalogueItemId, displayName, fuelType, ...rest } = body;

  const [account, site] = await Promise.all([
    prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } }),
    prisma.businessSite.findFirst({ where: { id: siteId, accountId }, select: { id: true } }),
  ]);
  if (!account) return { error: { status: 404, message: 'Account not found' } };
  if (!site) return { error: { status: 404, message: 'Site not found for account' } };

  if (catalogueItemId) {
    const ci = await prisma.businessServiceCatalogueItem.findUnique({ where: { id: catalogueItemId }, select: { serviceType: true } });
    if (!ci || ci.serviceType !== 'ENERGY') return { error: { status: 400, message: 'Catalogue item is not an ENERGY service' } };
  }

  const data = applyRenewalDefaults(parseDates({
    ...rest,
    accountId,
    siteId,
    catalogueItemId: catalogueItemId ?? null,
    serviceReference: serviceRefSeq(),
    displayName,
    status: rest.status ?? 'PROSPECT',
    fuelType,
    customerVisible: rest.customerVisible ?? true,
    checkInCadenceDays: rest.checkInCadenceDays ?? 90,
  }) as any);

  const record = await prisma.businessEnergyService.create({
    data: data as any,
    include: ENERGY_INCLUDE,
  });

  await writeServiceLifecycleEvent(accountId, 'ENERGY_SERVICE_CREATED', {
    source: 'STAFF',
    serviceId: record.id,
    serviceReference: record.serviceReference,
    businessServiceType: 'ENERGY',
    newStatus: record.status,
    reason: 'energy_record_created',
  }, actorId);

  return { record: { ...record, _serviceType: 'ENERGY' as const } };
}

export async function patchEnergyRecord(id: string, body: z.infer<typeof PatchEnergyRecordSchema>, actorId?: string) {
  const existing = await prisma.businessEnergyService.findUnique({ where: { id } });
  if (!existing) return { error: { status: 404, message: 'Energy record not found' } };

  const data = applyRenewalDefaults(parseDates({ ...body }) as Record<string, unknown>) as Record<string, unknown>;
  const patchStatus = data.status as string | undefined;
  if (data.contractEndDate || existing.contractEndDate) {
    const end = (data.contractEndDate as Date) ?? existing.contractEndDate;
    const status = patchStatus ?? existing.status;
    (data as Record<string, unknown>).status = maybePromoteRenewalDue(status, end, (data.renewalWindowStartDate as Date) ?? existing.renewalWindowStartDate);
  }

  const record = await prisma.businessEnergyService.update({
    where: { id },
    data: data as any,
    include: ENERGY_INCLUDE,
  });

  await writeServiceLifecycleEvent(existing.accountId, 'ENERGY_SERVICE_UPDATED', {
    source: 'STAFF',
    serviceId: id,
    serviceReference: existing.serviceReference,
    businessServiceType: 'ENERGY',
    previousStatus: existing.status,
    newStatus: record.status,
    reason: 'energy_record_updated',
  }, actorId);

  return { record: { ...record, _serviceType: 'ENERGY' as const } };
}

async function transitionEnergyStatus(
  id: string,
  newStatus: EnergyTrackingStatus,
  eventType: string,
  extra: Record<string, unknown>,
  actorId?: string,
) {
  const existing = await prisma.businessEnergyService.findUnique({ where: { id } });
  if (!existing) return { error: { status: 404, message: 'Energy record not found' } };

  const record = await prisma.businessEnergyService.update({
    where: { id },
    data: { status: newStatus, ...(extra as object) },
    include: ENERGY_INCLUDE,
  });

  await writeServiceLifecycleEvent(existing.accountId, eventType, {
    source: 'STAFF',
    serviceId: id,
    serviceReference: existing.serviceReference,
    businessServiceType: 'ENERGY',
    previousStatus: existing.status,
    newStatus,
    reason: eventType.toLowerCase(),
    ...extra,
  }, actorId);

  return { record: { ...record, _serviceType: 'ENERGY' as const } };
}

export async function markEnergyReferred(id: string, actorId?: string) {
  return transitionEnergyStatus(id, 'REFERRED_TO_FIDELITY', 'ENERGY_REFERRED_TO_FIDELITY', {}, actorId);
}

export async function markEnergyQuoteInProgress(id: string, actorId?: string) {
  return transitionEnergyStatus(id, 'QUOTE_IN_PROGRESS', 'ENERGY_QUOTE_IN_PROGRESS', {}, actorId);
}

export async function markEnergyContracted(id: string, body: z.infer<typeof MarkContractedSchema>, actorId?: string) {
  const start = new Date(body.contractStartDate);
  const end = new Date(body.contractEndDate);
  const renewalWindowStartDate = computeRenewalWindowStart(end);
  const cadence = body.checkInCadenceDays ?? 90;
  const status = maybePromoteRenewalDue('CONTRACTED', end, renewalWindowStartDate);

  return transitionEnergyStatus(id, status as EnergyTrackingStatus, 'ENERGY_CONTRACTED', {
    contractStartDate: start,
    contractEndDate: end,
    renewalWindowStartDate,
    supplierName: body.supplierName ?? 'Fidelity Energy',
    fidelityReference: body.fidelityReference ?? undefined,
    estimatedAnnualSpendPence: body.estimatedAnnualSpendPence ?? undefined,
    checkInCadenceDays: cadence,
    nextCheckInDate: computeNextCheckInDate(new Date(), cadence),
  }, actorId);
}

export async function markEnergyLost(id: string, actorId?: string) {
  return transitionEnergyStatus(id, 'LOST', 'ENERGY_MARKED_LOST', {}, actorId);
}

export async function completeEnergyCheckIn(id: string, body: z.infer<typeof CompleteCheckInSchema>, actorId?: string) {
  const existing = await prisma.businessEnergyService.findUnique({ where: { id } });
  if (!existing) return { error: { status: 404, message: 'Energy record not found' } };

  const now = new Date();
  const cadence = body.checkInCadenceDays ?? existing.checkInCadenceDays ?? 90;
  const nextCheckInDate = body.scheduleNext ? computeNextCheckInDate(now, cadence) : existing.nextCheckInDate;

  let status = existing.status;
  if (existing.contractEndDate && isRenewalDue(existing.contractEndDate, 180)) {
    status = 'RENEWAL_DUE';
  }

  const record = await prisma.businessEnergyService.update({
    where: { id },
    data: {
      lastCheckInDate: now,
      nextCheckInDate,
      checkInCadenceDays: cadence,
      status,
      ...(body.notes ? { notes: body.notes } : {}),
    },
    include: ENERGY_INCLUDE,
  });

  await writeServiceLifecycleEvent(existing.accountId, 'ENERGY_CHECK_IN_COMPLETED', {
    source: 'STAFF',
    serviceId: id,
    serviceReference: existing.serviceReference,
    businessServiceType: 'ENERGY',
    previousStatus: existing.status,
    newStatus: status,
    reason: 'check_in_completed',
  }, actorId);

  if (body.scheduleNext && nextCheckInDate) {
    await writeServiceLifecycleEvent(existing.accountId, 'ENERGY_NEXT_CHECK_IN_SCHEDULED', {
      source: 'STAFF',
      serviceId: id,
      serviceReference: existing.serviceReference,
      businessServiceType: 'ENERGY',
      reason: 'next_check_in_scheduled',
      safeExternalReference: nextCheckInDate.toISOString(),
    }, actorId);
  }

  if (status === 'RENEWAL_DUE' && existing.status !== 'RENEWAL_DUE') {
    await writeServiceLifecycleEvent(existing.accountId, 'ENERGY_RENEWAL_WINDOW_STARTED', {
      source: 'SYSTEM',
      serviceId: id,
      serviceReference: existing.serviceReference,
      businessServiceType: 'ENERGY',
      previousStatus: existing.status,
      newStatus: 'RENEWAL_DUE',
      reason: 'renewal_window_started',
    }, actorId);

    await ensureEnergyReviewWorkItem({
      accountId: existing.accountId,
      serviceId: id,
      displayName: existing.displayName,
      reason: 'Energy contract entered renewal window — staff review required.',
    });
  }

  return { record: { ...record, _serviceType: 'ENERGY' as const } };
}
