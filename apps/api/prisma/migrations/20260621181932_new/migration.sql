-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "realm" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_users" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "realm" TEXT NOT NULL DEFAULT 'portal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_accounts" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradingName" TEXT,
    "companyNumber" TEXT,
    "vatNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROSPECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_contacts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "siteId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GENERAL',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_sites" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "county" TEXT,
    "postcode" TEXT NOT NULL,
    "uprn" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_contracts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "subtotalPence" INTEGER NOT NULL DEFAULT 0,
    "taxTotalPence" INTEGER NOT NULL DEFAULT 0,
    "discountTotalPence" INTEGER NOT NULL DEFAULT 0,
    "totalPence" INTEGER NOT NULL DEFAULT 0,
    "amountPaidPence" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_invoice_lines" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPricePence" INTEGER NOT NULL DEFAULT 0,
    "discountAmountPence" INTEGER NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmountPence" INTEGER NOT NULL DEFAULT 0,
    "taxAmountPence" INTEGER NOT NULL DEFAULT 0,
    "grossAmountPence" INTEGER NOT NULL DEFAULT 0,
    "businessServiceReference" TEXT,
    "wholesaleCostReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "method" TEXT NOT NULL DEFAULT 'MANUAL',
    "reference" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByStaffUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "siteId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedToStaffUserId" TEXT,
    "wholesaleEscalationId" TEXT,
    "wholesaleEscalationReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_ticket_threads" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "customerVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_ticket_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_service_catalogue_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "retailPricePence" INTEGER NOT NULL DEFAULT 0,
    "wholesaleCostEstimatePence" INTEGER,
    "setupFeePence" INTEGER,
    "contractTermMonths" INTEGER,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "marginPolicy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_service_catalogue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_mobile_services" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "siteId" TEXT,
    "catalogueItemId" TEXT,
    "serviceReference" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "retailPricePence" INTEGER NOT NULL DEFAULT 0,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "mobileNumber" TEXT,
    "simLabel" TEXT,
    "costCentre" TEXT,
    "wholesaleServiceLinkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_mobile_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_broadband_services" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "catalogueItemId" TEXT,
    "serviceReference" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "retailPricePence" INTEGER NOT NULL DEFAULT 0,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "accessTechnology" TEXT,
    "postcode" TEXT NOT NULL,
    "uprn" TEXT,
    "circuitLabel" TEXT,
    "wholesaleServiceLinkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_broadband_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_energy_services" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "catalogueItemId" TEXT,
    "serviceReference" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fuelType" TEXT NOT NULL DEFAULT 'ELECTRICITY',
    "meterPointReference" TEXT,
    "retailPriceDescription" TEXT,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_energy_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itsi_mobile_wholesale_service_links" (
    "id" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "businessServiceType" TEXT NOT NULL,
    "businessServiceReference" TEXT NOT NULL,
    "itsiMobileWholesaleOrderId" TEXT,
    "itsiMobileServiceOrderId" TEXT,
    "safeProviderReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLACEHOLDER',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itsi_mobile_wholesale_service_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'SYSTEM',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'SYSTEM',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StaffRoleToStaffUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffRoleToStaffUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_roles_name_key" ON "staff_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "portal_users_email_key" ON "portal_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_accounts_accountNumber_key" ON "business_accounts"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "business_invoices_invoiceNumber_key" ON "business_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "business_invoices_accountId_status_idx" ON "business_invoices"("accountId", "status");

-- CreateIndex
CREATE INDEX "business_invoices_status_dueDate_idx" ON "business_invoices"("status", "dueDate");

-- CreateIndex
CREATE INDEX "business_payments_invoiceId_idx" ON "business_payments"("invoiceId");

-- CreateIndex
CREATE INDEX "business_payments_accountId_idx" ON "business_payments"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "business_tickets_ticketNumber_key" ON "business_tickets"("ticketNumber");

