-- Phase 12: Energy account tracking — CRM-managed referral/renewal fields

ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "supplierName" TEXT;
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "fidelityReference" TEXT;
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "mpan" TEXT;
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "mprn" TEXT;
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "renewalWindowStartDate" TIMESTAMP(3);
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "nextCheckInDate" TIMESTAMP(3);
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "lastCheckInDate" TIMESTAMP(3);
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "checkInCadenceDays" INTEGER DEFAULT 90;
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "estimatedAnnualSpendPence" INTEGER;
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "business_energy_services" ADD COLUMN IF NOT EXISTS "customerVisible" BOOLEAN NOT NULL DEFAULT true;

-- Migrate legacy energy statuses to tracking statuses
UPDATE "business_energy_services" SET "status" = 'PROSPECT' WHERE "status" = 'DRAFT';
UPDATE "business_energy_services" SET "status" = 'CONTRACTED' WHERE "status" = 'ACTIVE';
UPDATE "business_energy_services" SET "status" = 'PROSPECT' WHERE "status" = 'SUSPENDED';

ALTER TABLE "business_energy_services" ALTER COLUMN "status" SET DEFAULT 'PROSPECT';

CREATE INDEX IF NOT EXISTS "business_energy_services_contractEndDate_idx" ON "business_energy_services"("contractEndDate");
CREATE INDEX IF NOT EXISTS "business_energy_services_nextCheckInDate_idx" ON "business_energy_services"("nextCheckInDate");
