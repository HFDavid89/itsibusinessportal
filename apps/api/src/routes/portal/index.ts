import type { FastifyInstance } from 'fastify';
import { prisma } from '@itsi-business/database';
import { getPortalAccountId, portalGuard } from './helpers';

const OPEN_TICKET_STATUSES = ['OPEN', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'WAITING_ITSI_MOBILE'] as const;

export async function portalRoutes(app: FastifyInstance) {

  // ── GET /api/v1/portal/me ─────────────────────────────────────────────────
  app.get('/me', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const ctx = request.accessContext!;
    const [user, account] = await Promise.all([
      prisma.portalUser.findUnique({
        where: { id: ctx.userId },
        select: { id: true, email: true, firstName: true, lastName: true, realm: true, isActive: true, accountId: true },
      }),
      prisma.businessAccount.findUnique({
        where: { id: accountId },
        select: { id: true, accountNumber: true, companyName: true, tradingName: true, status: true },
      }),
    ]);

    if (!user || !user.isActive || !account) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORISED', message: 'Portal user or account not found' } });
    }

    return reply.send({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, realm: user.realm },
        account,
      },
    });
  });

  // ── GET /api/v1/portal/dashboard ──────────────────────────────────────────
  app.get('/dashboard', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const [
      openTickets,
      mobileServices,
      broadbandServices,
      energyServices,
      invoiceSummary,
      overdueTotal,
      outstandingTotal,
      paidTotal,
      draftCount,
      issuedCount,
      paidCount,
    ] = await Promise.all([
      prisma.businessTicket.count({
        where: { accountId, status: { in: [...OPEN_TICKET_STATUSES] } },
      }),
      prisma.businessMobileService.count({ where: { accountId, status: 'ACTIVE' } }),
      prisma.businessBroadbandService.count({ where: { accountId, status: 'ACTIVE' } }),
      prisma.businessEnergyService.count({ where: { accountId, status: 'ACTIVE' } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { accountId } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { accountId, status: 'OVERDUE' } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { accountId, status: { in: ['ISSUED', 'PART_PAID'] } } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { accountId, status: 'PAID' } }),
      prisma.businessInvoice.count({ where: { accountId, status: 'DRAFT' } }),
      prisma.businessInvoice.count({ where: { accountId, status: { in: ['ISSUED', 'PART_PAID'] } } }),
      prisma.businessInvoice.count({ where: { accountId, status: 'PAID' } }),
    ]);

    const activeServices = mobileServices + broadbandServices + energyServices;

    return reply.send({
      success: true,
      data: {
        tickets: { open: openTickets },
        services: { active: activeServices, mobile: mobileServices, broadband: broadbandServices, energy: energyServices },
        invoices: {
          totalPence: invoiceSummary._sum.totalPence ?? 0,
          overduePence: overdueTotal._sum.totalPence ?? 0,
          outstandingPence: outstandingTotal._sum.totalPence ?? 0,
          collectedPence: paidTotal._sum.totalPence ?? 0,
          draftCount,
          issuedCount,
          paidCount,
        },
      },
    });
  });

  // ── GET /api/v1/portal/services ───────────────────────────────────────────
  app.get('/services', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const [mobile, broadband, energy] = await Promise.all([
      prisma.businessMobileService.findMany({
        where: { accountId },
        select: { id: true, serviceReference: true, displayName: true, status: true, mobileNumber: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.businessBroadbandService.findMany({
        where: { accountId },
        select: { id: true, serviceReference: true, displayName: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.businessEnergyService.findMany({
        where: { accountId },
        select: { id: true, serviceReference: true, displayName: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        mobile: mobile.map((s) => ({ ...s, type: 'MOBILE' as const })),
        broadband: broadband.map((s) => ({ ...s, type: 'BROADBAND' as const })),
        energy: energy.map((s) => ({ ...s, type: 'ENERGY' as const })),
      },
    });
  });

  // ── GET /api/v1/portal/invoices ───────────────────────────────────────────
  app.get('/invoices', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { page = '1', limit = '50' } = (request.query as Record<string, string>) ?? {};
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [invoices, total] = await Promise.all([
      prisma.businessInvoice.findMany({
        where: { accountId },
        select: {
          id: true, invoiceNumber: true, status: true, totalPence: true,
          issueDate: true, dueDate: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.businessInvoice.count({ where: { accountId } }),
    ]);

    return reply.send({ success: true, data: invoices, meta: { total, page: parseInt(page, 10), limit: take } });
  });

  // ── GET /api/v1/portal/tickets ────────────────────────────────────────────
  app.get('/tickets', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const { page = '1', limit = '50' } = (request.query as Record<string, string>) ?? {};
    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [tickets, total] = await Promise.all([
      prisma.businessTicket.findMany({
        where: { accountId },
        select: {
          id: true, ticketNumber: true, subject: true, status: true,
          priority: true, category: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.businessTicket.count({ where: { accountId } }),
    ]);

    return reply.send({ success: true, data: tickets, meta: { total, page: parseInt(page, 10), limit: take } });
  });

  // ── GET /api/v1/portal/fleet ────────────────────────────────────────────────
  app.get('/fleet', portalGuard, async (request, reply) => {
    const accountId = getPortalAccountId(request, reply);
    if (!accountId) return;

    const sims = await prisma.businessMobileService.findMany({
      where: { accountId },
      select: {
        id: true, serviceReference: true, displayName: true, status: true,
        mobileNumber: true, simLabel: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return reply.send({ success: true, data: sims });
  });
}
