import type { FastifyInstance } from 'fastify';
import { prisma } from '@itsi-business/database';
import { requireAuth, requireRealm } from '../middleware/authenticate';

export async function statsRoutes(app: FastifyInstance) {

  // ── GET /api/v1/stats/dashboard ───────────────────────────────────────────
  // Staff/platform only — never expose platform-wide totals to portal users.
  app.get('/dashboard', { preHandler: [requireAuth, requireRealm('platform', 'staff')] }, async (_req: any, reply: any) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAccounts,
      activeAccounts,
      openTickets,
      invoiceSummary,
      mobileServices,
      broadbandServices,
      energyServices,
      staffUsers,
    ] = await Promise.all([
      prisma.businessAccount.count(),
      prisma.businessAccount.count({ where: { status: 'ACTIVE' } }),
      prisma.businessTicket.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.businessInvoice.aggregate({
        _sum: { totalPence: true },
        where: {},
      }),
      prisma.businessMobileService.count({ where: { status: 'ACTIVE' } }),
      prisma.businessBroadbandService.count({ where: { status: 'ACTIVE' } }),
      prisma.businessEnergyService.count({ where: { status: 'ACTIVE' } }),
      prisma.staffUser.count({ where: { isActive: true } }),
    ]);

    const [overdueTotal, issuedTotal, paidTotal, draftCount, issuedCount, paidCount] = await Promise.all([
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { status: 'OVERDUE' } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { status: { in: ['ISSUED', 'PART_PAID'] } } }),
      prisma.businessInvoice.aggregate({ _sum: { totalPence: true }, where: { status: 'PAID' } }),
      prisma.businessInvoice.count({ where: { status: 'DRAFT' } }),
      prisma.businessInvoice.count({ where: { status: { in: ['ISSUED', 'PART_PAID'] } } }),
      prisma.businessInvoice.count({ where: { status: 'PAID' } }),
    ]);

    const activeServices = mobileServices + broadbandServices + energyServices;

    return reply.send({
      success: true,
      data: {
        accounts: {
          total:  totalAccounts,
          active: activeAccounts,
        },
        tickets: {
          open: openTickets,
        },
        services: {
          active:    activeServices,
          mobile:    mobileServices,
          broadband: broadbandServices,
          energy:    energyServices,
        },
        invoices: {
          totalPence:    invoiceSummary._sum.totalPence ?? 0,
          overduePence:  overdueTotal._sum.totalPence ?? 0,
          outstandingPence: issuedTotal._sum.totalPence ?? 0,
          collectedPence: paidTotal._sum.totalPence ?? 0,
          draftCount,
          issuedCount,
          paidCount,
        },
        staff: {
          active: staffUsers,
        },
      },
    });
  });
}
