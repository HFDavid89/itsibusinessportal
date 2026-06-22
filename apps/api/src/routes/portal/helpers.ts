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

/** Customer-safe timeline event types for portal activity feeds. */
export const PORTAL_CUSTOMER_ACTIVITY_TYPES = new Set([
  'CUSTOMER_PRODUCT_ENQUIRY_CREATED',
  'CUSTOMER_TICKET_CREATED',
  'CUSTOMER_SERVICE_TICKET_CREATED',
  'CUSTOMER_SIM_METADATA_UPDATED',
  'CUSTOMER_SIM_SUPPORT_REQUESTED',
  'ENERGY_CHECK_IN_COMPLETED',
  'ENERGY_RENEWAL_WINDOW_OPEN',
  'ENERGY_RENEWAL_WINDOW_STARTED',
  'INVOICE_ISSUED',
  'TICKET_REPLY_ADDED',
]);

const PORTAL_ACTIVITY_LABELS: Record<string, string> = {
  CUSTOMER_PRODUCT_ENQUIRY_CREATED: 'Product enquiry submitted',
  CUSTOMER_TICKET_CREATED: 'Support ticket raised',
  CUSTOMER_SERVICE_TICKET_CREATED: 'Service support request',
  CUSTOMER_SIM_METADATA_UPDATED: 'SIM details updated',
  CUSTOMER_SIM_SUPPORT_REQUESTED: 'SIM support request raised',
  ENERGY_CHECK_IN_COMPLETED: 'Energy check-in completed',
  ENERGY_RENEWAL_WINDOW_OPEN: 'Energy renewal window opened',
  ENERGY_RENEWAL_WINDOW_STARTED: 'Energy renewal window started',
  INVOICE_ISSUED: 'Invoice issued',
  TICKET_REPLY_ADDED: 'Support update',
};

export function toPortalActivityLabel(type: string): string {
  return PORTAL_ACTIVITY_LABELS[type] ?? 'Account update';
}

export function isCustomerSafeActivityType(type: string): boolean {
  return PORTAL_CUSTOMER_ACTIVITY_TYPES.has(type);
}
