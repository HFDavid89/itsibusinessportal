import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRealm } from '../middleware/authenticate';
import { requireAnyPermission, requirePermission } from '../middleware/rbac';
import { parseReportQuery } from '../services/reporting/query';
import {
  getOverviewReport,
  getBillingReport,
  getServicesReport,
  getDeskReport,
  getWorkItemsReport,
  getEnergyReport,
  getProductsReport,
  getAccountsReport,
} from '../services/reporting/report-service';

const staffGuard = { preHandler: [requireAuth, requireRealm('platform', 'staff')] };

export async function reportRoutes(app: FastifyInstance) {
  app.get('/overview', {
    preHandler: [...staffGuard.preHandler, requirePermission('reports.read')],
  }, async (request, reply) => {
    const data = await getOverviewReport(request.accessContext?.userId);
    return reply.send({ success: true, data });
  });

  app.get('/billing', {
    preHandler: [...staffGuard.preHandler, requireAnyPermission('reports.read', 'reports.billing.read')],
  }, async (request, reply) => {
    const q = parseReportQuery(request.query as Record<string, string | undefined>);
    const data = await getBillingReport({ from: q.from, to: q.to }, q.accountId);
    return reply.send({ success: true, data });
  });

  app.get('/services', {
    preHandler: [...staffGuard.preHandler, requireAnyPermission('reports.read', 'reports.operations.read')],
  }, async (request, reply) => {
    const q = parseReportQuery(request.query as Record<string, string | undefined>);
    const data = await getServicesReport(q.accountId);
    return reply.send({ success: true, data });
  });

  app.get('/desk', {
    preHandler: [...staffGuard.preHandler, requireAnyPermission('reports.read', 'reports.operations.read')],
  }, async (request, reply) => {
    const q = parseReportQuery(request.query as Record<string, string | undefined>);
    const data = await getDeskReport({ from: q.from, to: q.to }, q.accountId);
    return reply.send({ success: true, data });
  });

  app.get('/work-items', {
    preHandler: [...staffGuard.preHandler, requireAnyPermission('reports.read', 'reports.operations.read')],
  }, async (request, reply) => {
    const q = parseReportQuery(request.query as Record<string, string | undefined>);
    const data = await getWorkItemsReport(request.accessContext?.userId, { from: q.from, to: q.to }, q.accountId);
    return reply.send({ success: true, data });
  });

  app.get('/energy', {
    preHandler: [...staffGuard.preHandler, requireAnyPermission('reports.read', 'reports.energy.read')],
  }, async (request, reply) => {
    const q = parseReportQuery(request.query as Record<string, string | undefined>);
    const data = await getEnergyReport(q.accountId);
    return reply.send({ success: true, data });
  });

  app.get('/products', {
    preHandler: [...staffGuard.preHandler, requireAnyPermission('reports.read', 'reports.operations.read')],
  }, async (_request, reply) => {
    const data = await getProductsReport();
    return reply.send({ success: true, data });
  });

  app.get('/accounts', {
    preHandler: [...staffGuard.preHandler, requirePermission('reports.read')],
  }, async (_request, reply) => {
    const data = await getAccountsReport();
    return reply.send({ success: true, data });
  });
}
