import type { FastifyInstance } from 'fastify';
const NI = { error: 'NOT_IMPLEMENTED', message: 'Business Contacts — scaffold placeholder' };
export async function contactRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => reply.code(501).send(NI));
  app.post('/', async (_req, reply) => reply.code(501).send(NI));
  app.get('/:id', async (_req, reply) => reply.code(501).send(NI));
  app.patch('/:id', async (_req, reply) => reply.code(501).send(NI));
}
