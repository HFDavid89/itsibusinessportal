import type { FastifyRequest, FastifyReply } from 'fastify';
import { requireRealm } from '../../middleware/authenticate';

export const portalGuard = { preHandler: [requireRealm('portal')] };

export function getPortalAccountId(request: FastifyRequest, reply: FastifyReply): string | null {
  const accountId = request.accessContext?.accountId;
  if (!accountId) {
    reply.code(403).send({
      success: false,
      error: { code: 'NO_ACCOUNT', message: 'Portal user is not linked to a business account' },
    });
    return null;
  }
  return accountId;
}
