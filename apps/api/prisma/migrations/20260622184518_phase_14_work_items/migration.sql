-- CreateTable
CREATE TABLE "business_work_items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "accountId" TEXT NOT NULL,
    "serviceType" TEXT,
    "serviceId" TEXT,
    "ticketId" TEXT,
    "wholesaleLinkId" TEXT,
    "assignedToStaffUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "slaBreachedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'STAFF',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_work_item_comments" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_work_item_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_work_items_status_priority_idx" ON "business_work_items"("status", "priority");

-- CreateIndex
CREATE INDEX "business_work_items_accountId_status_idx" ON "business_work_items"("accountId", "status");

-- CreateIndex
CREATE INDEX "business_work_items_assignedToStaffUserId_status_idx" ON "business_work_items"("assignedToStaffUserId", "status");

-- CreateIndex
CREATE INDEX "business_work_items_dueAt_idx" ON "business_work_items"("dueAt");

-- CreateIndex
CREATE INDEX "business_work_items_type_status_idx" ON "business_work_items"("type", "status");

-- CreateIndex
CREATE INDEX "business_work_items_ticketId_idx" ON "business_work_items"("ticketId");

-- CreateIndex
CREATE INDEX "business_work_items_serviceId_idx" ON "business_work_items"("serviceId");

-- CreateIndex
CREATE INDEX "business_work_items_wholesaleLinkId_idx" ON "business_work_items"("wholesaleLinkId");

-- CreateIndex
CREATE INDEX "business_work_item_comments_workItemId_idx" ON "business_work_item_comments"("workItemId");

-- AddForeignKey
ALTER TABLE "business_work_items" ADD CONSTRAINT "business_work_items_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_work_items" ADD CONSTRAINT "business_work_items_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "business_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_work_items" ADD CONSTRAINT "business_work_items_wholesaleLinkId_fkey" FOREIGN KEY ("wholesaleLinkId") REFERENCES "itsi_mobile_wholesale_service_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_work_item_comments" ADD CONSTRAINT "business_work_item_comments_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "business_work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
