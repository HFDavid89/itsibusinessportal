import type { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    return reply.code(501).send({ error: 'NOT_IMPLEMENTED', message: 'Auth not yet implemented' });
  });

  app.post('/logout', async (request, reply) => {
    return reply.code(501).send({ error: 'NOT_IMPLEMENTED', message: 'Auth not yet implemented' });
  });

  app.get('/me', async (request, reply) => {
    return reply.code(501).send({ error: 'NOT_IMPLEMENTED', message: 'Auth not yet implemented' });
  });
}
