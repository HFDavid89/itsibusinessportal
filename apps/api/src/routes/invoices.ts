import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { requireAuth, requireRealm } from '../middleware/authenticate';
import { requirePermission } from '../middleware/rbac';

// ── Helpers ────────────────────────────────────────────────────────────────────

function err(code: string, message: string, status = 400) {
  return { status, body: { success: false, error: { code, message } } };
}

function money(pence: number) {
  return (pence / 100).toFixed(2);
}

function invoiceNumberSeq() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}

function recalcLine(line: {
  quantity: number;
  unitPricePence: number;
  discountAmountPence: number;
  taxRate: number;
}) {
  const gross = line.quantity * line.unitPricePence;
  const net   = Math.max(0, gross - line.discountAmountPence);
  const tax   = Math.round(net * line.taxRate / 100);
  return { netAmountPence: net, taxAmountPence: tax, grossAmountPence: net + tax };
}

async function recalcInvoiceTotals(tx: any, invoiceId: string) {
  const lines = await tx.businessInvoiceLine.findMany({ where: { invoiceId } });
  const subtotalPence    = lines.reduce((s: number, l: any) => s + l.netAmountPence, 0);
  const taxTotalPence    = lines.reduce((s: number, l: any) => s + l.taxAmountPence, 0);
  const discountTotalPence = lines.reduce((s: number, l: any) => s + l.discountAmountPence, 0);
  const totalPence       = subtotalPence + taxTotalPence;
  await tx.businessInvoice.update({
    where: { id: invoiceId },
    data: { subtotalPence, taxTotalPence, discountTotalPence, totalPence },
  });
}

// ── Zod schemas ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = ['MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'SUPPORT', 'OTHER'] as const;
const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PART_PAID', 'PAID', 'OVERDUE', 'VOID'] as const;

const CreateInvoiceSchema = z.object({
  accountId: z.string().min(1),
  dueDate:   z.string().datetime().optional(),
  notes:     z.string().max(1000).optional(),
});

const PatchInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  notes:   z.string().max(1000).optional(),
}).strict();

const AddLineSchema = z.object({
  description:             z.string().min(1).max(500),
  serviceType:             z.enum(SERVICE_TYPES).optional(),
  quantity:                z.number().int().positive().default(1),
  unitPricePence:          z.number().int().min(0),
  discountAmountPence:     z.number().int().min(0).default(0),
  taxRate:                 z.number().min(0).max(100).default(0),
  businessServiceReference: z.string().max(200).optional(),
  wholesaleCostReference:  z.string().max(200).optional(),
});

const PatchLineSchema = AddLineSchema.partial().strict();

const MarkPaidSchema = z.object({
  amountPence: z.number().int().positive(),
  method:      z.string().min(1).max(100).default('MANUAL'),
  reference:   z.string().max(200).optional(),
  notes:       z.string().max(500).optional(),
  paidAt:      z.string().datetime().optional(),
});

// ── Route plugin ───────────────────────────────────────────────────────────────

