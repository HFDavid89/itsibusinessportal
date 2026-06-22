import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../middleware/rbac';
import {
  CreateEnergyRecordSchema,
  PatchEnergyRecordSchema,
  CompleteCheckInSchema,
  MarkContractedSchema,
  listEnergyRecords,
  getEnergyDashboardStats,
  getEnergyRecord,
  createEnergyRecord,
  patchEnergyRecord,
  markEnergyReferred,
  markEnergyContracted,
  markEnergyLost,
  completeEnergyCheckIn,
} from '../services/energy/energy-tracking-service';

function ok<T>(data: T, meta?: object) {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

/**
 * Phase 12 — Energy account tracking routes (CRM-managed, not supplier fulfilment).
 */
export function registerEnergyServiceRoutes(app: FastifyInstance) {
  const readGuard = requirePermission('services.records.read');
  const writeGuard = requirePermission('services.records.write');

  app.get('/energy/dashboard', { preHandler: [readGuard] }, async (_req, reply) => {
    const stats = await getEnergyDashboardStats();
    return reply.send(ok(stats));
  });

  app.get('/energy', { preHandler: [readGuard] }, async (req: any, reply: any) => {
    const result = await listEnergyRecords(req.query as Record<string, string>);
    return reply.send(ok(result.records, { total: result.total, page: result.page, limit: result.limit }));
  });

  app.get('/energy/:id', { preHandler: [readGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const record = await getEnergyRecord(id);
    if (!record) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Energy record not found' } });
    return reply.send(ok(record));
  });

  app.post('/energy', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const parsed = CreateEnergyRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request' } });
    }
    const result = await createEnergyRecord(parsed.data, req.accessContext?.userId);
    if ('error' in result && result.error) return reply.code(result.error.status).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } });
    return reply.code(201).send(ok(result.record));
  });

  app.patch('/energy/:id', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = PatchEnergyRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request' } });
    }
    const result = await patchEnergyRecord(id, parsed.data, req.accessContext?.userId);
    if ('error' in result && result.error) return reply.code(result.error.status).send({ success: false, error: { code: 'NOT_FOUND', message: result.error.message } });
    return reply.send(ok(result.record));
  });

  app.post('/energy/:id/check-ins', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = CompleteCheckInSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request' } });
    }
    const result = await completeEnergyCheckIn(id, parsed.data, req.accessContext?.userId);
    if ('error' in result && result.error) return reply.code(result.error.status).send({ success: false, error: { code: 'NOT_FOUND', message: result.error.message } });
    return reply.send(ok(result.record));
  });

  app.post('/energy/:id/mark-referred', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const result = await markEnergyReferred(id, req.accessContext?.userId);
    if ('error' in result && result.error) return reply.code(result.error.status).send({ success: false, error: { code: 'NOT_FOUND', message: result.error.message } });
    return reply.send(ok(result.record));
  });

  app.post('/energy/:id/mark-contracted', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = MarkContractedSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request' } });
    }
    const result = await markEnergyContracted(id, parsed.data, req.accessContext?.userId);
    if ('error' in result && result.error) return reply.code(result.error.status).send({ success: false, error: { code: 'NOT_FOUND', message: result.error.message } });
    return reply.send(ok(result.record));
  });

  app.post('/energy/:id/mark-lost', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const result = await markEnergyLost(id, req.accessContext?.userId);
    if ('error' in result && result.error) return reply.code(result.error.status).send({ success: false, error: { code: 'NOT_FOUND', message: result.error.message } });
    return reply.send(ok(result.record));
  });
}
