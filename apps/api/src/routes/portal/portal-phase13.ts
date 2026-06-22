import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { toPortalStatusLabel } from '@itsi-business/core';
import {
  getPortalAccountId,
  getPortalUserId,
  portalGuard,
  assertPortalUserOwnedByAccount,
  sanitizeTicketForPortal,
  isCustomerSafeActivityType,
  toPortalActivityLabel,
} from './helpers';
import {
  loadPortalServiceById,
  loadRelatedInvoices,
  loadRelatedTickets,
  writePortalTimelineEvent,
  mapProductCategory,
  mapServiceCategory,
} from '../../services/portal/portal-service-detail';
import {
  ensureProductEnquiryWorkItem,
  ensureCustomerServiceRequestWorkItem,
  ensureSimMetadataChangeWorkItem,
} from '../../services/work-items/work-item-service';

const ProductEnquirySchema = z.object({
  message: z.string().min(1).max(2000).optional(),
});

const ServiceTicketSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  message: z.string().min(1).max(5000),
});

const FleetPatchSchema = z.object({
  simLabel: z.string().max(100).optional(),
  costCentre: z.string().max(100).optional(),
}).refine((d) => d.simLabel !== undefined || d.costCentre !== undefined, {
  message: 'At least one of simLabel or costCentre is required',
});

const PortalRoleSchema = z.enum(['ACCOUNT_ADMIN', 'BILLING_CONTACT', 'TECHNICAL_CONTACT', 'READ_ONLY']);