export async function invoiceRoutes(app: FastifyInstance) {
  const readHooks    = { onRequest: [requireAuth, requireRealm('staff'), requirePermission('billing.invoices.read')] };
  const writeHooks   = { onRequest: [requireAuth, requireRealm('staff'), requirePermission('billing.invoices.write')] };
  const issueHooks   = { onRequest: [requireAuth, requireRealm('staff'), requirePermission('billing.invoices.issue')] };
  const voidHooks    = { onRequest: [requireAuth, requireRealm('staff'), requirePermission('billing.invoices.void')] };
  const payHooks     = { onRequest: [requireAuth, requireRealm('staff'), requirePermission('billing.payments.record')] };

  // ── GET /api/v1/invoices ───────────────────────────────────────────────────
  app.get('/', readHooks, async (request: any, reply: any) => {
    const { status, accountId, search, page = '1', limit = '50' } = (request.query as any) ?? {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
      ...(status    && { status }),
      ...(accountId && { accountId }),
      ...(search    && { OR: [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { account: { companyName: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]}),
    };

    const [invoices, total] = await Promise.all([
      prisma.businessInvoice.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          account: { select: { id: true, companyName: true, accountNumber: true } },
          _count:  { select: { lines: true, payments: true } },
        },
      }),
      prisma.businessInvoice.count({ where }),
    ]);

    return reply.send({ success: true, data: invoices, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  });

  // ── POST /api/v1/invoices ──────────────────────────────────────────────────
  app.post('/', writeHooks, async (request: any, reply: any) => {
    const parsed = CreateInvoiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }
    const { accountId, dueDate, notes } = parsed.data;

    const account = await prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!account) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });

    const invoice = await prisma.$transaction(async (tx: any) => {
      const inv = await tx.businessInvoice.create({
        data: {
          invoiceNumber: invoiceNumberSeq(),
          accountId,
          status:    'DRAFT',
          dueDate:   dueDate ? new Date(dueDate) : null,
          notes:     notes ?? null,
        },
        include: { account: { select: { id: true, companyName: true, accountNumber: true } }, lines: true },
      });
      await tx.timelineEvent.create({
        data: { type: 'INVOICE_CREATED', accountId, actorType: 'STAFF', actorId: request.accessContext?.userId ?? null,
          meta: { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber } },
      });
      return inv;
    });

    return reply.code(201).send({ success: true, data: invoice });
  });

  // ── GET /api/v1/invoices/:id ───────────────────────────────────────────────
  app.get('/:id', readHooks, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const invoice = await prisma.businessInvoice.findUnique({
      where: { id },
      include: {
        account:  { select: { id: true, companyName: true, accountNumber: true } },
        lines:    true,
        payments: true,
      },
    });
    if (!invoice) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    return reply.send({ success: true, data: invoice });
  });

  // ── PATCH /api/v1/invoices/:id ─────────────────────────────────────────────
  app.patch('/:id', writeHooks, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const parsed = PatchInvoiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }
    const existing = await prisma.businessInvoice.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (existing.status === 'VOID') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Void invoices cannot be edited' } });
    }
    const updated = await prisma.businessInvoice.update({
      where: { id },
      data: {
        ...(parsed.data.dueDate !== undefined && { dueDate: new Date(parsed.data.dueDate) }),
        ...(parsed.data.notes   !== undefined && { notes: parsed.data.notes }),
      },
      include: { lines: true },
    });
    return reply.send({ success: true, data: updated });
  });

  // ── POST /api/v1/invoices/:id/lines ───────────────────────────────────────
  app.post('/:id/lines', writeHooks, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const parsed = AddLineSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }
    const invoice = await prisma.businessInvoice.findUnique({ where: { id }, select: { id: true, status: true, accountId: true } });
    if (!invoice) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (invoice.status !== 'DRAFT') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Lines can only be added to DRAFT invoices' } });
    }
    const { netAmountPence, taxAmountPence, grossAmountPence } = recalcLine(parsed.data);

    const line = await prisma.$transaction(async (tx: any) => {
      const l = await tx.businessInvoiceLine.create({
        data: {
          invoiceId:               id,
          description:             parsed.data.description,
          serviceType:             parsed.data.serviceType ?? null,
          quantity:                parsed.data.quantity,
          unitPricePence:          parsed.data.unitPricePence,
          discountAmountPence:     parsed.data.discountAmountPence,
          taxRate:                 parsed.data.taxRate,
          netAmountPence,
          taxAmountPence,
          grossAmountPence,
          businessServiceReference: parsed.data.businessServiceReference ?? null,
          wholesaleCostReference:   parsed.data.wholesaleCostReference ?? null,
        },
      });
      await recalcInvoiceTotals(tx, id);
      await tx.timelineEvent.create({
        data: { type: 'INVOICE_LINE_ADDED', accountId: invoice.accountId, actorType: 'STAFF', actorId: request.accessContext?.userId ?? null,
          meta: { invoiceId: id, lineId: l.id, description: l.description } },
      });
      return l;
    });
    return reply.code(201).send({ success: true, data: line });
  });

  // ── PATCH /api/v1/invoices/:id/lines/:lineId ───────────────────────────────
  app.patch('/:id/lines/:lineId', writeHooks, async (request: any, reply: any) => {
    const { id, lineId } = request.params as { id: string; lineId: string };
    const parsed = PatchLineSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }
    const invoice = await prisma.businessInvoice.findUnique({ where: { id }, select: { id: true, status: true, accountId: true } });
    if (!invoice) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (invoice.status !== 'DRAFT') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Lines can only be edited on DRAFT invoices' } });
    }
    const existing = await prisma.businessInvoiceLine.findFirst({ where: { id: lineId, invoiceId: id } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Line not found' } });

    const merged = {
      quantity:            parsed.data.quantity            ?? existing.quantity,
      unitPricePence:      parsed.data.unitPricePence      ?? existing.unitPricePence,
      discountAmountPence: parsed.data.discountAmountPence ?? existing.discountAmountPence,
      taxRate:             parsed.data.taxRate             ?? existing.taxRate,
    };
    const { netAmountPence, taxAmountPence, grossAmountPence } = recalcLine(merged);

    const line = await prisma.$transaction(async (tx: any) => {
      const l = await tx.businessInvoiceLine.update({
        where: { id: lineId },
        data: {
          ...parsed.data,
          netAmountPence,
          taxAmountPence,
          grossAmountPence,
        },
      });
      await recalcInvoiceTotals(tx, id);
      await tx.timelineEvent.create({
        data: { type: 'INVOICE_LINE_UPDATED', accountId: invoice.accountId, actorType: 'STAFF', actorId: request.accessContext?.userId ?? null,
          meta: { invoiceId: id, lineId: l.id } },
      });
      return l;
    });
    return reply.send({ success: true, data: line });
  });

  // ── DELETE /api/v1/invoices/:id/lines/:lineId ─────────────────────────────
  app.delete('/:id/lines/:lineId', writeHooks, async (request: any, reply: any) => {
    const { id, lineId } = request.params as { id: string; lineId: string };
    const invoice = await prisma.businessInvoice.findUnique({ where: { id }, select: { id: true, status: true, accountId: true } });
    if (!invoice) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (invoice.status !== 'DRAFT') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Lines can only be deleted from DRAFT invoices' } });
    }
    const line = await prisma.businessInvoiceLine.findFirst({ where: { id: lineId, invoiceId: id } });
    if (!line) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Line not found' } });

    await prisma.$transaction(async (tx: any) => {
      await tx.businessInvoiceLine.delete({ where: { id: lineId } });
      await recalcInvoiceTotals(tx, id);
      await tx.timelineEvent.create({
        data: { type: 'INVOICE_LINE_DELETED', accountId: invoice.accountId, actorType: 'STAFF', actorId: request.accessContext?.userId ?? null,
          meta: { invoiceId: id, lineId } },
      });
    });
    return reply.send({ success: true });
  });

  // ── POST /api/v1/invoices/:id/issue ───────────────────────────────────────
  app.post('/:id/issue', issueHooks, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const invoice = await prisma.businessInvoice.findUnique({
      where: { id },
      select: { id: true, status: true, accountId: true, invoiceNumber: true, _count: { select: { lines: true } } },
    });
    if (!invoice) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (invoice.status !== 'DRAFT') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Only DRAFT invoices can be issued' } });
    }
    if (invoice._count.lines === 0) {
      return reply.code(400).send({ success: false, error: { code: 'NO_LINES', message: 'Cannot issue an invoice with no line items' } });
    }
    const updated = await prisma.$transaction(async (tx: any) => {
      const inv = await tx.businessInvoice.update({
        where: { id },
        data: { status: 'ISSUED', issueDate: new Date() },
        include: { lines: true },
      });
      await tx.timelineEvent.create({
        data: { type: 'INVOICE_ISSUED', accountId: invoice.accountId, actorType: 'STAFF', actorId: request.accessContext?.userId ?? null,
          meta: { invoiceId: id, invoiceNumber: invoice.invoiceNumber } },
      });
      return inv;
    });
    return reply.send({ success: true, data: updated });
  });

  // ── POST /api/v1/invoices/:id/void ────────────────────────────────────────
  app.post('/:id/void', voidHooks, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const { reason } = (request.body as any) ?? {};
    const invoice = await prisma.businessInvoice.findUnique({ where: { id }, select: { id: true, status: true, accountId: true, invoiceNumber: true } });
    if (!invoice) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (invoice.status === 'VOID') {
      return reply.code(400).send({ success: false, error: { code: 'ALREADY_VOID', message: 'Invoice is already void' } });
    }
    if (invoice.status === 'PAID') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot void a PAID invoice. Raise a credit note instead.' } });
    }
    const updated = await prisma.$transaction(async (tx: any) => {
      const inv = await tx.businessInvoice.update({ where: { id }, data: { status: 'VOID' } });
      await tx.timelineEvent.create({
        data: { type: 'INVOICE_VOIDED', accountId: invoice.accountId, actorType: 'STAFF', actorId: request.accessContext?.userId ?? null,
          meta: { invoiceId: id, invoiceNumber: invoice.invoiceNumber, reason: reason ?? null } },
      });
      return inv;
    });
    return reply.send({ success: true, data: updated });
  });

  // ── POST /api/v1/invoices/:id/mark-paid ───────────────────────────────────
  // Manual/offline-safe. Does NOT call any payment provider.
  app.post('/:id/mark-paid', payHooks, async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const parsed = MarkPaidSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }
    const invoice = await prisma.businessInvoice.findUnique({
      where: { id },
      select: { id: true, status: true, accountId: true, invoiceNumber: true, totalPence: true, amountPaidPence: true },
    });
    if (!invoice) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    if (invoice.status === 'VOID') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot record payment against a void invoice' } });
    }
    if (invoice.status === 'DRAFT') {
      return reply.code(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot record payment against a DRAFT invoice. Issue it first.' } });
    }

    const { amountPence, method, reference, notes, paidAt } = parsed.data;

    const result = await prisma.$transaction(async (tx: any) => {
      const payment = await tx.businessPayment.create({
        data: {
          invoiceId:   id,
          accountId:   invoice.accountId,
          amountPence,
          method,
          reference:   reference ?? null,
          notes:       notes     ?? null,
          paidAt:      paidAt ? new Date(paidAt) : new Date(),
          recordedByStaffUserId: request.accessContext?.userId ?? null,
        },
      });

      const newAmountPaid = invoice.amountPaidPence + amountPence;
      const newStatus = newAmountPaid >= invoice.totalPence ? 'PAID' : 'PART_PAID';

      const inv = await tx.businessInvoice.update({
        where: { id },
        data: { amountPaidPence: newAmountPaid, status: newStatus },
        include: { lines: true, payments: true },
      });

      await tx.timelineEvent.create({
        data: { type: 'INVOICE_MARKED_PAID', accountId: invoice.accountId, actorType: 'STAFF', actorId: request.accessContext?.userId ?? null,
          meta: { invoiceId: id, invoiceNumber: invoice.invoiceNumber, amountPence, method, status: newStatus } },
      });
      return { invoice: inv, payment };
    });

    return reply.send({ success: true, data: result });
  });
}

