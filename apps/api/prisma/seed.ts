/**
 * Safe seed / bootstrap for Itsi Business.
 *
 * SAFE: Creates admin user, roles, and empty permissions by default.
 * Optional SEED_PORTAL_DEMO=true creates a demo business account for portal testing.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedPortalDemo() {
  if (process.env.SEED_PORTAL_DEMO !== 'true') return;

  const portalEmail = process.env.SEED_PORTAL_EMAIL ?? 'portal@demo.itsi.business';
  const portalPassword = process.env.SEED_PORTAL_PASSWORD ?? 'ChangeMe123!';

  const account = await prisma.businessAccount.upsert({
    where: { accountNumber: 'DEMO-0001' },
    update: {},
    create: {
      accountNumber: 'DEMO-0001',
      companyName: 'Demo Business Ltd',
      tradingName: 'Demo Business',
      status: 'ACTIVE',
    },
  });

  await prisma.portalUser.upsert({
    where: { email: portalEmail },
    update: { portalRole: 'ACCOUNT_ADMIN' },
    create: {
      accountId: account.id,
      email: portalEmail,
      firstName: 'Portal',
      lastName: 'User',
      passwordHash: await bcrypt.hash(portalPassword, 12),
      realm: 'portal',
      portalRole: 'ACCOUNT_ADMIN',
    },
  });

  const site = await prisma.businessSite.upsert({
    where: { id: 'seed-demo-site' },
    update: {},
    create: {
      id: 'seed-demo-site',
      accountId: account.id,
      name: 'Head Office',
      addressLine1: '1 Demo Street',
      city: 'London',
      postcode: 'EC1A 1BB',
      isPrimary: true,
    },
  });

  await prisma.businessContact.upsert({
    where: { id: 'seed-demo-contact' },
    update: {},
    create: {
      id: 'seed-demo-contact',
      accountId: account.id,
      siteId: site.id,
      firstName: 'Alex',
      lastName: 'Contact',
      email: 'contact@demo.itsi.business',
      phone: '020 7946 0958',
      role: 'PRIMARY',
      isPrimary: true,
    },
  });

  const catalogue = await prisma.businessServiceCatalogueItem.upsert({
    where: { sku: 'DEMO-MOB-001' },
    update: { customerVisible: true },
    create: {
      sku: 'DEMO-MOB-001',
      name: 'Business Mobile 20GB',
      description: 'Business mobile plan with 20GB data',
      serviceType: 'MOBILE',
      status: 'ACTIVE',
      retailPricePence: 2500,
      setupFeePence: 0,
      contractTermMonths: 24,
      taxRate: 20,
      customerVisible: true,
    },
  });

  await prisma.businessMobileService.upsert({
    where: { serviceReference: 'SVC-DEMO-MOB-001' },
    update: {},
    create: {
      accountId: account.id,
      serviceReference: 'SVC-DEMO-MOB-001',
      displayName: 'Demo Mobile Line',
      status: 'ACTIVE',
      retailPricePence: 2500,
      mobileNumber: '07700 900123',
      simLabel: 'SIM-001',
      costCentre: 'Sales',
      catalogueItemId: catalogue.id,
    },
  });

  await prisma.businessBroadbandService.upsert({
    where: { serviceReference: 'SVC-DEMO-BB-001' },
    update: {},
    create: {
      accountId: account.id,
      siteId: site.id,
      serviceReference: 'SVC-DEMO-BB-001',
      displayName: 'Business Fibre 300',
      status: 'ACTIVE',
      retailPricePence: 4500,
      postcode: 'EC1A 1BB',
      accessTechnology: 'FTTP',
    },
  });

  const invoice = await prisma.businessInvoice.upsert({
    where: { invoiceNumber: 'INV-DEMO-001' },
    update: {},
    create: {
      invoiceNumber: 'INV-DEMO-001',
      accountId: account.id,
      status: 'ISSUED',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotalPence: 7000,
      taxTotalPence: 1400,
      totalPence: 8400,
      amountPaidPence: 0,
    },
  });

  await prisma.businessInvoiceLine.upsert({
    where: { id: 'seed-demo-inv-line' },
    update: {},
    create: {
      id: 'seed-demo-inv-line',
      invoiceId: invoice.id,
      description: 'Monthly services',
      serviceType: 'MOBILE',
      quantity: 1,
      unitPricePence: 7000,
      netAmountPence: 7000,
      taxRate: 20,
      taxAmountPence: 1400,
      grossAmountPence: 8400,
    },
  });

  await prisma.businessTicket.upsert({
    where: { ticketNumber: 'TKT-DEMO-001' },
    update: {},
    create: {
      ticketNumber: 'TKT-DEMO-001',
      accountId: account.id,
      subject: 'Welcome to the business portal',
      description: 'This is a demo support ticket for portal testing.',
      status: 'OPEN',
      priority: 'NORMAL',
      category: 'GENERAL',
    },
  });

  console.log(`  Portal demo account: ${account.companyName} (${account.accountNumber})`);
  console.log(`  Portal demo user: ${portalEmail}`);
}

async function main() {
  console.log('Seeding Itsi Business database...');

  const adminRole = await prisma.staffRole.upsert({
    where: { name: 'PLATFORM_ADMIN' },
    update: {},
    create: {
      name: 'PLATFORM_ADMIN',
      permissions: ['*'],
    },
  });

  const staffRole = await prisma.staffRole.upsert({
    where: { name: 'STAFF' },
    update: {
      permissions: [
        'crm.accounts.read',
        'desk.tickets.read', 'desk.tickets.write', 'desk.tickets.assign', 'desk.tickets.internal_notes',
        'work_items.read', 'work_items.write', 'work_items.assign', 'work_items.resolve', 'work_items.comment',
        'services.records.read', 'services.wholesale_links.read',
        'reports.read', 'reports.billing.read', 'reports.operations.read', 'reports.energy.read',
      ],
    },
    create: {
      name: 'STAFF',
      permissions: [
        'crm.accounts.read',
        'desk.tickets.read', 'desk.tickets.write', 'desk.tickets.assign', 'desk.tickets.internal_notes',
        'work_items.read', 'work_items.write', 'work_items.assign', 'work_items.resolve', 'work_items.comment',
        'services.records.read', 'services.wholesale_links.read',
        'reports.read', 'reports.billing.read', 'reports.operations.read', 'reports.energy.read',
      ],
    },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@itsi.business';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  await prisma.staffUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      firstName: 'Platform',
      lastName: 'Admin',
      realm: 'platform',
      roles: { connect: [{ id: adminRole.id }] },
    },
  });

  await seedPortalDemo();

  console.log(`Seed complete.`);
  console.log(`  Admin role: ${adminRole.name}`);
  console.log(`  Staff role: ${staffRole.name}`);
  console.log(`  Admin user: ${adminEmail}`);
  if (process.env.SEED_PORTAL_DEMO !== 'true') {
    console.log(`  NOTE: Set SEED_PORTAL_DEMO=true to create portal demo data.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
