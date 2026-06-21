import type { FastifyInstance } from 'fastify';
const NI = { error: 'NOT_IMPLEMENTED', message: 'Business Invoices — scaffold placeholder' };
export async function invoiceRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => reply.code(501).send(NI));
  app.post('/', async (_req, reply) => reply.code(501).send(NI));
  app.get('/:id', async (_req, reply) => reply.code(501).send(NI));
}
