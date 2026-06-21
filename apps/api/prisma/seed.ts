/**
 * Safe seed / bootstrap for Itsi Business.
 *
 * SAFE: Creates only admin user, roles, and empty permissions.
 * NOT CREATED: Fake business customers, invoices, services, tickets, provider test data.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    update: {},
    create: {
      name: 'STAFF',
      permissions: ['accounts:read', 'tickets:read', 'tickets:write'],
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
      realm: 'staff',
      roles: { connect: [{ id: adminRole.id }] },
    },
  });

  console.log(`Seed complete.`);
  console.log(`  Admin role: ${adminRole.name}`);
  console.log(`  Staff role: ${staffRole.name}`);
  console.log(`  Admin user: ${adminEmail}`);
  console.log(`  NOTE: No fake business customers, invoices, or provider data created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
