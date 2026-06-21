-- AlterTable
ALTER TABLE "itsi_mobile_wholesale_service_links" ADD COLUMN     "lastStatusCheckedAt" TIMESTAMP(3),
ADD COLUMN     "lastStatusResponse" JSONB;
