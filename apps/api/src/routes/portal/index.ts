import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { hashPassword } from '@itsi-business/auth';
import {
  getPortalAccountId,
  getPortalUserId,
  portalGuard,
  assertTicketOwnedByAccount,
  assertPortalUserOwnedByAccount,
  sanitizeTicketForPortal,
} from './helpers';
import { CUSTOMER_INVOICE_STATUSES, OPEN_TICKET_STATUSES, balanceDuePence, toPortalStatusLabel } from './constants';
import { toPortalEnergyStatusLabel } from '@itsi-business/core';

const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const VALID_CATEGORIES = ['GENERAL', 'BILLING', 'MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'ACCOUNT'] as const;

const CreateTicketSchema = z.object({
  subject:     z.string().min(1).max(255),
  description: z.string().optional(),
  category:    z.enum(VALID_CATEGORIES).default('GENERAL'),
  priority:    z.enum(VALID_PRIORITIES).default('NORMAL'),
  message:     z.string().optional(),
});

const ReplySchema = z.object({
  body: z.string().min(1).max(5000),
});

const ContactDetailsSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
});

const CreatePortalUserSchema = z.object({
  email:     z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  password:  z.string().min(8).max(200),
});

const PatchPortalUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName:  z.string().min(1).max(100).optional(),
  isActive:  z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

