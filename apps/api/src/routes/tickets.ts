import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { requirePermission } from '../middleware/rbac';
import { listWorkItemsForTicket } from '../services/work-items/work-item-service';

const VALID_STATUSES   = ['OPEN', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'WAITING_ITSI_MOBILE', 'RESOLVED', 'CLOSED'] as const;
const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const VALID_CATEGORIES = ['GENERAL', 'BILLING', 'MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'ACCOUNT'] as const;

const CreateTicketSchema = z.object({
  accountId:   z.string().min(1),
  contactId:   z.string().optional(),
  siteId:      z.string().optional(),
  subject:     z.string().min(1).max(255),
  description: z.string().optional(),
  category:    z.enum(VALID_CATEGORIES).default('GENERAL'),
  priority:    z.enum(VALID_PRIORITIES).default('NORMAL'),
  message:     z.string().optional(),
});

const PatchTicketSchema = z.object({
  status:               z.enum(VALID_STATUSES).optional(),
  priority:             z.enum(VALID_PRIORITIES).optional(),
  category:             z.enum(VALID_CATEGORIES).optional(),
  assignedToStaffUserId: z.string().nullable().optional(),
  subject:              z.string().min(1).max(255).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const CreateThreadSchema = z.object({
  body:           z.string().min(1),
  isInternal:     z.boolean().default(false),
  customerVisible: z.boolean().default(true),
});

function genTicketNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${n}`;
}

function writeTimelineEvent(accountId: string, type: string, actorId?: string, actorType = 'STAFF', meta: Record<string, unknown> = {}) {
  return prisma.timelineEvent.create({
    data: { type, accountId, actorId, actorType, meta: meta as any },
  });
}

const readHooks   = { onRequest: [requirePermission('desk.tickets.read')] };
const writeHooks  = { onRequest: [requirePermission('desk.tickets.write')] };
const assignHooks = { onRequest: [requirePermission('desk.tickets.assign')] };
const noteHooks   = { onRequest: [requirePermission('desk.tickets.internal_notes')] };
const escHooks    = { onRequest: [requirePermission('desk.tickets.escalate')] };

export async function ticketRoutes(app: FastifyInstance) {

  // GET / — list tickets
  app.get('/', readHooks, async (request, reply) => {
    const { status, priority, category, accountId, assignedToStaffUserId, search, page = '1', limit = '50' } = (request.query as any) ?? {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      ...(status   && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(accountId && { accountId }),
      ...(assignedToStaffUserId && { assignedToStaffUserId }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [tickets, total] = await Promise.all([
      prisma.businessTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { updatedAt: 'desc' },
        include: {
          account: { select: { id: true, companyName: true, accountNumber: true } },
          threads: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, body: true, isInternal: true, createdAt: true } },
        },
      }),
      prisma.businessTicket.count({ where }),
    ]);

    return reply.send({ success: true, data: tickets, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  });

  // POST / — create ticket
  app.post('/', writeHooks, async (request, reply) => {
    const parsed = CreateTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }
    const { message, ...data } = parsed.data;

    const account = await prisma.businessAccount.findUnique({ where: { id: data.accountId }, select: { id: true } });
    if (!account) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });

    let ticketNumber = genTicketNumber();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.businessTicket.findUnique({ where: { ticketNumber } });
      if (!exists) break;
      ticketNumber = genTicketNumber();
    }

    const actorId = (request as any).jwtPayload?.userId;

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.businessTicket.create({
        data: { ...data, ticketNumber },
        include: { account: { select: { id: true, companyName: true, accountNumber: true } } },
      });

      if (message?.trim()) {
        await tx.businessTicketThread.create({
          data: {
            ticketId: t.id,
            body: message.trim(),
            authorType: 'STAFF',
            authorId: actorId ?? 'system',
            isInternal: false,
            customerVisible: true,
          },
        });
      }

      await tx.timelineEvent.create({
        data: { type: 'TICKET_CREATED', accountId: data.accountId, actorId, actorType: 'STAFF', meta: { ticketId: t.id, ticketNumber: t.ticketNumber, subject: t.subject } },
      });

      return t;
    });

    return reply.code(201).send({ success: true, data: ticket });
  });

  // GET /:id — get single ticket with threads
  app.get('/:id', readHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const ticket = await prisma.businessTicket.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, companyName: true, accountNumber: true } },
        site:    { select: { id: true, name: true, addressLine1: true, postcode: true } },
        threads: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

    const workItems = await listWorkItemsForTicket(id);
    return reply.send({ success: true, data: { ...ticket, workItems } });
  });

  // PATCH /:id — update ticket status/priority/assignment
  app.patch('/:id', writeHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = PatchTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    const existing = await prisma.businessTicket.findUnique({ where: { id }, select: { id: true, status: true, accountId: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

    const actorId = (request as any).jwtPayload?.userId;
    const { assignedToStaffUserId, ...rest } = parsed.data;

    const ticket = await prisma.businessTicket.update({
      where: { id },
      data: {
        ...rest,
        ...(assignedToStaffUserId !== undefined && { assignedToStaffUserId: assignedToStaffUserId ?? null }),
      },
    });

    if (parsed.data.status && parsed.data.status !== existing.status) {
      await writeTimelineEvent(existing.accountId, 'TICKET_STATUS_CHANGED', actorId, 'STAFF', {
        ticketId: id, from: existing.status, to: parsed.data.status,
      });
    }

    return reply.send({ success: true, data: ticket });
  });

  // GET /:id/threads — list threads (staff sees all; excludes internal by default for customer-facing callers)
  app.get('/:id/threads', readHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { includeInternal = 'true' } = (request.query as any) ?? {};
    const ticket = await prisma.businessTicket.findUnique({ where: { id }, select: { id: true } });
    if (!ticket) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

    const threads = await prisma.businessTicketThread.findMany({
      where: {
        ticketId: id,
        ...(includeInternal === 'false' && { isInternal: false }),
      },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send({ success: true, data: threads });
  });

  // POST /:id/threads — customer-visible reply
  app.post('/:id/threads', writeHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = CreateThreadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    const ticket = await prisma.businessTicket.findUnique({ where: { id }, select: { id: true, accountId: true } });
    if (!ticket) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

    const actorId = (request as any).jwtPayload?.userId;

    const thread = await prisma.businessTicketThread.create({
      data: {
        ticketId: id,
        body: parsed.data.body,
        isInternal: false,
        customerVisible: parsed.data.customerVisible,
        authorType: 'STAFF',
        authorId: actorId ?? 'system',
      },
    });

    await prisma.businessTicket.update({ where: { id }, data: { updatedAt: new Date() } });
    await writeTimelineEvent(ticket.accountId, 'TICKET_REPLY_ADDED', actorId, 'STAFF', { ticketId: id });

    return reply.code(201).send({ success: true, data: thread });
  });

  // POST /:id/internal-notes — internal staff note (not customer-visible)
  app.post('/:id/internal-notes', noteHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { body } = (request.body as any) ?? {};
    if (!body?.trim()) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'body is required' } });
    }

    const ticket = await prisma.businessTicket.findUnique({ where: { id }, select: { id: true, accountId: true } });
    if (!ticket) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

    const actorId = (request as any).jwtPayload?.userId;

    const note = await prisma.businessTicketThread.create({
      data: {
        ticketId: id,
        body: body.trim(),
        isInternal: true,
        customerVisible: false,
        authorType: 'STAFF',
        authorId: actorId ?? 'system',
      },
    });

    await prisma.businessTicket.update({ where: { id }, data: { updatedAt: new Date() } });
    await writeTimelineEvent(ticket.accountId, 'TICKET_INTERNAL_NOTE_ADDED', actorId, 'STAFF', { ticketId: id });

    return reply.code(201).send({ success: true, data: note });
  });

  // POST /:id/escalate-to-itsi-mobile — placeholder only
  app.post('/:id/escalate-to-itsi-mobile', escHooks, async (request, reply) => {
    const wholesaleEnabled = process.env.ITSI_MOBILE_WHOLESALE_ENABLED === 'true';
    if (!wholesaleEnabled) {
      return reply.code(503).send({
        success: false,
        error: {
          code: 'WHOLESALE_DISABLED',
          message: 'Escalation to Itsi Mobile is not yet enabled. Set ITSI_MOBILE_WHOLESALE_ENABLED=true to activate.',
        },
      });
    }

    const { id } = request.params as { id: string };
    const ticket = await prisma.businessTicket.findUnique({ where: { id }, select: { id: true, accountId: true } });
    if (!ticket) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

    const actorId = (request as any).jwtPayload?.userId;

    await prisma.businessTicket.update({
      where: { id },
      data: { status: 'WAITING_ITSI_MOBILE' },
    });

    await writeTimelineEvent(ticket.accountId, 'TICKET_ESCALATED_TO_ITSI_MOBILE', actorId, 'STAFF', { ticketId: id });

    return reply.send({ success: true, data: { message: 'Escalation recorded. Wholesale integration is a future placeholder.' } });
  });
}
