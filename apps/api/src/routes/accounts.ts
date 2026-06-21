import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { requirePermission } from '../middleware/rbac';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateAccountSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  tradingName: z.string().max(200).optional(),
  companyNumber: z.string().max(20).optional(),
  vatNumber: z.string().max(20).optional(),
  status: z.enum(['PROSPECT', 'ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
});

const PatchAccountSchema = CreateAccountSchema.partial();

const CreateContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  role: z.enum(['PRIMARY', 'BILLING', 'TECHNICAL', 'GENERAL']).optional(),
  isPrimary: z.boolean().optional(),
  siteId: z.string().cuid().optional(),
});

const PatchContactSchema = CreateContactSchema.partial();

const CreateSiteSchema = z.object({
  name: z.string().min(1).max(200),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  county: z.string().max(100).optional(),
  postcode: z.string().min(1).max(10),
  uprn: z.string().max(20).optional(),
  isPrimary: z.boolean().optional(),
});

const PatchSiteSchema = CreateSiteSchema.partial();

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateAccountNumber(): string {
  const prefix = 'BIZ';
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${rand}`;
}

function ok<T>(data: T, meta?: object) {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

function notFound(entity: string, id: string) {
  return { success: false, error: { code: 'NOT_FOUND', message: `${entity} ${id} not found` } };
}

function validationError(message: string) {
  return { success: false, error: { code: 'VALIDATION_ERROR', message } };
}

async function writeTimeline(accountId: string, type: string, actorId: string | undefined, meta: object) {
  try {
    await prisma.timelineEvent.create({
      data: { type, accountId, actorId, actorType: actorId ? 'STAFF' : 'SYSTEM', meta },
    });
  } catch { /* non-fatal */ }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function accountRoutes(app: FastifyInstance) {
  const readGuard = requirePermission('crm.accounts.read');
  const writeGuard = requirePermission('crm.accounts.write');
  const contactReadGuard = requirePermission('crm.contacts.read');
  const contactWriteGuard = requirePermission('crm.contacts.write');
  const siteReadGuard = requirePermission('crm.sites.read');
  const siteWriteGuard = requirePermission('crm.sites.write');

  // ── GET /api/v1/accounts ──────────────────────────────────────────────────
  app.get('/', { preHandler: [readGuard] }, async (req, reply) => {
    const { search, status, page = '1', limit = '50' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' as const } },
          { tradingName: { contains: search, mode: 'insensitive' as const } },
          { accountNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.businessAccount.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          contacts: { where: { isPrimary: true }, take: 1, orderBy: { createdAt: 'asc' } },
          _count: { select: { contacts: true, sites: true, tickets: true } },
        },
      }),
      prisma.businessAccount.count({ where }),
    ]);

    return reply.send(ok(items, { total, page: parseInt(page, 10), limit: take }));
  });

  // ── POST /api/v1/accounts ─────────────────────────────────────────────────
  app.post('/', { preHandler: [writeGuard] }, async (req, reply) => {
    const parsed = CreateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const account = await prisma.businessAccount.create({
      data: {
        ...parsed.data,
        accountNumber: generateAccountNumber(),
        status: parsed.data.status ?? 'PROSPECT',
      },
      include: { contacts: true, sites: true },
    });

    await writeTimeline(account.id, 'ACCOUNT_CREATED', req.accessContext?.userId, { companyName: account.companyName });

    return reply.code(201).send(ok(account));
  });

  // ── GET /api/v1/accounts/:id ──────────────────────────────────────────────
  app.get('/:id', { preHandler: [readGuard] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const account = await prisma.businessAccount.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        sites: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        _count: { select: { tickets: true, invoices: true, mobileServices: true, broadbandServices: true } },
      },
    });

    if (!account) return reply.code(404).send(notFound('Account', id));
    return reply.send(ok(account));
  });

  // ── PATCH /api/v1/accounts/:id ────────────────────────────────────────────
  app.patch('/:id', { preHandler: [writeGuard] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = PatchAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const exists = await prisma.businessAccount.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return reply.code(404).send(notFound('Account', id));

    const account = await prisma.businessAccount.update({
      where: { id },
      data: parsed.data,
      include: { contacts: true, sites: true },
    });

    await writeTimeline(account.id, 'ACCOUNT_UPDATED', req.accessContext?.userId, parsed.data);

    return reply.send(ok(account));
  });

  // ── GET /api/v1/accounts/:accountId/contacts ──────────────────────────────
  app.get('/:accountId/contacts', { preHandler: [contactReadGuard] }, async (req, reply) => {
    const { accountId } = req.params as { accountId: string };

    const exists = await prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!exists) return reply.code(404).send(notFound('Account', accountId));

    const contacts = await prisma.businessContact.findMany({
      where: { accountId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return reply.send(ok(contacts, { total: contacts.length }));
  });

  // ── POST /api/v1/accounts/:accountId/contacts ─────────────────────────────
  app.post('/:accountId/contacts', { preHandler: [contactWriteGuard] }, async (req, reply) => {
    const { accountId } = req.params as { accountId: string };
    const parsed = CreateContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const exists = await prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!exists) return reply.code(404).send(notFound('Account', accountId));

    if (parsed.data.siteId) {
      const siteExists = await prisma.businessSite.findFirst({ where: { id: parsed.data.siteId, accountId }, select: { id: true } });
      if (!siteExists) return reply.code(404).send(notFound('Site', parsed.data.siteId));
    }

    if (parsed.data.isPrimary) {
      await prisma.businessContact.updateMany({ where: { accountId }, data: { isPrimary: false } });
    }

    const contact = await prisma.businessContact.create({
      data: { ...parsed.data, accountId, role: parsed.data.role ?? 'GENERAL' },
    });

    await writeTimeline(accountId, 'CONTACT_ADDED', req.accessContext?.userId, { contactId: contact.id, name: `${contact.firstName} ${contact.lastName}` });

    return reply.code(201).send(ok(contact));
  });

  // ── PATCH /api/v1/accounts/:accountId/contacts/:contactId ─────────────────
  app.patch('/:accountId/contacts/:contactId', { preHandler: [contactWriteGuard] }, async (req, reply) => {
    const { accountId, contactId } = req.params as { accountId: string; contactId: string };
    const parsed = PatchContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const existing = await prisma.businessContact.findFirst({ where: { id: contactId, accountId } });
    if (!existing) return reply.code(404).send(notFound('Contact', contactId));

    if (parsed.data.isPrimary) {
      await prisma.businessContact.updateMany({ where: { accountId }, data: { isPrimary: false } });
    }

    const contact = await prisma.businessContact.update({ where: { id: contactId }, data: parsed.data });
    await writeTimeline(accountId, 'CONTACT_UPDATED', req.accessContext?.userId, { contactId });

    return reply.send(ok(contact));
  });

  // ── GET /api/v1/accounts/:accountId/sites ────────────────────────────────
  app.get('/:accountId/sites', { preHandler: [siteReadGuard] }, async (req, reply) => {
    const { accountId } = req.params as { accountId: string };

    const exists = await prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!exists) return reply.code(404).send(notFound('Account', accountId));

    const sites = await prisma.businessSite.findMany({
      where: { accountId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      include: { _count: { select: { contacts: true } } },
    });

    return reply.send(ok(sites, { total: sites.length }));
  });

  // ── POST /api/v1/accounts/:accountId/sites ────────────────────────────────
  app.post('/:accountId/sites', { preHandler: [siteWriteGuard] }, async (req, reply) => {
    const { accountId } = req.params as { accountId: string };
    const parsed = CreateSiteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const exists = await prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!exists) return reply.code(404).send(notFound('Account', accountId));

    if (parsed.data.isPrimary) {
      await prisma.businessSite.updateMany({ where: { accountId }, data: { isPrimary: false } });
    }

    const site = await prisma.businessSite.create({
      data: { ...parsed.data, accountId },
      include: { _count: { select: { contacts: true } } },
    });

    await writeTimeline(accountId, 'SITE_ADDED', req.accessContext?.userId, { siteId: site.id, name: site.name });

    return reply.code(201).send(ok(site));
  });

  // ── PATCH /api/v1/accounts/:accountId/sites/:siteId ──────────────────────
  app.patch('/:accountId/sites/:siteId', { preHandler: [siteWriteGuard] }, async (req, reply) => {
    const { accountId, siteId } = req.params as { accountId: string; siteId: string };
    const parsed = PatchSiteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const existing = await prisma.businessSite.findFirst({ where: { id: siteId, accountId } });
    if (!existing) return reply.code(404).send(notFound('Site', siteId));

    if (parsed.data.isPrimary) {
      await prisma.businessSite.updateMany({ where: { accountId }, data: { isPrimary: false } });
    }

    const site = await prisma.businessSite.update({
      where: { id: siteId },
      data: parsed.data,
      include: { _count: { select: { contacts: true } } },
    });

    await writeTimeline(accountId, 'SITE_UPDATED', req.accessContext?.userId, { siteId });

    return reply.send(ok(site));
  });

  // ── GET /api/v1/accounts/:accountId/timeline ──────────────────────────────
  app.get('/:accountId/timeline', { preHandler: [readGuard] }, async (req, reply) => {
    const { accountId } = req.params as { accountId: string };
    const { page = '1', limit = '30' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 30, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const exists = await prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!exists) return reply.code(404).send(notFound('Account', accountId));

    const [items, total] = await Promise.all([
      prisma.timelineEvent.findMany({
        where: { accountId },
        orderBy: { occurredAt: 'desc' },
        take,
        skip,
      }),
      prisma.timelineEvent.count({ where: { accountId } }),
    ]);

    return reply.send(ok(items, { total, page: parseInt(page, 10), limit: take }));
  });
}
