import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../middleware/rbac';
import {
  RequestWholesaleOrderSchema,
  requestWholesaleOrderForService,
  getWholesaleStatusForService,
  refreshWholesaleStatusForService,
  handleWholesaleOrderError,
} from '../services/wholesale/wholesale-order-service';

/**
 * Phase 10 — Wholesale order request routes on retail service records.
 * Staff-side only. Never exposed to customer portal.
 */
export function registerWholesaleOrderRoutes(app: FastifyInstance) {
  const readGuard = {
    preHandler: [
      requirePermission('services.records.read'),
      requirePermission('services.wholesale_links.read'),
      requirePermission('wholesale.read'),
    ],
  };

  const writeGuard = {
    preHandler: [
      requirePermission('services.records.write'),
      requirePermission('services.wholesale_links.write'),
      requirePermission('wholesale.write'),
    ],
  };

  const types = ['mobile', 'broadband'] as const;

  for (const type of types) {
    const serviceType = type.toUpperCase() as 'MOBILE' | 'BROADBAND';

    app.post(`/${type}/:id/request-wholesale-order`, writeGuard, async (req: any, reply: any) => {
      const { id } = req.params as { id: string };
      const parsed = RequestWholesaleOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request' } });
      }

      try {
        const result = await requestWholesaleOrderForService(serviceType, id, parsed.data, req.accessContext?.userId);
        if ('error' in result && result.error) return reply.code(result.error.status).send(result.error.body);
        return reply.code(201).send({ success: true, data: result.data });
      } catch (err) {
        const handled = handleWholesaleOrderError(err);
        return reply.code(handled.status).send(handled.body);
      }
    });

    app.get(`/${type}/:id/wholesale-status`, readGuard, async (req: any, reply: any) => {
      const { id } = req.params as { id: string };
      const result = await getWholesaleStatusForService(serviceType, id);
      if ('error' in result && result.error) return reply.code(result.error.status).send(result.error.body);
      return reply.send({ success: true, data: result.data });
    });

    app.post(`/${type}/:id/refresh-wholesale-status`, writeGuard, async (req: any, reply: any) => {
      const { id } = req.params as { id: string };
      try {
        const result = await refreshWholesaleStatusForService(serviceType, id, req.accessContext?.userId);
        if ('error' in result && result.error) return reply.code(result.error.status).send(result.error.body);
        return reply.send({ success: true, data: result.data });
      } catch (err) {
        const handled = handleWholesaleOrderError(err);
        return reply.code(handled.status).send(handled.body);
      }
    });
  }
}
