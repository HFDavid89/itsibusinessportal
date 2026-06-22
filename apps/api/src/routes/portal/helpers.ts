import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@itsi-business/database';
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

export function getPortalUserId(request: FastifyRequest): string {
  return request.accessContext!.userId;
}

/** Reject body/query accountId that does not match the authenticated portal account. */
export function rejectForeignAccountId(
  request: FastifyRequest,
  reply: FastifyReply,
  bodyAccountId?: string,
): boolean {
  const accountId = request.accessContext?.accountId;
  if (bodyAccountId && bodyAccountId !== accountId) {
    reply.code(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Cannot access another account' },
    });
    return true;
  }
  return false;
}

export async function assertTicketOwnedByAccount(
  ticketId: string,
  accountId: string,
  reply: FastifyReply,
) {
  const ticket = await prisma.businessTicket.findFirst({
    where: { id: ticketId, accountId },
    select: { id: true },
  });
  if (!ticket) {
    reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    return null;
  }
  return ticket;
}

export async function assertPortalUserOwnedByAccount(
  userId: string,
  accountId: string,
  reply: FastifyReply,
) {
  const user = await prisma.portalUser.findFirst({
    where: { id: userId, accountId },
    select: { id: true },
  });
  if (!user) {
    reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Portal user not found' } });
    return null;
  }
  return user;
}

export function sanitizeTicketForPortal<T extends { status: string; wholesaleEscalationId?: string | null; wholesaleEscalationReference?: string | null; assignedToStaffUserId?: string | null }>(
  ticket: T,
) {
  const { wholesaleEscalationId: _a, wholesaleEscalationReference: _b, assignedToStaffUserId: _c, ...safe } = ticket;
  return safe;
}
