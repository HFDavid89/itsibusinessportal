import type { FastifyInstance } from 'fastify';

/**
 * Wholesale routes expose the Itsi Mobile API boundary to internal services.
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * These routes delegate all provider interactions to Itsi Mobile wholesale APIs.
 * They do NOT call Gamma, KCOM, MS3, or OTS Hero directly.
 */
const NI = { error: 'NOT_IMPLEMENTED', message: 'Wholesale API — scaffold placeholder. Configure ITSI_MOBILE_WHOLESALE_ENABLED and related env vars.' };

export async function wholesaleRoutes(app: FastifyInstance) {
  app.get('/status', async (_req, reply) => reply.code(501).send(NI));
  app.get('/availability', async (_req, reply) => reply.code(501).send(NI));
  app.post('/orders', async (_req, reply) => reply.code(501).send(NI));
  app.get('/orders/:id', async (_req, reply) => reply.code(501).send(NI));
  app.get('/orders/:id/status', async (_req, reply) => reply.code(501).send(NI));
  app.post('/escalations', async (_req, reply) => reply.code(501).send(NI));
  app.get('/escalations/:id', async (_req, reply) => reply.code(501).send(NI));
}
