import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { requirePermission } from '../middleware/rbac';

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_TYPES = ['MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'SUPPORT', 'OTHER'] as const;
const CATALOGUE_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok<T>(data: T, meta?: object) {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

function notFound(entity: string, id: string) {
  return { success: false, error: { code: 'NOT_FOUND', message: `${entity} ${id} not found` } };
}

function validationError(message: string) {
  return { success: false, error: { code: 'VALIDATION_ERROR', message } };
}

function skuSeq(name: string, serviceType: string): string {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${serviceType.slice(0, 3)}-${slug}-${rand}`;
}

async function writeTimeline(accountId: string | null, type: string, actorId: string | undefined, meta: object) {
  if (!accountId) return;
  try {
    await prisma.timelineEvent.create({
      data: { type, accountId, actorId, actorType: actorId ? 'STAFF' : 'SYSTEM', meta },
    });
  } catch { /* non-fatal */ }
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateCatalogueItemSchema = z.object({
  sku:                        z.string().min(1).max(100).optional(),
  name:                       z.string().min(1).max(200),
  description:                z.string().max(2000).optional(),
  serviceType:                z.enum(SERVICE_TYPES),
  status:                     z.enum(CATALOGUE_STATUSES).optional(),
  retailPricePence:           z.number().int().min(0),
  wholesaleCostEstimatePence: z.number().int().min(0).optional(),
  setupFeePence:              z.number().int().min(0).optional(),
  contractTermMonths:         z.number().int().min(0).optional(),
  taxRate:                    z.number().min(0).max(100).default(20.0),
  marginPolicy:               z.string().max(500).optional(),
});

const PatchCatalogueItemSchema = CreateCatalogueItemSchema.omit({ serviceType: true }).partial();

// ── Route plugin ──────────────────────────────────────────────────────────────

export async function catalogueRoutes(app: FastifyInstance) {
  const readGuard    = requirePermission('services.catalogue.read');
  const writeGuard   = requirePermission('services.catalogue.write');
  const archiveGuard = requirePermission('services.catalogue.archive');

  // ── GET /api/v1/services/catalogue ────────────────────────────────────────
  app.get('/', { preHandler: [readGuard] }, async (req, reply) => {
    const { serviceType, status, search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: any = {
      ...(serviceType ? { serviceType } : {}),
      ...(status      ? { status }      : { status: { not: 'ARCHIVED' } }),
      ...(search ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' as const } },
          { sku:         { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.businessServiceCatalogueItem.findMany({
        where,
        take,
        skip,
        orderBy: [{ serviceType: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { mobileServices: true, broadbandServices: true, energyServices: true } },
        },
      }),
      prisma.businessServiceCatalogueItem.count({ where }),
    ]);

    return reply.send(ok(items, { total, page: parseInt(page, 10), limit: take }));
  });

  // ── POST /api/v1/services/catalogue ───────────────────────────────────────
  app.post('/', { preHandler: [writeGuard] }, async (req, reply) => {
    const parsed = CreateCatalogueItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const { sku, name, serviceType, status, taxRate, ...rest } = parsed.data;
    const resolvedSku = sku ?? skuSeq(name, serviceType);

    const existing = await prisma.businessServiceCatalogueItem.findUnique({ where: { sku: resolvedSku }, select: { id: true } });
    if (existing) {
      return reply.code(409).send({ success: false, error: { code: 'CONFLICT', message: `SKU already exists: ${resolvedSku}` } });
    }

    const item = await prisma.businessServiceCatalogueItem.create({
      data: { ...rest, sku: resolvedSku, name, serviceType, status: status ?? 'ACTIVE', taxRate },
    });

    try {
      await prisma.auditLog.create({
        data: { action: 'CATALOGUE_ITEM_CREATED', entityType: 'BusinessServiceCatalogueItem', entityId: item.id,
          actorId: (req as any).accessContext?.userId ?? null, actorType: 'STAFF',
          meta: { sku: item.sku, name: item.name, serviceType: item.serviceType } },
      });
    } catch { /* non-fatal */ }

    return reply.code(201).send(ok(item));
  });

  // ── GET /api/v1/services/catalogue/:id ────────────────────────────────────
  app.get('/:id', { preHandler: [readGuard] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const item = await prisma.businessServiceCatalogueItem.findUnique({
      where: { id },
      include: {
        _count: { select: { mobileServices: true, broadbandServices: true, energyServices: true } },
      },
    });

    if (!item) return reply.code(404).send(notFound('Catalogue item', id));
    return reply.send(ok(item));
  });

  // ── PATCH /api/v1/services/catalogue/:id ──────────────────────────────────
  app.patch('/:id', { preHandler: [writeGuard] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = PatchCatalogueItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const existing = await prisma.businessServiceCatalogueItem.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) return reply.code(404).send(notFound('Catalogue item', id));
    if (existing.status === 'ARCHIVED') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Archived catalogue items cannot be edited' } });
    }

    const item = await prisma.businessServiceCatalogueItem.update({ where: { id }, data: parsed.data });

    try {
      await prisma.auditLog.create({
        data: { action: 'CATALOGUE_ITEM_UPDATED', entityType: 'BusinessServiceCatalogueItem', entityId: item.id,
          actorId: (req as any).accessContext?.userId ?? null, actorType: 'STAFF', meta: parsed.data },
      });
    } catch { /* non-fatal */ }

    return reply.send(ok(item));
  });

  // ── POST /api/v1/services/catalogue/:id/archive ───────────────────────────
  app.post('/:id/archive', { preHandler: [archiveGuard] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const existing = await prisma.businessServiceCatalogueItem.findUnique({ where: { id }, select: { id: true, status: true, name: true, sku: true } });
    if (!existing) return reply.code(404).send(notFound('Catalogue item', id));
    if (existing.status === 'ARCHIVED') {
      return reply.code(400).send({ success: false, error: { code: 'ALREADY_ARCHIVED', message: 'Item is already archived' } });
    }

    const item = await prisma.businessServiceCatalogueItem.update({ where: { id }, data: { status: 'ARCHIVED' } });

    try {
      await prisma.auditLog.create({
        data: { action: 'CATALOGUE_ITEM_ARCHIVED', entityType: 'BusinessServiceCatalogueItem', entityId: item.id,
          actorId: (req as any).accessContext?.userId ?? null, actorType: 'STAFF',
          meta: { sku: existing.sku, name: existing.name } },
      });
    } catch { /* non-fatal */ }

    return reply.send(ok(item));
  });
}
