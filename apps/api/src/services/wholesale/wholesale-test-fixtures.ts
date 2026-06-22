import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '@itsi-business/database';

export interface WholesaleTestFixture {
  accountId: string;
  accountNumber: string;
  mobileCatalogueId: string;
  broadbandCatalogueId: string;
  siteId: string;
}

let fixtureCounter = 0;
let envLoaded = false;

function loadApiEnvFile(): void {
  if (envLoaded) return;
  envLoaded = true;
  try {
    const envPath = join(__dirname, '../../../.env');
    if (!existsSync(envPath)) return;
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // Non-fatal — tests skip when DATABASE_URL is unavailable.
  }
}

function nextSuffix(): string {
  fixtureCounter += 1;
  return `13B1-${Date.now()}-${fixtureCounter}`;
}

export async function canConnectDatabase(): Promise<boolean> {
  loadApiEnvFile();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function createWholesaleTestFixture(): Promise<WholesaleTestFixture> {
  const suffix = nextSuffix();
  const accountNumber = `ACC-${suffix}`;

  const account = await prisma.businessAccount.create({
    data: {
      accountNumber,
      companyName: `13B1 Test Co ${suffix}`,
      status: 'ACTIVE',
    },
  });

  const [mobileCatalogue, broadbandCatalogue, site] = await Promise.all([
    prisma.businessServiceCatalogueItem.create({
      data: {
        sku: `MOB-SKU-${suffix}`,
        name: 'Mobile Trio Test',
        serviceType: 'MOBILE',
        contractTermMonths: 24,
      },
    }),
    prisma.businessServiceCatalogueItem.create({
      data: {
        sku: `BB-SKU-${suffix}`,
        name: 'Broadband FTTP Test',
        serviceType: 'BROADBAND',
        contractTermMonths: 24,
      },
    }),
    prisma.businessSite.create({
      data: {
        accountId: account.id,
        name: 'HQ',
        addressLine1: '1 Test Street',
        addressLine2: 'Floor 2',
        city: 'London',
        postcode: 'EC1A1BB',
        uprn: '100023336956',
        isPrimary: true,
      },
    }),
  ]);

  return {
    accountId: account.id,
    accountNumber,
    mobileCatalogueId: mobileCatalogue.id,
    broadbandCatalogueId: broadbandCatalogue.id,
    siteId: site.id,
  };
}

export async function createDraftMobileService(
  fixture: WholesaleTestFixture,
  options?: { status?: string; serviceReference?: string },
) {
  const suffix = nextSuffix();
  return prisma.businessMobileService.create({
    data: {
      accountId: fixture.accountId,
      catalogueItemId: fixture.mobileCatalogueId,
      serviceReference: options?.serviceReference ?? `SVC-MOB-${suffix}`,
      displayName: 'Test Mobile',
      status: options?.status ?? 'DRAFT',
      retailPricePence: 1500,
    },
    include: {
      account: { select: { id: true, accountNumber: true, companyName: true } },
      catalogueItem: { select: { id: true, sku: true, name: true, serviceType: true, contractTermMonths: true } },
      wholesaleLink: true,
    },
  });
}

export async function createDraftBroadbandService(
  fixture: WholesaleTestFixture,
  options?: { status?: string; postcode?: string; serviceReference?: string },
) {
  const suffix = nextSuffix();
  return prisma.businessBroadbandService.create({
    data: {
      accountId: fixture.accountId,
      siteId: fixture.siteId,
      catalogueItemId: fixture.broadbandCatalogueId,
      serviceReference: options?.serviceReference ?? `SVC-BB-${suffix}`,
      displayName: 'Test Broadband',
      status: options?.status ?? 'DRAFT',
      postcode: options?.postcode ?? 'EC1A1BB',
      uprn: '100023336956',
      accessTechnology: 'FTTP',
      retailPricePence: 2500,
    },
    include: {
      account: { select: { id: true, accountNumber: true, companyName: true } },
      catalogueItem: { select: { id: true, sku: true, name: true, serviceType: true, contractTermMonths: true } },
      site: {
        select: {
          id: true, name: true, postcode: true, uprn: true,
          addressLine1: true, addressLine2: true, city: true,
        },
      },
      wholesaleLink: true,
    },
  });
}

export async function createLinkedMobileService(
  fixture: WholesaleTestFixture,
  options?: { retailStatus?: string; orderId?: string; upstreamStatus?: string },
) {
  const service = await createDraftMobileService(fixture, { status: options?.retailStatus ?? 'REQUESTED' });
  const link = await prisma.itsiMobileWholesaleServiceLink.create({
    data: {
      businessAccountId: fixture.accountId,
      businessServiceType: 'MOBILE',
      businessServiceReference: service.serviceReference,
      itsiMobileWholesaleOrderId: options?.orderId ?? 'legacy-mobile-ord-1',
      status: 'PENDING',
      lastStatusResponse: {
        orderId: options?.orderId ?? 'legacy-mobile-ord-1',
        status: options?.upstreamStatus ?? 'SUBMITTED',
        lastUpdatedAt: new Date().toISOString(),
        events: [],
      },
    },
  });
  return prisma.businessMobileService.update({
    where: { id: service.id },
    data: { wholesaleServiceLinkId: link.id },
    include: {
      account: { select: { id: true, accountNumber: true, companyName: true } },
      catalogueItem: { select: { id: true, sku: true, name: true, serviceType: true, contractTermMonths: true } },
      wholesaleLink: true,
    },
  });
}

export async function createLinkedBroadbandService(
  fixture: WholesaleTestFixture,
  options?: { retailStatus?: string; orderId?: string; upstreamStatus?: string },
) {
  const service = await createDraftBroadbandService(fixture, { status: options?.retailStatus ?? 'REQUESTED' });
  const link = await prisma.itsiMobileWholesaleServiceLink.create({
    data: {
      businessAccountId: fixture.accountId,
      businessServiceType: 'BROADBAND',
      businessServiceReference: service.serviceReference,
      itsiMobileWholesaleOrderId: options?.orderId ?? 'legacy-bb-ord-1',
      status: 'PENDING',
      lastStatusResponse: {
        orderId: options?.orderId ?? 'legacy-bb-ord-1',
        status: options?.upstreamStatus ?? 'SUBMITTED',
        lastUpdatedAt: new Date().toISOString(),
        events: [],
      },
    },
  });
  return prisma.businessBroadbandService.update({
    where: { id: service.id },
    data: { wholesaleServiceLinkId: link.id },
    include: {
      account: { select: { id: true, accountNumber: true, companyName: true } },
      catalogueItem: { select: { id: true, sku: true, name: true, serviceType: true, contractTermMonths: true } },
      site: {
        select: {
          id: true, name: true, postcode: true, uprn: true,
          addressLine1: true, addressLine2: true, city: true,
        },
      },
      wholesaleLink: true,
    },
  });
}

export async function getTimelineEvents(accountId: string, type?: string) {
  return prisma.timelineEvent.findMany({
    where: { accountId, ...(type ? { type } : {}) },
    orderBy: { occurredAt: 'asc' },
  });
}

export async function cleanupWholesaleTestFixture(fixture: WholesaleTestFixture): Promise<void> {
  await prisma.timelineEvent.deleteMany({ where: { accountId: fixture.accountId } });
  await prisma.businessMobileService.deleteMany({ where: { accountId: fixture.accountId } });
  await prisma.businessBroadbandService.deleteMany({ where: { accountId: fixture.accountId } });
  await prisma.itsiMobileWholesaleServiceLink.deleteMany({ where: { businessAccountId: fixture.accountId } });
  await prisma.businessSite.deleteMany({ where: { accountId: fixture.accountId } });
  await prisma.businessServiceCatalogueItem.deleteMany({
    where: { id: { in: [fixture.mobileCatalogueId, fixture.broadbandCatalogueId] } },
  });
  await prisma.businessAccount.delete({ where: { id: fixture.accountId } });
}