function genTicketNumber(): string {
  return `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function registerPortalPhase13Routes(app: FastifyInstance) {
  // ── GET /api/v1/portal/services/:id ───────────────────────────────────────
  app.get('/services/:id', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    const service = await loadPortalServiceById(accountId, id);
    if (!service) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    }

    const [relatedInvoices, relatedTickets] = await Promise.all([
      loadRelatedInvoices(accountId, service.serviceReference),
      loadRelatedTickets(accountId, service.type),
    ]);

    return reply.send({
      success: true,
      data: { service, relatedInvoices, relatedTickets },
    });
  });

  // ── POST /api/v1/portal/products/:id/enquiry ────────────────────────────────
  app.post('/products/:id/enquiry', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    const parsed = ProductEnquirySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } });
    }

    const product = await prisma.businessServiceCatalogueItem.findFirst({
      where: { id, status: 'ACTIVE', customerVisible: true },
      select: { id: true, name: true, serviceType: true },
    });
    if (!product) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }

    const userId = getPortalUserId(request);
    const category = mapProductCategory(product.serviceType);
    const message = parsed.data.message?.trim() || `I am interested in ${product.name}. Please contact me with more information.`;
    const ticketNumber = genTicketNumber();

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.businessTicket.create({
        data: {
          accountId,
          ticketNumber,
          subject: `Product enquiry: ${product.name}`,
          description: message,
          category,
          priority: 'NORMAL',
          status: 'OPEN',
        },
        select: { id: true, ticketNumber: true, subject: true, status: true, category: true, createdAt: true },
      });
      await tx.businessTicketThread.create({
        data: {
          ticketId: t.id,
          body: message,
          authorType: 'PORTAL_USER',
          authorId: userId,
          isInternal: false,
          customerVisible: true,
        },
      });
      return t;
    });

    await writePortalTimelineEvent(accountId, 'CUSTOMER_PRODUCT_ENQUIRY_CREATED', userId, {
      productId: product.id,
      productName: product.name,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    });

    await ensureProductEnquiryWorkItem({
      accountId,
      ticketId: ticket.id,
      productName: product.name,
    });

    return reply.code(201).send({ success: true, data: { ticket, productName: product.name } });
  });

  // ── POST /api/v1/portal/services/:id/tickets ──────────────────────────────
  app.post('/services/:id/tickets', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    const parsed = ServiceTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } });
    }

    const service = await loadPortalServiceById(accountId, id);
    if (!service) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    }

    const userId = getPortalUserId(request);
    const category = mapServiceCategory(service.type);
    const subject = parsed.data.subject?.trim()
      || `Support request: ${service.displayName}`;
    const ticketNumber = genTicketNumber();
    const timelineType = service.type === 'ENERGY'
      ? 'CUSTOMER_ENERGY_REVIEW_REQUESTED'
      : 'CUSTOMER_SERVICE_TICKET_CREATED';

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.businessTicket.create({
        data: {
          accountId,
          ticketNumber,
          subject,
          description: parsed.data.message,
          category,
          priority: 'NORMAL',
          status: 'OPEN',
        },
        select: { id: true, ticketNumber: true, subject: true, status: true, category: true, createdAt: true },
      });
      await tx.businessTicketThread.create({
        data: {
          ticketId: t.id,
          body: parsed.data.message,
          authorType: 'PORTAL_USER',
          authorId: userId,
          isInternal: false,
          customerVisible: true,
        },
      });
      return t;
    });

    await writePortalTimelineEvent(accountId, timelineType, userId, {
      serviceId: service.id,
      serviceReference: service.serviceReference,
      serviceType: service.type,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    });

    await ensureCustomerServiceRequestWorkItem({
      accountId,
      ticketId: ticket.id,
      serviceType: service.type,
      serviceId: service.id,
      displayName: service.displayName,
      isEnergyReview: service.type === 'ENERGY',
    });

    return reply.code(201).send({ success: true, data: { ticket } });
  });

  // ── GET /api/v1/portal/fleet/:id ──────────────────────────────────────────
  app.get('/fleet/:id', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    const sim = await prisma.businessMobileService.findFirst({
      where: { id, accountId },
      select: {
        id: true, serviceReference: true, displayName: true, status: true,
        mobileNumber: true, simLabel: true, costCentre: true, retailPricePence: true,
        contractStartDate: true, contractEndDate: true, contactId: true, siteId: true,
        createdAt: true,
      },
    });
    if (!sim) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'SIM not found' } });
    }

    const [relatedInvoices, relatedTickets, contact, site, recentActivity] = await Promise.all([
      loadRelatedInvoices(accountId, sim.serviceReference),
      prisma.businessTicket.findMany({
        where: {
          accountId,
          OR: [
            { category: 'MOBILE' },
            { subject: { contains: sim.displayName, mode: 'insensitive' } },
            { subject: { contains: sim.serviceReference, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, ticketNumber: true, subject: true, status: true, priority: true, category: true, updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),
      sim.contactId
        ? prisma.businessContact.findFirst({
            where: { id: sim.contactId, accountId },
            select: { id: true, firstName: true, lastName: true, email: true },
          })
        : null,
      sim.siteId
        ? prisma.businessSite.findFirst({
            where: { id: sim.siteId, accountId },
            select: { id: true, name: true, postcode: true },
          })
        : null,
      prisma.timelineEvent.findMany({
        where: { accountId },
        select: { id: true, type: true, occurredAt: true, meta: true },
        orderBy: { occurredAt: 'desc' },
        take: 20,
      }).then((events) =>
        events
          .filter((ev) => {
            const meta = ev.meta as Record<string, unknown> | null;
            const matchesService = meta?.serviceId === id || meta?.serviceReference === sim.serviceReference;
            return matchesService && isCustomerSafeActivityType(ev.type);
          })
          .slice(0, 6)
          .map((ev) => ({
            id: ev.id,
            label: toPortalActivityLabel(ev.type),
            occurredAt: ev.occurredAt.toISOString(),
          })),
      ),
    ]);

    return reply.send({
      success: true,
      data: {
        sim: {
          ...sim,
          statusLabel: toPortalStatusLabel(sim.status),
          contact,
          site,
        },
        relatedInvoices,
        relatedTickets: relatedTickets.map(sanitizeTicketForPortal),
        recentActivity,
      },
    });
  });

  // ── PATCH /api/v1/portal/fleet/:id ────────────────────────────────────────
  app.patch('/fleet/:id', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    const parsed = FleetPatchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } });
    }

    const existing = await prisma.businessMobileService.findFirst({
      where: { id, accountId },
      select: { id: true, serviceReference: true, simLabel: true, costCentre: true },
    });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'SIM not found' } });
    }

    const updated = await prisma.businessMobileService.update({
      where: { id },
      data: {
        ...(parsed.data.simLabel !== undefined ? { simLabel: parsed.data.simLabel } : {}),
        ...(parsed.data.costCentre !== undefined ? { costCentre: parsed.data.costCentre } : {}),
      },
      select: {
        id: true, serviceReference: true, displayName: true, status: true,
        mobileNumber: true, simLabel: true, costCentre: true, retailPricePence: true,
      },
    });

    const userId = getPortalUserId(request);
    await writePortalTimelineEvent(accountId, 'CUSTOMER_SIM_METADATA_UPDATED', userId, {
      serviceId: id,
      serviceReference: existing.serviceReference,
      changes: Object.keys(parsed.data),
    });

    const changeDesc = Object.entries(parsed.data)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    await ensureSimMetadataChangeWorkItem({
      accountId,
      serviceId: id,
      displayName: updated.displayName,
      changes: `Customer updated ${changeDesc}`,
    });

    return reply.send({
      success: true,
      data: { ...updated, statusLabel: toPortalStatusLabel(updated.status) },
    });
  });

  // ── POST /api/v1/portal/fleet/:id/support ───────────────────────────────────
  app.post('/fleet/:id/support', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    const parsed = ServiceTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } });
    }

    const sim = await prisma.businessMobileService.findFirst({
      where: { id, accountId },
      select: { id: true, displayName: true, serviceReference: true, mobileNumber: true },
    });
    if (!sim) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'SIM not found' } });
    }

    const userId = getPortalUserId(request);
    const ticketNumber = genTicketNumber();
    const subject = parsed.data.subject?.trim() || `SIM support: ${sim.displayName}`;

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.businessTicket.create({
        data: {
          accountId,
          ticketNumber,
          subject,
          description: parsed.data.message,
          category: 'MOBILE',
          priority: 'NORMAL',
          status: 'OPEN',
        },
        select: { id: true, ticketNumber: true, subject: true, status: true, createdAt: true },
      });
      await tx.businessTicketThread.create({
        data: {
          ticketId: t.id,
          body: parsed.data.message,
          authorType: 'PORTAL_USER',
          authorId: userId,
          isInternal: false,
          customerVisible: true,
        },
      });
      return t;
    });

    await writePortalTimelineEvent(accountId, 'CUSTOMER_SIM_SUPPORT_REQUEST_CREATED', userId, {
      serviceId: sim.id,
      serviceReference: sim.serviceReference,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    });

    await ensureCustomerServiceRequestWorkItem({
      accountId,
      ticketId: ticket.id,
      serviceType: 'MOBILE',
      serviceId: sim.id,
      displayName: sim.displayName,
    });

    return reply.code(201).send({ success: true, data: { ticket } });
  });
}

export { PortalRoleSchema };
