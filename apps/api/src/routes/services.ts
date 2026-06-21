import type { FastifyInstance } from 'fastify';
const NI = { error: 'NOT_IMPLEMENTED', message: 'Business Services — scaffold placeholder' };
export async function serviceRoutes(app: FastifyInstance) {
  app.get('/mobile', async (_req, reply) => reply.code(501).send(NI));
  app.get('/broadband', async (_req, reply) => reply.code(501).send(NI));
  app.get('/energy', async (_req, reply) => reply.code(501).send(NI));
  app.post('/mobile', async (_req, reply) => reply.code(501).send(NI));
  app.post('/broadband', async (_req, reply) => reply.code(501).send(NI));
}