-- CreateIndex
CREATE INDEX "business_tickets_accountId_status_idx" ON "business_tickets"("accountId", "status");

-- CreateIndex
CREATE INDEX "business_tickets_status_priority_idx" ON "business_tickets"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "business_service_catalogue_items_sku_key" ON "business_service_catalogue_items"("sku");

-- CreateIndex
CREATE INDEX "business_service_catalogue_items_serviceType_status_idx" ON "business_service_catalogue_items"("serviceType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "business_mobile_services_serviceReference_key" ON "business_mobile_services"("serviceReference");

-- CreateIndex
CREATE INDEX "business_mobile_services_accountId_status_idx" ON "business_mobile_services"("accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "business_broadband_services_serviceReference_key" ON "business_broadband_services"("serviceReference");

-- CreateIndex
CREATE INDEX "business_broadband_services_accountId_status_idx" ON "business_broadband_services"("accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "business_energy_services_serviceReference_key" ON "business_energy_services"("serviceReference");

-- CreateIndex
CREATE INDEX "business_energy_services_accountId_status_idx" ON "business_energy_services"("accountId", "status");

-- CreateIndex
CREATE INDEX "itsi_mobile_wholesale_service_links_businessAccountId_idx" ON "itsi_mobile_wholesale_service_links"("businessAccountId");

-- CreateIndex
CREATE INDEX "itsi_mobile_wholesale_service_links_businessServiceReferenc_idx" ON "itsi_mobile_wholesale_service_links"("businessServiceReference");

-- CreateIndex
CREATE INDEX "timeline_events_accountId_occurredAt_idx" ON "timeline_events"("accountId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "_StaffRoleToStaffUser_B_index" ON "_StaffRoleToStaffUser"("B");

-- AddForeignKey
ALTER TABLE "portal_users" ADD CONSTRAINT "portal_users_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_contacts" ADD CONSTRAINT "business_contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_contacts" ADD CONSTRAINT "business_contacts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "business_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_sites" ADD CONSTRAINT "business_sites_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_contracts" ADD CONSTRAINT "business_contracts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invoices" ADD CONSTRAINT "business_invoices_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invoice_lines" ADD CONSTRAINT "business_invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "business_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_payments" ADD CONSTRAINT "business_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "business_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_payments" ADD CONSTRAINT "business_payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_tickets" ADD CONSTRAINT "business_tickets_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_tickets" ADD CONSTRAINT "business_tickets_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "business_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_ticket_threads" ADD CONSTRAINT "business_ticket_threads_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "business_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_mobile_services" ADD CONSTRAINT "business_mobile_services_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_mobile_services" ADD CONSTRAINT "business_mobile_services_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "business_service_catalogue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_mobile_services" ADD CONSTRAINT "business_mobile_services_wholesaleServiceLinkId_fkey" FOREIGN KEY ("wholesaleServiceLinkId") REFERENCES "itsi_mobile_wholesale_service_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_broadband_services" ADD CONSTRAINT "business_broadband_services_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_broadband_services" ADD CONSTRAINT "business_broadband_services_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "business_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_broadband_services" ADD CONSTRAINT "business_broadband_services_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "business_service_catalogue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_broadband_services" ADD CONSTRAINT "business_broadband_services_wholesaleServiceLinkId_fkey" FOREIGN KEY ("wholesaleServiceLinkId") REFERENCES "itsi_mobile_wholesale_service_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_energy_services" ADD CONSTRAINT "business_energy_services_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_energy_services" ADD CONSTRAINT "business_energy_services_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "business_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_energy_services" ADD CONSTRAINT "business_energy_services_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "business_service_catalogue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "business_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffRoleToStaffUser" ADD CONSTRAINT "_StaffRoleToStaffUser_A_fkey" FOREIGN KEY ("A") REFERENCES "staff_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffRoleToStaffUser" ADD CONSTRAINT "_StaffRoleToStaffUser_B_fkey" FOREIGN KEY ("B") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
