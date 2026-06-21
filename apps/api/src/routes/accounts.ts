import type { FastifyInstance } from 'fastify';

const NOT_IMPLEMENTED = { error: 'NOT_IMPLEMENTED', message: 'Business Accounts — scaffold placeholder' };

export async function accountRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => reply.code(501).send(NOT_IMPLEMENTED));
  app.post('/', async (_req, reply) => reply.code(501).send(NOT_IMPLEMENTED));
  app.get('/:id', async (_req, reply) => reply.code(501).send(NOT_IMPLEMENTED));
  app.patch('/:id', async (_req, reply) => reply.code(501).send(NOT_IMPLEMENTED));
}
