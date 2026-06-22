-- Phase 13: Portal product visibility and portal user roles

ALTER TABLE "business_service_catalogue_items" ADD COLUMN IF NOT EXISTS "customerVisible" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "portalRole" TEXT NOT NULL DEFAULT 'READ_ONLY';
