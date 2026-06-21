import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { requirePermission } from '../middleware/rbac';

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_STATUSES_MOBILE_BB = ['DRAFT', 'REQUESTED', 'ACTIVE', 'SUSPENDED', 'CEASED', 'CANCELLED'] as const;
const SERVICE_STATUSES_ENERGY    = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'CEASED'] as const;
const FUEL_TYPES                 = ['ELECTRICITY', 'GAS', 'DUAL_FUEL'] as const;

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

function serviceRefSeq(prefix: string): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

async function writeTimeline(accountId: string, type: string, actorId: string | undefined, meta: object) {
  try {
    await prisma.timelineEvent.create({
      data: { type, accountId, actorId, actorType: actorId ? 'STAFF' : 'SYSTEM', meta },
    });
  } catch { /* non-fatal */ }
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateMobileServiceSchema = z.object({
  accountId:        z.string().min(1),
  contactId:        z.string().optional(),
  siteId:           z.string().optional(),
  catalogueItemId:  z.string().optional(),
  displayName:      z.string().min(1).max(200),
  status:           z.enum(SERVICE_STATUSES_MOBILE_BB).optional(),
  retailPricePence: z.number().int().min(0).default(0),
  contractStartDate: z.string().datetime().optional(),
  contractEndDate:   z.string().datetime().optional(),
  mobileNumber:     z.string().max(20).optional(),
  simLabel:         z.string().max(100).optional(),
  costCentre:       z.string().max(100).optional(),
});

const PatchMobileServiceSchema = CreateMobileServiceSchema.omit({ accountId: true }).partial();

const CreateBroadbandServiceSchema = z.object({
  accountId:        z.string().min(1),
  siteId:           z.string().min(1),
  catalogueItemId:  z.string().optional(),
  displayName:      z.string().min(1).max(200),
  status:           z.enum(SERVICE_STATUSES_MOBILE_BB).optional(),
  retailPricePence: z.number().int().min(0).default(0),
  contractStartDate: z.string().datetime().optional(),
  contractEndDate:   z.string().datetime().optional(),
  accessTechnology: z.string().max(100).optional(),
  postcode:         z.string().min(1).max(10),
  uprn:             z.string().max(20).optional(),
  circuitLabel:     z.string().max(100).optional(),
});

const PatchBroadbandServiceSchema = CreateBroadbandServiceSchema.omit({ accountId: true, siteId: true }).partial();

const CreateEnergyServiceSchema = z.object({
  accountId:             z.string().min(1),
  siteId:                z.string().min(1),
  catalogueItemId:       z.string().optional(),
  displayName:           z.string().min(1).max(200),
  status:                z.enum(SERVICE_STATUSES_ENERGY).optional(),
  fuelType:              z.enum(FUEL_TYPES).default('ELECTRICITY'),
  meterPointReference:   z.string().max(100).optional(),
  retailPriceDescription: z.string().max(500).optional(),
  contractStartDate:     z.string().datetime().optional(),
  contractEndDate:       z.string().datetime().optional(),
});

const PatchEnergyServiceSchema = CreateEnergyServiceSchema.omit({ accountId: true, siteId: true }).partial();

const CreateWholesaleLinkSchema = z.object({
  businessServiceType:      z.enum(['MOBILE', 'BROADBAND']),
  businessServiceReference: z.string().min(1).max(200),
  itsiMobileWholesaleOrderId: z.string().max(200).optional(),
  itsiMobileServiceOrderId:   z.string().max(200).optional(),
  safeProviderReference:      z.string().max(200).optional(),
});

// ── Catalogue item include shape (reused) ─────────────────────────────────────

const CATALOGUE_SELECT = {
  id: true, sku: true, name: true, serviceType: true, retailPricePence: true,
  contractTermMonths: true, status: true,
} as const;

// ── Route plugin ──────────────────────────────────────────────────────────────

export async function serviceRoutes(app: FastifyInstance) {
  const readGuard          = requirePermission('services.records.read');
  const writeGuard         = requirePermission('services.records.write');
  const wlReadGuard        = requirePermission('services.wholesale_links.read');
  const wlWriteGuard       = requirePermission('services.wholesale_links.write');

  // ── GET /api/v1/services — aggregate list ─────────────────────────────────
  app.get('/', { preHandler: [readGuard] }, async (req: any, reply: any) => {
    const { accountId, type, status, page = '1', limit = '50' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const baseWhere = (extra: object) => ({
      ...(accountId ? { accountId } : {}),
      ...(status    ? { status }    : {}),
      ...extra,
    });

    const fetchMobile    = (!type || type === 'MOBILE')    ? prisma.businessMobileService.findMany({ where: baseWhere({}), skip, take, orderBy: { createdAt: 'desc' }, include: { account: { select: { id: true, companyName: true, accountNumber: true } }, catalogueItem: { select: CATALOGUE_SELECT } } }) : Promise.resolve([]);
    const fetchBroadband = (!type || type === 'BROADBAND') ? prisma.businessBroadbandService.findMany({ where: baseWhere({}), skip, take, orderBy: { createdAt: 'desc' }, include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT } } }) : Promise.resolve([]);
    const fetchEnergy    = (!type || type === 'ENERGY')    ? prisma.businessEnergyService.findMany({ where: baseWhere({}), skip, take, orderBy: { createdAt: 'desc' }, include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT } } }) : Promise.resolve([]);

    const [mobile, broadband, energy] = await Promise.all([fetchMobile, fetchBroadband, fetchEnergy]);

    const all = [
      ...mobile.map((s: any) => ({ ...s, _serviceType: 'MOBILE' })),
      ...broadband.map((s: any) => ({ ...s, _serviceType: 'BROADBAND' })),
      ...energy.map((s: any) => ({ ...s, _serviceType: 'ENERGY' })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return reply.send(ok(all, { total: all.length, page: parseInt(page, 10), limit: take }));
  });

  // ── GET /api/v1/services/:id — universal lookup ───────────────────────────
  app.get('/:id', { preHandler: [readGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };

    const [mobile, broadband, energy] = await Promise.all([
      prisma.businessMobileService.findUnique({ where: { id }, include: { account: { select: { id: true, companyName: true, accountNumber: true } }, catalogueItem: { select: CATALOGUE_SELECT }, wholesaleLink: true } }),
      prisma.businessBroadbandService.findUnique({ where: { id }, include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT }, wholesaleLink: true } }),
      prisma.businessEnergyService.findUnique({ where: { id }, include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT } } }),
    ]);

    const record = mobile ?? broadband ?? energy;
    if (!record) return reply.code(404).send(notFound('Service', id));

    const serviceType = mobile ? 'MOBILE' : broadband ? 'BROADBAND' : 'ENERGY';
    return reply.send(ok({ ...record, _serviceType: serviceType }));
  });

  // ── POST /api/v1/services/mobile ──────────────────────────────────────────
  app.post('/mobile', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const parsed = CreateMobileServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i: { message: string }) => i.message).join(', ')));
    }

    const { accountId, contactId, siteId, catalogueItemId, displayName, status, retailPricePence, contractStartDate, contractEndDate, mobileNumber, simLabel, costCentre } = parsed.data;

    const account = await prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!account) return reply.code(404).send(notFound('Account', accountId));

    if (catalogueItemId) {
      const ci = await prisma.businessServiceCatalogueItem.findUnique({ where: { id: catalogueItemId }, select: { id: true, serviceType: true } });
      if (!ci) return reply.code(404).send(notFound('Catalogue item', catalogueItemId));
      if (ci.serviceType !== 'MOBILE') return reply.code(400).send({ success: false, error: { code: 'TYPE_MISMATCH', message: 'Catalogue item is not a MOBILE service' } });
    }

    const serviceReference = serviceRefSeq('MOB');
    const service = await prisma.businessMobileService.create({
      data: {
        accountId,
        contactId:        contactId ?? null,
        siteId:           siteId    ?? null,
        catalogueItemId:  catalogueItemId ?? null,
        serviceReference,
        displayName,
        status:           status ?? 'DRAFT',
        retailPricePence,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate:   contractEndDate   ? new Date(contractEndDate)   : null,
        mobileNumber:     mobileNumber ?? null,
        simLabel:         simLabel     ?? null,
        costCentre:       costCentre   ?? null,
      },
      include: { account: { select: { id: true, companyName: true, accountNumber: true } }, catalogueItem: { select: CATALOGUE_SELECT } },
    });

    await writeTimeline(accountId, 'MOBILE_SERVICE_CREATED', (req as any).accessContext?.userId,
      { serviceId: service.id, serviceReference, displayName });

    return reply.code(201).send(ok(service));
  });

  // ── PATCH /api/v1/services/mobile/:id ────────────────────────────────────
  app.patch('/mobile/:id', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = PatchMobileServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i: { message: string }) => i.message).join(', ')));
    }

    const existing = await prisma.businessMobileService.findUnique({ where: { id }, select: { id: true, accountId: true, serviceReference: true } });
    if (!existing) return reply.code(404).send(notFound('Mobile service', id));

    const data: any = { ...parsed.data };
    if (data.contractStartDate) data.contractStartDate = new Date(data.contractStartDate);
    if (data.contractEndDate)   data.contractEndDate   = new Date(data.contractEndDate);

    const service = await prisma.businessMobileService.update({
      where: { id },
      data,
      include: { account: { select: { id: true, companyName: true, accountNumber: true } }, catalogueItem: { select: CATALOGUE_SELECT } },
    });

    await writeTimeline(existing.accountId, 'MOBILE_SERVICE_UPDATED', (req as any).accessContext?.userId,
      { serviceId: id, serviceReference: existing.serviceReference, changes: Object.keys(parsed.data) });

    return reply.send(ok(service));
  });

  // ── POST /api/v1/services/broadband ───────────────────────────────────────
  app.post('/broadband', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const parsed = CreateBroadbandServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i: { message: string }) => i.message).join(', ')));
    }

    const { accountId, siteId, catalogueItemId, displayName, status, retailPricePence, contractStartDate, contractEndDate, accessTechnology, postcode, uprn, circuitLabel } = parsed.data;

    const [account, site] = await Promise.all([
      prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } }),
      prisma.businessSite.findFirst({ where: { id: siteId, accountId }, select: { id: true } }),
    ]);
    if (!account) return reply.code(404).send(notFound('Account', accountId));
    if (!site)    return reply.code(404).send(notFound('Site', siteId));

    if (catalogueItemId) {
      const ci = await prisma.businessServiceCatalogueItem.findUnique({ where: { id: catalogueItemId }, select: { id: true, serviceType: true } });
      if (!ci) return reply.code(404).send(notFound('Catalogue item', catalogueItemId));
      if (ci.serviceType !== 'BROADBAND') return reply.code(400).send({ success: false, error: { code: 'TYPE_MISMATCH', message: 'Catalogue item is not a BROADBAND service' } });
    }

    const serviceReference = serviceRefSeq('BB');
    const service = await prisma.businessBroadbandService.create({
      data: {
        accountId, siteId,
        catalogueItemId:  catalogueItemId ?? null,
        serviceReference,
        displayName,
        status:           status ?? 'DRAFT',
        retailPricePence,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate:   contractEndDate   ? new Date(contractEndDate)   : null,
        accessTechnology: accessTechnology ?? null,
        postcode,
        uprn:         uprn         ?? null,
        circuitLabel: circuitLabel ?? null,
      },
      include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT } },
    });

    await writeTimeline(accountId, 'BROADBAND_SERVICE_CREATED', (req as any).accessContext?.userId,
      { serviceId: service.id, serviceReference, displayName, postcode });

    return reply.code(201).send(ok(service));
  });

  // ── PATCH /api/v1/services/broadband/:id ─────────────────────────────────
  app.patch('/broadband/:id', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = PatchBroadbandServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i: { message: string }) => i.message).join(', ')));
    }

    const existing = await prisma.businessBroadbandService.findUnique({ where: { id }, select: { id: true, accountId: true, serviceReference: true } });
    if (!existing) return reply.code(404).send(notFound('Broadband service', id));

    const data: any = { ...parsed.data };
    if (data.contractStartDate) data.contractStartDate = new Date(data.contractStartDate);
    if (data.contractEndDate)   data.contractEndDate   = new Date(data.contractEndDate);

    const service = await prisma.businessBroadbandService.update({
      where: { id },
      data,
      include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT } },
    });

    await writeTimeline(existing.accountId, 'BROADBAND_SERVICE_UPDATED', (req as any).accessContext?.userId,
      { serviceId: id, serviceReference: existing.serviceReference, changes: Object.keys(parsed.data) });

    return reply.send(ok(service));
  });

  // ── POST /api/v1/services/energy ──────────────────────────────────────────
  app.post('/energy', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const parsed = CreateEnergyServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i: { message: string }) => i.message).join(', ')));
    }

    const { accountId, siteId, catalogueItemId, displayName, status, fuelType, meterPointReference, retailPriceDescription, contractStartDate, contractEndDate } = parsed.data;

    const [account, site] = await Promise.all([
      prisma.businessAccount.findUnique({ where: { id: accountId }, select: { id: true } }),
      prisma.businessSite.findFirst({ where: { id: siteId, accountId }, select: { id: true } }),
    ]);
    if (!account) return reply.code(404).send(notFound('Account', accountId));
    if (!site)    return reply.code(404).send(notFound('Site', siteId));

    if (catalogueItemId) {
      const ci = await prisma.businessServiceCatalogueItem.findUnique({ where: { id: catalogueItemId }, select: { id: true, serviceType: true } });
      if (!ci) return reply.code(404).send(notFound('Catalogue item', catalogueItemId));
      if (ci.serviceType !== 'ENERGY') return reply.code(400).send({ success: false, error: { code: 'TYPE_MISMATCH', message: 'Catalogue item is not an ENERGY service' } });
    }

    const serviceReference = serviceRefSeq('ENE');
    const service = await prisma.businessEnergyService.create({
      data: {
        accountId, siteId,
        catalogueItemId:       catalogueItemId ?? null,
        serviceReference,
        displayName,
        status:                status   ?? 'DRAFT',
        fuelType,
        meterPointReference:   meterPointReference   ?? null,
        retailPriceDescription: retailPriceDescription ?? null,
        contractStartDate:     contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate:       contractEndDate   ? new Date(contractEndDate)   : null,
      },
      include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT } },
    });

    await writeTimeline(accountId, 'ENERGY_SERVICE_CREATED', (req as any).accessContext?.userId,
      { serviceId: service.id, serviceReference, displayName, fuelType });

    return reply.code(201).send(ok(service));
  });

  // ── PATCH /api/v1/services/energy/:id ────────────────────────────────────
  app.patch('/energy/:id', { preHandler: [writeGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = PatchEnergyServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i: { message: string }) => i.message).join(', ')));
    }

    const existing = await prisma.businessEnergyService.findUnique({ where: { id }, select: { id: true, accountId: true, serviceReference: true } });
    if (!existing) return reply.code(404).send(notFound('Energy service', id));

    const data: any = { ...parsed.data };
    if (data.contractStartDate) data.contractStartDate = new Date(data.contractStartDate);
    if (data.contractEndDate)   data.contractEndDate   = new Date(data.contractEndDate);

    const service = await prisma.businessEnergyService.update({
      where: { id },
      data,
      include: { account: { select: { id: true, companyName: true, accountNumber: true } }, site: { select: { id: true, name: true, postcode: true } }, catalogueItem: { select: CATALOGUE_SELECT } },
    });

    await writeTimeline(existing.accountId, 'ENERGY_SERVICE_UPDATED', (req as any).accessContext?.userId,
      { serviceId: id, serviceReference: existing.serviceReference, changes: Object.keys(parsed.data) });

    return reply.send(ok(service));
  });

  // ── GET /api/v1/services/:id/wholesale-link ───────────────────────────────
  app.get('/:id/wholesale-link', { preHandler: [wlReadGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };

    const [mobile, broadband] = await Promise.all([
      prisma.businessMobileService.findUnique({ where: { id }, select: { wholesaleLink: true } }),
      prisma.businessBroadbandService.findUnique({ where: { id }, select: { wholesaleLink: true } }),
    ]);

    const service = mobile ?? broadband;
    if (!service) return reply.code(404).send(notFound('Service', id));

    if (!service.wholesaleLink) {
      return reply.send({ success: true, data: null });
    }

    return reply.send(ok(service.wholesaleLink));
  });

  // ── POST /api/v1/services/:id/wholesale-link-placeholder ─────────────────
  // RULE: Creates a local placeholder reference only. NEVER calls Itsi Mobile.
  app.post('/:id/wholesale-link-placeholder', { preHandler: [wlWriteGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = CreateWholesaleLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send(validationError(parsed.error.issues.map((i: { message: string }) => i.message).join(', ')));
    }

    const { businessServiceType, businessServiceReference, itsiMobileWholesaleOrderId, itsiMobileServiceOrderId, safeProviderReference } = parsed.data;

    // Locate the service record
    const [mobile, broadband] = await Promise.all([
      businessServiceType === 'MOBILE'    ? prisma.businessMobileService.findUnique({ where: { id }, select: { id: true, accountId: true, wholesaleServiceLinkId: true, serviceReference: true } }) : Promise.resolve(null),
      businessServiceType === 'BROADBAND' ? prisma.businessBroadbandService.findUnique({ where: { id }, select: { id: true, accountId: true, wholesaleServiceLinkId: true, serviceReference: true } }) : Promise.resolve(null),
    ]);

    const serviceRecord = mobile ?? broadband;
    if (!serviceRecord) return reply.code(404).send(notFound('Service', id));

    if (serviceRecord.wholesaleServiceLinkId) {
      return reply.code(409).send({ success: false, error: { code: 'CONFLICT', message: 'Service already has a wholesale link placeholder' } });
    }

    const link = await prisma.$transaction(async (tx: any) => {
      const wl = await tx.itsiMobileWholesaleServiceLink.create({
        data: {
          businessAccountId:        serviceRecord.accountId,
          businessServiceType,
          businessServiceReference,
          itsiMobileWholesaleOrderId: itsiMobileWholesaleOrderId ?? null,
          itsiMobileServiceOrderId:   itsiMobileServiceOrderId   ?? null,
          safeProviderReference:      safeProviderReference      ?? null,
          status: 'PLACEHOLDER',
        },
      });

      if (businessServiceType === 'MOBILE') {
        await tx.businessMobileService.update({ where: { id }, data: { wholesaleServiceLinkId: wl.id } });
      } else {
        await tx.businessBroadbandService.update({ where: { id }, data: { wholesaleServiceLinkId: wl.id } });
      }

      await tx.timelineEvent.create({
        data: {
          type: 'WHOLESALE_LINK_PLACEHOLDER_CREATED',
          accountId: serviceRecord.accountId,
          actorId: (req as any).accessContext?.userId ?? null,
          actorType: 'STAFF',
          meta: { serviceId: id, serviceReference: serviceRecord.serviceReference, businessServiceType, linkId: wl.id },
        },
      });

      return wl;
    });

    return reply.code(201).send(ok(link));
  });
}
