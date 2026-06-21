import type { FastifyInstance } from 'fastify';
const NI = { error: 'NOT_IMPLEMENTED', message: 'Business Tickets — scaffold placeholder' };
export async function ticketRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => reply.code(501).send(NI));
  app.post('/', async (_req, reply) => reply.code(501).send(NI));
  app.get('/:id', async (_req, reply) => reply.code(501).send(NI));
  app.patch('/:id', async (_req, reply) => reply.code(501).send(NI));
  app.post('/:id/escalate', async (_req, reply) => reply.code(501).send(NI));
}
