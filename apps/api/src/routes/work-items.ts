import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../middleware/rbac';
const WorkItemTypeSchema = z.enum([
  'WHOLESALE_ORDER',
  'WHOLESALE_STATUS_REVIEW',
  'CUSTOMER_SERVICE_REQUEST',
  'SIM_METADATA_CHANGE',
  'PRODUCT_ENQUIRY',
  'ENERGY_REVIEW',
  'BILLING_QUERY',
  'SUPPORT_ESCALATION',
]);

import {
  createWorkItem,
  listWorkItems,
  getWorkItemById,
  getWorkQueueStats,
  assignWorkItem,
  startWorkItem,
  resolveWorkItem,
  cancelWorkItem,
  addWorkItemComment,
  patchWorkItem,
  enrichWorkItem,
} from '../services/work-items/work-item-service';

const VALID_STATUSES = [
  'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL',
  'WAITING_ITSI_MOBILE', 'RESOLVED', 'CANCELLED',
] as const;

const CreateWorkItemSchema = z.object({
  type: WorkItemTypeSchema,
  status: z.enum(VALID_STATUSES).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  accountId: z.string().min(1),
  serviceType: z.enum(['MOBILE', 'BROADBAND', 'ENERGY']).optional(),
  serviceId: z.string().optional(),
  ticketId: z.string().optional(),
  wholesaleLinkId: z.string().optional(),
  assignedToStaffUserId: z.string().optional(),
  source: z.enum(['STAFF', 'PORTAL', 'WHOLESALE_BRIDGE', 'SYSTEM']).optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
});

const PatchWorkItemSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
  assignedToStaffUserId: z.string().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const CommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

const AssignSchema = z.object({
  staffUserId: z.string().min(1),
});

const readHooks   = { onRequest: [requirePermission('work_items.read')] };
const writeHooks  = { onRequest: [requirePermission('work_items.write')] };
const assignHooks = { onRequest: [requirePermission('work_items.assign')] };
const resolveHooks = { onRequest: [requirePermission('work_items.resolve')] };
const commentHooks = { onRequest: [requirePermission('work_items.comment')] };

export async function workItemRoutes(app: FastifyInstance) {
  // GET /stats — dashboard counts
  app.get('/stats', readHooks, async (request, reply) => {
    const staffUserId = request.accessContext?.userId;
    const stats = await getWorkQueueStats(staffUserId);
    return reply.send({ success: true, data: stats });
  });

  // GET / — list with filters
  app.get('/', readHooks, async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    const assignedToMe = q.assignedToMe === 'true' ? request.accessContext?.userId : undefined;

    const result = await listWorkItems({
      status: q.status,
      priority: q.priority,
      type: q.type,
      serviceType: q.serviceType,
      accountId: q.accountId,
      ticketId: q.ticketId,
      assignedToStaffUserId: q.assignedToStaffUserId,
      assignedToMe,
      unassigned: q.unassigned === 'true',
      breached: q.breached === 'true',
      dueSoon: q.dueSoon === 'true',
      page: q.page ? parseInt(q.page, 10) : 1,
      limit: q.limit ? parseInt(q.limit, 10) : 50,
    });

    return reply.send({ success: true, data: result.items, meta: result.meta });
  });

  // POST / — create manually
  app.post('/', writeHooks, async (request, reply) => {
    const parsed = CreateWorkItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } });
    }

    const item = await createWorkItem({
      ...parsed.data,
      priority: parsed.data.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | undefined,
    });

    return reply.code(201).send({ success: true, data: item });
  });

  // GET /:id
  app.get('/:id', readHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await getWorkItemById(id);
    if (!item) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Work item not found' } });
    }
    return reply.send({ success: true, data: enrichWorkItem(item) });
  });

  // PATCH /:id
  app.patch('/:id', writeHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = PatchWorkItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } });
    }

    const existing = await getWorkItemById(id);
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Work item not found' } });
    }

    const { dueAt, ...rest } = parsed.data;
    const item = await patchWorkItem(id, {
      ...rest,
      priority: rest.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | undefined,
      dueAt: dueAt === null ? null : dueAt ? new Date(dueAt) : undefined,
    }, request.accessContext?.userId);

    return reply.send({ success: true, data: item });
  });

  // POST /:id/assign
  app.post('/:id/assign', assignHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = AssignSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'staffUserId is required' } });
    }

    const existing = await getWorkItemById(id);
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Work item not found' } });
    }

    const item = await assignWorkItem(id, parsed.data.staffUserId, request.accessContext?.userId);
    return reply.send({ success: true, data: item });
  });

  // POST /:id/start
  app.post('/:id/start', writeHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await getWorkItemById(id);
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Work item not found' } });
    }

    const item = await startWorkItem(id, request.accessContext?.userId);
    return reply.send({ success: true, data: item });
  });

  // POST /:id/resolve
  app.post('/:id/resolve', resolveHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const notes = (request.body as { internalNotes?: string } | undefined)?.internalNotes;

    const existing = await getWorkItemById(id);
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Work item not found' } });
    }

    const item = await resolveWorkItem(id, request.accessContext?.userId, notes);
    return reply.send({ success: true, data: item });
  });

  // POST /:id/cancel
  app.post('/:id/cancel', resolveHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const reason = (request.body as { reason?: string } | undefined)?.reason;

    const existing = await getWorkItemById(id);
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Work item not found' } });
    }

    const item = await cancelWorkItem(id, request.accessContext?.userId, reason);
    return reply.send({ success: true, data: item });
  });

  // POST /:id/comment
  app.post('/:id/comment', commentHooks, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = CommentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Comment body is required' } });
    }

    const existing = await getWorkItemById(id);
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Work item not found' } });
    }

    const comment = await addWorkItemComment(id, parsed.data.body, request.accessContext!.userId);
    return reply.code(201).send({ success: true, data: comment });
  });
}
