import type { FastifyInstance } from 'fastify';
const NI = { error: 'NOT_IMPLEMENTED', message: 'Business Sites — scaffold placeholder' };
export async function siteRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => reply.code(501).send(NI));
  app.post('/', async (_req, reply) => reply.code(501).send(NI));
  app.get('/:id', async (_req, reply) => reply.code(501).send(NI));
  app.patch('/:id', async (_req, reply) => reply.code(501).send(NI));
}