function genTicketNumber(): string {
  return `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
}

const PORTAL_USER_SELECT = {
  id: true, email: true, firstName: true, lastName: true, realm: true, isActive: true, createdAt: true,
} as const;

export async function portalRoutes(app: FastifyInstance) {

  // ── GET /api/v1/portal/me ─────────────────────────────────────────────────
  app.get('/me', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const ctx = request.accessContext!;
    const [user, account] = await Promise.all([
      prisma.portalUser.findUnique({
        where: { id: ctx.userId },
        select: { ...PORTAL_USER_SELECT, accountId: true },
      }),
      prisma.businessAccount.findUnique({
        where: { id: accountId },
        select: { id: true, accountNumber: true, companyName: true, tradingName: true, status: true },
      }),
    ]);

    if (!user || !user.isActive || !account) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORISED', message: 'Portal user or account not found' } });
    }

    return reply.send({ success: true, data: { user, account } });
  });

  // ── GET /api/v1/portal/account ────────────────────────────────────────────
  app.get('/account', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const [account, sites, contacts] = await Promise.all([
      prisma.businessAccount.findUnique({
        where: { id: accountId },
        select: {
          id: true, accountNumber: true, companyName: true, tradingName: true,
          companyNumber: true, vatNumber: true, status: true, createdAt: true,
        },
      }),
      prisma.businessSite.findMany({
        where: { accountId },
        select: {
          id: true, name: true, addressLine1: true, addressLine2: true,
          city: true, county: true, postcode: true, isPrimary: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      }),
      prisma.businessContact.findMany({
        where: { accountId },
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          role: true, isPrimary: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }],
      }),
    ]);

    if (!account) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
    }

    return reply.send({ success: true, data: { account, sites, contacts } });
  });

  // ── PATCH /api/v1/portal/account/contact-details ──────────────────────────
  app.patch('/account/contact-details', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const parsed = ContactDetailsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    const user = await prisma.portalUser.update({
      where: { id: getPortalUserId(request) },
      data: parsed.data,
      select: PORTAL_USER_SELECT,
    });

    return reply.send({ success: true, data: user });
  });

  // ── GET /api/v1/portal/dashboard ──────────────────────────────────────────
  app.get('/dashboard', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const invoiceWhere = { accountId, status: { in: [...CUSTOMER_INVOICE_STATUSES] } };

    const [
      account,
      openTickets,
      mobileServices,
      broadbandServices,
      energyServices,
      overdueTotal,
      outstandingTotal,
      paidTotal,
      issuedCount,
      paidCount,
      recentInvoices,
      recentTickets,
    ] = await Promise.all([
      prisma.businessAccount.findUnique({
        where: { id: accountId },
        select: { companyName: true, accountNumber: true, status: true },
      }),
      prisma.businessTicket.count({
        where: { accountId, status: { in: [...OPEN_TICKET_STATUSES] } },
      }),
      prisma.businessMobileService.count({ where: { accountId, status: 'ACTIVE' } }),
      prisma.businessBroadbandService.count({ where: { accountId, status: 'ACTIVE' } }),
      prisma.businessEnergyService.count({ where: { accountId, status: 'ACTIVE' } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { ...invoiceWhere, status: 'OVERDUE' } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { ...invoiceWhere, status: { in: ['ISSUED', 'PART_PAID'] } } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { ...invoiceWhere, status: 'PAID' } }),
      prisma.businessInvoice.count({ where: { ...invoiceWhere, status: { in: ['ISSUED', 'PART_PAID'] } } }),
      prisma.businessInvoice.count({ where: { ...invoiceWhere, status: 'PAID' } }),
      prisma.businessInvoice.findMany({
        where: invoiceWhere,
        select: {
          id: true, invoiceNumber: true, status: true, totalPence: true,
          amountPaidPence: true, issueDate: true, dueDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.businessTicket.findMany({
        where: { accountId },
        select: {
          id: true, ticketNumber: true, subject: true, status: true,
          priority: true, updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const activeServices = mobileServices + broadbandServices + energyServices;

    return reply.send({
      success: true,
      data: {
        account,
        tickets: { open: openTickets, recent: recentTickets.map(sanitizeTicketForPortal) },
        services: { active: activeServices, mobile: mobileServices, broadband: broadbandServices, energy: energyServices },
        invoices: {
          overduePence: overdueTotal._sum.totalPence ?? 0,
          outstandingPence: outstandingTotal._sum.totalPence ?? 0,
          collectedPence: paidTotal._sum.totalPence ?? 0,
          issuedCount,
          paidCount,
          recent: recentInvoices.map((inv) => ({
            ...inv,
            balanceDuePence: balanceDuePence(inv.totalPence, inv.amountPaidPence),
          })),
        },
      },
    });
  });

  // ── GET /api/v1/portal/products ───────────────────────────────────────────
  app.get('/products', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const products = await prisma.businessServiceCatalogueItem.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, sku: true, name: true, description: true, serviceType: true,
        retailPricePence: true, setupFeePence: true, contractTermMonths: true, taxRate: true,
      },
      orderBy: [{ serviceType: 'asc' }, { name: 'asc' }],
      take: 200,
    });

    return reply.send({ success: true, data: products });
  });

  // ── GET /api/v1/portal/services ───────────────────────────────────────────
  app.get('/services', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const [mobile, broadband, energy] = await Promise.all([
      prisma.businessMobileService.findMany({
        where: { accountId },
        select: {
          id: true, serviceReference: true, displayName: true, status: true,
          retailPricePence: true, mobileNumber: true, simLabel: true, costCentre: true,
          contractStartDate: true, contractEndDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.businessBroadbandService.findMany({
        where: { accountId },
        select: {
          id: true, serviceReference: true, displayName: true, status: true,
          retailPricePence: true, accessTechnology: true, postcode: true, circuitLabel: true,
          contractStartDate: true, contractEndDate: true, createdAt: true,
          site: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.businessEnergyService.findMany({
        where: { accountId, customerVisible: true },
        select: {
          id: true, serviceReference: true, displayName: true, status: true,
          fuelType: true, supplierName: true,
          contractEndDate: true, renewalWindowStartDate: true, nextCheckInDate: true,
          site: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        mobile: mobile.map((s) => ({ ...s, type: 'MOBILE' as const, statusLabel: toPortalStatusLabel(s.status) })),
        broadband: broadband.map((s) => ({ ...s, type: 'BROADBAND' as const, statusLabel: toPortalStatusLabel(s.status) })),
        energy: energy.map((s) => ({
          ...s,
          type: 'ENERGY' as const,
          statusLabel: toPortalEnergyStatusLabel(s.status),
          renewalStatusLabel: s.status === 'RENEWAL_DUE' ? 'Renewal review due' : null,
          nextReviewLabel: s.nextCheckInDate ? 'Next account review scheduled' : null,
        })),
      },
    });
  });

  // ── GET /api/v1/portal/invoices ───────────────────────────────────────────
  app.get('/invoices', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { page = '1', limit = '50', status } = (request.query as Record<string, string>) ?? {};
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: any = {
      accountId,
      status: status && CUSTOMER_INVOICE_STATUSES.includes(status as any)
        ? status
        : { in: [...CUSTOMER_INVOICE_STATUSES] },
    };

    const [invoices, total] = await Promise.all([
      prisma.businessInvoice.findMany({
        where,
        select: {
          id: true, invoiceNumber: true, status: true, totalPence: true,
          amountPaidPence: true, issueDate: true, dueDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.businessInvoice.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: invoices.map((inv) => ({
        ...inv,
        balanceDuePence: balanceDuePence(inv.totalPence, inv.amountPaidPence),
      })),
      meta: { total, page: parseInt(page, 10), limit: take },
    });
  });

  // ── GET /api/v1/portal/invoices/:id ───────────────────────────────────────
  app.get('/invoices/:id', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    const invoice = await prisma.businessInvoice.findFirst({
      where: { id, accountId, status: { in: [...CUSTOMER_INVOICE_STATUSES] } },
      select: {
        id: true, invoiceNumber: true, status: true, issueDate: true, dueDate: true,
        subtotalPence: true, taxTotalPence: true, discountTotalPence: true,
        totalPence: true, amountPaidPence: true, currency: true, notes: true, createdAt: true,
        lines: {
          select: {
            id: true, description: true, serviceType: true, quantity: true,
            unitPricePence: true, discountAmountPence: true, taxRate: true,
            netAmountPence: true, taxAmountPence: true, grossAmountPence: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    }

    return reply.send({
      success: true,
      data: {
        ...invoice,
        balanceDuePence: balanceDuePence(invoice.totalPence, invoice.amountPaidPence),
      },
    });
  });

  // ── GET /api/v1/portal/tickets ────────────────────────────────────────────
  app.get('/tickets', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { page = '1', limit = '50', status } = (request.query as Record<string, string>) ?? {};
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: any = { accountId, ...(status ? { status } : {}) };

    const [tickets, total] = await Promise.all([
      prisma.businessTicket.findMany({
        where,
        select: {
          id: true, ticketNumber: true, subject: true, status: true,
          priority: true, category: true, createdAt: true, updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.businessTicket.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: tickets.map(sanitizeTicketForPortal),
      meta: { total, page: parseInt(page, 10), limit: take },
    });
  });

  // ── POST /api/v1/portal/tickets ───────────────────────────────────────────
  app.post('/tickets', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const parsed = CreateTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    const { message, ...data } = parsed.data;
    const userId = getPortalUserId(request);

    let ticketNumber = genTicketNumber();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.businessTicket.findUnique({ where: { ticketNumber } });
      if (!exists) break;
      ticketNumber = genTicketNumber();
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.businessTicket.create({
        data: { ...data, accountId, ticketNumber },
        select: {
          id: true, ticketNumber: true, subject: true, status: true,
          priority: true, category: true, createdAt: true,
        },
      });

      const initialBody = message?.trim() || data.description?.trim();
      if (initialBody) {
        await tx.businessTicketThread.create({
          data: {
            ticketId: t.id,
            body: initialBody,
            authorType: 'PORTAL_USER',
            authorId: userId,
            isInternal: false,
            customerVisible: true,
          },
        });
      }

      return t;
    });

    return reply.code(201).send({ success: true, data: sanitizeTicketForPortal(ticket) });
  });

  // ── GET /api/v1/portal/tickets/:id ────────────────────────────────────────
  app.get('/tickets/:id', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    if (!(await assertTicketOwnedByAccount(id, accountId, reply))) return;

    const ticket = await prisma.businessTicket.findFirst({
      where: { id, accountId },
      select: {
        id: true, ticketNumber: true, subject: true, description: true,
        status: true, priority: true, category: true, createdAt: true, updatedAt: true,
        threads: {
          where: { customerVisible: true, isInternal: false },
          select: { id: true, body: true, authorType: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    return reply.send({ success: true, data: sanitizeTicketForPortal(ticket) });
  });

  // ── POST /api/v1/portal/tickets/:id/replies ───────────────────────────────
  app.post('/tickets/:id/replies', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    if (!(await assertTicketOwnedByAccount(id, accountId, reply))) return;

    const parsed = ReplySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    const userId = getPortalUserId(request);
    const thread = await prisma.$transaction(async (tx) => {
      const t = await tx.businessTicketThread.create({
        data: {
          ticketId: id,
          body: parsed.data.body.trim(),
          authorType: 'PORTAL_USER',
          authorId: userId,
          isInternal: false,
          customerVisible: true,
        },
        select: { id: true, body: true, authorType: true, createdAt: true },
      });

      await tx.businessTicket.update({
        where: { id },
        data: { status: 'WAITING_INTERNAL', updatedAt: new Date() },
      });

      return t;
    });

    return reply.code(201).send({ success: true, data: thread });
  });

  // ── GET /api/v1/portal/fleet ──────────────────────────────────────────────
  app.get('/fleet', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const sims = await prisma.businessMobileService.findMany({
      where: { accountId },
      select: {
        id: true, serviceReference: true, displayName: true, status: true,
        mobileNumber: true, simLabel: true, costCentre: true, retailPricePence: true,
        contractStartDate: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return reply.send({
      success: true,
      data: sims.map((s) => ({ ...s, statusLabel: toPortalStatusLabel(s.status) })),
    });
  });

  // ── GET /api/v1/portal/users ──────────────────────────────────────────────
  app.get('/users', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const users = await prisma.portalUser.findMany({
      where: { accountId },
      select: PORTAL_USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return reply.send({ success: true, data: users });
  });

  // ── POST /api/v1/portal/users ─────────────────────────────────────────────
  app.post('/users', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const parsed = CreatePortalUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    const { email, firstName, lastName, password } = parsed.data;
    const existing = await prisma.portalUser.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
    if (existing) {
      return reply.code(409).send({ success: false, error: { code: 'CONFLICT', message: 'Email already in use' } });
    }

    const user = await prisma.portalUser.create({
      data: {
        accountId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        passwordHash: await hashPassword(password),
        realm: 'portal',
      },
      select: PORTAL_USER_SELECT,
    });

    return reply.code(201).send({ success: true, data: user });
  });

  // ── PATCH /api/v1/portal/users/:id ────────────────────────────────────────
  app.patch('/users/:id', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { id } = request.params as { id: string };
    if (!(await assertPortalUserOwnedByAccount(id, accountId, reply))) return;

    const parsed = PatchPortalUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    if (parsed.data.isActive === false && id === getPortalUserId(request)) {
      return reply.code(400).send({ success: false, error: { code: 'SELF_DEACTIVATE', message: 'Cannot deactivate your own account' } });
    }

    const user = await prisma.portalUser.update({
      where: { id },
      data: parsed.data,
      select: PORTAL_USER_SELECT,
    });

    return reply.send({ success: true, data: user });
  });
}
