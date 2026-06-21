# ITSI BUSINESS PLATFORM EXTRACTION PLAN

This document outlines the architectural strategy and phased transition plan for extracting the business capabilities from the Itsi Mobile platform into a brand-new, standalone platform: **Itsi Business**. 

---

## 1. Architectural Summary & Principles

The Itsi Business platform will exist as an independent codebase and repository (`HFDavid89/itsibusinessportal`), completely decoupled from the Itsi Mobile consumer-facing repository (`HFDavid89/itsimobileportal`). This separation prevents the mixing of consumer and business portal logic, enforces operational boundaries between distinct legal entities, and ensures the core billing and support flows are isolated.

### Core Architectural Principles
1. **Decoupled by Design**: Itsi Business will be a standalone monorepo following a similar technology stack (Next.js 15 for frontends, Fastify 5 for APIs, Prisma ORM for database, TailwindCSS for styling).
2. **Provider-Agnostic Aggregation via Mobile**: Itsi Business does not directly integrate with complex telecommunication network or broadband infrastructure providers (such as Gamma, KCOM, or MS3). It delegates all provider-facing automation and complexity to Itsi Mobile.
3. **Wholesale API Interfacing**: All business broadband and mobile orders, status lookups, and support escalations are placed into Itsi Mobile through secure, scoped wholesale API endpoints.
4. **Independent CRM & Billing**: Itsi Business owns retail customer profiles, sites, contacts, contract summaries, and billing schedules. It is responsible for margins, direct billing, bundle calculations, and individual retail collections. Itsi Mobile invoices Itsi Business in bulk for wholesale service provision.

---

## 2. Company Boundary Model

```
               [ Residential Customer ]                    [ Business Customer ]
                          │                                         │
                          ▼ (Retail Billing & Support)              ▼ (Retail Billing & Support)
                  [ Itsi Mobile ] ◄───────────────────────── [ Itsi Business ]
                          │             (Wholesale APIs)            │
          ┌───────────────┼───────────────┐                         ▼ (Procures Software)
          ▼               ▼               ▼                 [ Itsi Technologies ]
    [ Gamma API ]   [ KCOM API ]    [ OTS Hero ]
```

### Operational Separation
* **Itsi Mobile**: Direct owner of provider-facing integrations, wholesale networks, carrier actions, SIM inventories, and direct-to-consumer mobile and broadband offerings.
* **Itsi Business**: Retail owner of business services, sites, multi-tier corporate profiles, unified multi-service billing (Mobile, Broadband, Energy, Software bundles), and enterprise support desk.
* **Itsi Technologies**: An external platform supplier supplying SaaS, platform licenses, and bespoke digital products which Itsi Business can purchase, bundle, and resell.

---

## 3. Source Repository Analysis (Part A)

A thorough audit of `HFDavid89/itsimobileportal` reveals the following key components and structures that must be analyzed to guide the extraction:

### App & Package Audits
1. `apps/admin`: Staff/admin operations workspace. Highly coupled to mobile/broadband inventory, carrier actions, and consumer subscriptions. The staff views for service orders, ticket management, and CRM accounts contain patterns to extract, but the provider-side details (e.g., direct Gamma SIM movements) must be stripped.
2. `apps/crm`: Staff-facing CRM. Focuses on consumer metrics and basic business profiles. The "CRM Account 360" view represents a core asset that needs complete rebuilding in Itsi Business to support multi-site, multi-contact business hierarchies.
3. `apps/billing`: Consumer billing engine utilizing Stripe, GoCardless, and Xero sync. It relies on highly automated consumer subscriptions. Business billing requires a shift to retail multi-service consolidation and margin reconciliation against bulk wholesale invoices.
4. `apps/desk`: Support desk. Contains SLA policies, support teams, and ticket-threading models. These models are ideal for extraction, but the desk logic must support two-way escalation tracking to Itsi Mobile for provider issues.
5. `apps/telecom`: Telecom service management interfaces (VoIP, SIM allocation). Completely dependent on direct carrier integrations. Out of scope for Itsi Business; telecom service items will be represented purely as retail inventory records.
6. `apps/portal`: Customer self-service portal. Currently mixed with both consumer and legacy business layouts. The consumer portal will remain in Itsi Mobile, while Itsi Business will rebuild a dedicated fleet-centric portal.
7. `apps/business-portal`: Not present as a distinct app in the source repository. Legacy business portal routes and screens scattered in other applications must be removed entirely from the mobile repo.
8. `packages/ui`: The Aurora Design System (Tailwind, Radix UI, shadcn/ui components) is a primary candidate for sharing. It provides the core design tokens, layout shells, tables, and metric cards.
9. `packages/types`: Shared API envelopes, model interfaces, and utility definitions. These types must be split to define clean DTO contracts for the wholesale API.
10. `packages/staff-shell`: Shared layout/shell for staff-facing workspaces. A modified version will be used to scaffold the Itsi Business Admin console.
11. `apps/api`: Back-end API services, routing, and controllers. The newly introduced wholesale API namespace `/api/v1/wholesale/*` is the core bridge between systems.

### Prisma Schema Model Analysis
The source schema (`schema.prisma` in Itsi Mobile API) has been analyzed. The models have been classified for extraction as follows:

* **Identity & Access**: `PlatformUser`, `PlatformSession`, `Tenant`, `StaffUser`, `PortalUser`, `Role`, `Permission`, `RolePermission`, `StaffUserRole`.
  * *Extraction Note*: Re-scaffold the RBAC system but limit the scopes to Business operations. Eliminate consumer platform-level administrative permissions.
* **Customer & Account (CRM)**: `Account`, `BusinessProfile`, `Contact`, `AccountContact`, `AccountPortalUser`, `EndUser`, `Site`.
  * *Extraction Note*: Rebuild and expand. Itsi Business requires a much more robust site-to-contact relation model, separating the legal billing entity from operational physical sites.
* **Products & Billing**: `BillingAccount`, `Product`, `Plan`, `Addon`, `Subscription`, `Invoice`, `InvoiceLineItem`, `Payment`, `CreditNote`, `StoredPaymentMethod`, `XeroSync`, `TenantBillingSummary`.
  * *Extraction Note*: Refocus on retail billing. The Itsi Business database will store `BusinessInvoice`, `BusinessPayment`, and `BusinessSubscription` models, which map to consolidated services, whilst removing complex real-time raw rating models from the MVP.
* **Orders & Services**: `ServiceOrder`, `ServiceInstance`, `ProvisionedService`, `ServiceAvailabilityCache`, `CarrierAction`, `PortingRequest`.
  * *Extraction Note*: Itsi Business will represent these as higher-level retail records (`BusinessMobileService`, `BusinessBroadbandService`) linked back to Itsi Mobile via `ItsiMobileWholesaleServiceLink`. Itsi Mobile continues to own the low-level provider carrier actions and porting requests.
* **Operations & Desk**: `Ticket`, `TicketThread`, `TicketAttachment`, `Activity`, `AuditLog`.
  * *Extraction Note*: Keep mostly as-is, but add specific escalation tracking metadata (`wholesaleEscalationReference`) to relate business tickets to wholesale carrier desk tickets.
* **Energy-related placeholders**: `EnergySupplyPoint`, `EnergyMeter`, `SwitchingRequest`.
  * *Extraction Note*: Move entirely out of Itsi Mobile in the long term, making them a native product family of Itsi Business.

---

## 4. Platform Extraction & Reclassification Table (Part B)

The following table details how each functional area and package from the source platform (`Itsi Mobile`) will be handled during the Itsi Business platform extraction:

| Source Area / Package | Keep | Remove | Rename | Refocus | Shared Candidate | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `apps/admin` | | | | **Yes** | | Extract UI patterns for Admin Shell, but strip all provider-direct (Gamma/KCOM) panels. |
| `apps/crm` | | | | **Yes** | | Refocus staff CRM views entirely on multi-site business profiles. |
| `apps/billing` | | | | **Yes** | | Rebuild retail-only ledger. Remove real-time rating engines. |
| `apps/desk` | | | | **Yes** | | Re-scaffold support views. Add fields for downstream ticket tracking. |
| `apps/telecom` | | **Yes** | | | | Telecom asset automation belongs exclusively to Itsi Mobile. |
| `apps/portal` | | | | **Yes** | | Rebuild from scratch. The mobile-app layout is consumer-only. |
| `packages/ui` | | | | | **Yes** | Aurora Design System UI library to be copied/scaffolded as a shared NPM candidate. |
| `packages/types` | | | | **Yes** | | Split into business domain types vs wholesale API integration types. |
| `packages/staff-shell`| | | | **Yes** | | Scaffold into the Itsi Business admin layout. |
| `packages/auth` | | | | **Yes** | | Duplicate the JWT-based session utilities for the new domain boundary. |
| `packages/tenancy` | | **Yes** | | | | Remove. Itsi Business operates on a single-tenant model for its own staff/clients. |
| `packages/timeline` | **Yes** | | | | | Retain to log staff and customer lifecycle actions on the account timeline. |
| `apps/api` | | | | **Yes** | | Strip out external provider clients. Replace with the internal wholesale client. |
| `Prisma Schema` | | | | **Yes** | | Extract core tables and prefix with `Business` or refocus fields. |
| `Gamma / KCOM integrations` | | **Yes** | | | | Remove entirely. Accessible only via Itsi Mobile wholesale APIs. |
| `OTS Hero (Switching)` | | **Yes** | | | | Placehold the switching requests; feature-gate business OTS. |
| `Xero Sync` | **Yes** | | | | | Reuse accounting syncing patterns for business ledger. |

---

## 5. Itsi Business MVP Modules (Part C)

The Itsi Business MVP is scoped to establish the billing and management foundations while deferring heavy integration tasks:

### In MVP Scope
1. **Business Admin Shell**: A unified, modern staff portal based on the Aurora Design System for company personnel to manage accounts, sites, tickets, and service states.
2. **Business CRM (Account 360)**: Core client management, linking corporate hierarchies, multiple business sites, physical contact points, and billing preferences.
3. **Business Customer Portal**: Fleet dashboard, SIM/broadband inventory views, department or cost-center assignments, and basic support ticket management.
4. **Business Billing Foundation**: Custom margin engine, retail subscription manager, PDF invoice renderer, offline manual billing setup, and Stripe/Direct Debit setup frameworks.
5. **Business Support/Desk**: Basic support queue, conversation threads, SLA policies, and internal hand-off buttons to escalate issues downstream.
6. **Sites & Contacts**: Structural model of corporate real estate and key staff roles (e.g., Billing Admin, Tech Lead, On-site Contact).
7. **Service Catalogue**: Catalog of available business products (Broadband, Mobile packages, Energy rates, Software licenses) with customizable retail prices.
8. **Wholesale Order Bridge**: A request handler that places service requests to Itsi Mobile wholesale endpoints (`POST /api/v1/wholesale/orders`) using API Key authentication.
9. **Energy Placeholder/Foundation**: Basic database model to record `BusinessEnergyService` contracts, meter references, and switching records for future supplier syncing.
10. **Support Escalation Placeholder**: A button/API handler to fire a ticket escalation request down to Itsi Mobile (`POST /api/v1/wholesale/support/escalations`).

### Out of MVP Scope (Non-MVP)
* Direct Gamma, KCOM, or MS3 API integrations.
* Live OTS Hero broadband switching execution.
* Real-time automated mobile usage rating and billing.
* Live automated energy switching/API integrations.
* Live payment processing automation (except basic Stripe setups already proven safe).

---

## 6. Initial Data Ownership Boundary (Part D)

Data is strictly divided to ensure operational separation and avoid duplication of PII:

```
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│        ITSI BUSINESS DATABASE        │          │         ITSI MOBILE DATABASE         │
├──────────────────────────────────────┤          ├──────────────────────────────────────┤
│ 🟢 BusinessAccount                   │          │ 🔴 ServiceOrder (Wholesale-tagged)   │
│ 🟢 BusinessContact                   │          │ 🔴 ProvisionedService (Provider)     │
│ 🟢 BusinessSite                      │  Order   │ 🔴 WholesaleBillingAccount           │
│ 🟢 BusinessContract                  │ ────────►│ 🔴 CarrierAction                     │
│ 🟢 BusinessInvoice                   │  Request │ 🔴 PortingRequest                    │
│ 🟢 BusinessPayment                   │          │ 🔴 Provider Ticket (Linked)          │
│ 🟢 BusinessTicket                    │          │                                      │
│ 🟢 BusinessEnergyService             │          │                                      │
│ 🟢 BusinessMobileService (Retail)    │          │                                      │
│ 🟢 BusinessBroadbandService (Retail) │          │                                      │
│ 🟢 WholesaleServiceLink              │          │                                      │
└──────────────────────────────────────┘          └──────────────────────────────────────┘
```

### Detailed Ownership Matrix

| Data Entity / Record | Owned By | Platform of Record | Downstream Sync / Reference |
| :--- | :---: | :---: | :--- |
| **Business Customer Profile** | Itsi Business | Itsi Business DB | Referencable only via `itsiBusinessAccountId` in Itsi Mobile. |
| **Corporate Sites & Contacts** | Itsi Business | Itsi Business DB | Not exposed to Itsi Mobile database. |
| **Retail Contracts & Invoices** | Itsi Business | Itsi Business DB | Not exposed downstream. |
| **Business Energy Services** | Itsi Business | Itsi Business DB | Fully owned; no reference needed in Mobile. |
| **Business Mobile/Broadband Retail Records** | Itsi Business | Itsi Business DB | Holds `wholesaleServiceLink` which maps to Itsi Mobile `ServiceInstance`. |
| **Wholesale Service Orders** | Itsi Mobile | Itsi Mobile DB | Triggered via API; contains minimal provisioning details (postcode, UPRN, SIM serial). |
| **Carrier Actions & Porting** | Itsi Mobile | Itsi Mobile DB | Completely managed by Itsi Mobile staff. Status updates are exposed via APIs. |
| **Wholesale Invoices & CDRs** | Itsi Mobile | Itsi Mobile DB | Invoiced to Itsi Business wholesale account. |
| **Supplier-side Support Tickets** | Itsi Mobile | Itsi Mobile DB | Contains provider notes; completely hidden from retail customer views. |

---

## 7. API Boundary: Itsi Business ──► Itsi Mobile (Part E)

Itsi Business interacts with Itsi Mobile using the secure wholesale API namespaces. The required endpoint matrix includes:

### 1. Wholesale Availability & Quote APIs
* **Get Address Qualification**
  * `GET /api/v1/wholesale/addresses?postcode=<postcode>`
  * Fans out to KCOM/Gamma/MS3 aggregators within Itsi Mobile.
* **Get Service Quote**
  * `POST /api/v1/wholesale/quotes`
  * Body: `{ type: 'broadband' | 'mobile', uprn, tariffId, options }`
  * Returns: Wholesale pricing, setup fees, and contract terms.

### 2. Wholesale Order APIs
* **Submit Service Order**
  * `POST /api/v1/wholesale/orders`
  * Body: `{ type: 'mobile' | 'broadband', retailAccountId, targetUprn, simSerialNumber, tariffId, requestedPortDate }`
  * Returns: `ServiceOrder` ID, reference, status `WHOLESALE_PENDING`.
* **Get Order Status**
  * `GET /api/v1/wholesale/orders/:id/status`
  * Returns safe, customer-friendly status updates. Excludes raw provider logs or operator internal notes.

### 3. Service Status & Inventory APIs
* **List Wholesale Inventory**
  * `GET /api/v1/wholesale/services`
  * Returns active mobile/broadband lines wholesale-provisioned to Itsi Business.
* **Get Specific Service Status**
  * `GET /api/v1/wholesale/services/:id/status`
  * Returns active/suspended line signals, MSISDN states, or ONT port statuses.

### 4. Support Escalation APIs
* **Escalate Support Ticket**
  * `POST /api/v1/wholesale/support/escalations`
  * Body: `{ businessTicketId, urgency, category, notes, serviceReference }`
  * Returns: Linked Itsi Mobile support ticket ID.
* **Get Escalation Status**
  * `GET /api/v1/wholesale/support/escalations/:id`
  * Checks current provider-side resolution state.

---

## 8. Billing & Support Models (Parts F & G)

### Billing Separation & Reconciliation Flow
Itsi Business operates a margin-based retail billing model:

```
  [ Gamma / KCOM ]  ──────► Charges Wholesale Rates ──────►  [ Itsi Mobile ]
                                                                   │
                                                                   ▼ (Compiles bulk monthly invoice)
                                                             [ Itsi Business ]
                                                                   │
  [ Business Customer ]  ◄──── Bills Consolidated Retail ◄────────┘
                         (Energy + Software + Mobile + Broadband)
```

1. **Retail Billing**: Itsi Business issues a monthly consolidated invoice to the corporate client. It bundles the retail costs of mobile lines, fiber connections, software seats, and energy meters.
2. **Wholesale Reconciliation**: Itsi Mobile issues a single bulk wholesale invoice to Itsi Business containing line-item usage, active counts, and platform licensing fees.
3. **Margin Control**: The financial risk and margins are fully controlled inside Itsi Business, maintaining separation between provider costs and retail plans.

### Support Desk Escalation Lifecycle
Operational support follows a strict hierarchy:

1. **Ticket Creation**: A business user logs a ticket via the Itsi Business Portal or emails `support@itsibusiness.co.uk`.
2. **First-line Triage**: Itsi Business support personnel analyze the issue inside the Itsi Business CRM.
3. **Escalation Trigger**: If a broadband fault or SIM network failure is identified, staff press "Escalate to Supplier". This makes a call to Itsi Mobile: `POST /api/v1/wholesale/support/escalations`.
4. **Linked Resolution**: A linked ticket is created in Itsi Mobile Desk. The Itsi Mobile team communicates with Gamma/KCOM.
5. **Filtered Transparency**: Status updates and comments logged in Itsi Mobile are pushed/polled by Itsi Business. Business staff decide what notes are displayed to the corporate end-customer, filtering out raw technical carrier codes or proprietary wholesale negotiations.

---

## 9. Phased Extraction roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Scaffolding, Base Config, & DB Setups (Prisma, Repo Layout)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Identity, Access Controls, & Aurora App Shell Setup           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: CRM Foundations (Account 360, Business Sites, & Contact Hub)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Support Ticket Desk & Wholesale Escalation Engine             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Telecom/Broadband Service Catalog & Order Bridge              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: Retail Billing, Invoice Generation, & Energy Placeholders     │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Planning and Scaffolding
* Initialize the repository layout.
* Set up workspace structure (`apps/api`, `apps/admin`, `apps/portal`, `packages/ui`, `packages/types`).
* Design target database schema with prefixing and relations.

### Phase 2: Identity & Portal Shells
* Set up local auth mechanisms and staff-login boundaries.
* Import the compiled Aurora Design System components into `@itsi/ui` placeholder packages.
* Render the baseline dashboards for both Business Admin and Business Portal.

### Phase 3: CRM Site and Contact Management
* Build multi-level hierarchy models (Legal Billing Entity ──► Geographic Sites ──► Site Contacts).
* Deliver Account 360 page layout in CRM.

### Phase 4: Desk and Escalation
* Integrate support ticketing tables.
* Embed the "Escalate to Supplier" hook, verifying communication via mocked API client headers first.

### Phase 5: Service Catalogue & Fulfillment Bridge
* Construct catalog lists for Telecom, Mobile, Energy, and Software.
* Integrate the API client linking Itsi Business to the wholesale endpoint of Itsi Mobile on port `9001`.

### Phase 6: Retail Billing Ledger
* Assemble invoice PDF rendering using mock line items.
* Implement custom margin calculators and payment intent templates.

---

## 10. Operational Risks & Mitigations

### 1. Out-of-Sync States
* **Risk**: Wholesale order is cancelled or delayed in Itsi Mobile, but Itsi Business shows "Active" or "Provisioned" to the end customer.
* **Mitigation**: Itsi Business will implement scheduled webhook receivers or polling intervals to synchronize service state changes from Itsi Mobile hourly.

### 2. Leaking Downstream Carrier Details
* **Risk**: Raw provider technical errors (e.g., "KCOM physical port rejection: ONT-909") get exposed directly to business clients in their portal, causing confusion.
* **Mitigation**: Status translation mapping. Ensure Itsi Mobile status responses are mapped into user-friendly business descriptions (e.g., "Installation in progress - Physical site review required") before rendering in the customer portal.

### 3. Authentication & Key Drifts
* **Risk**: The Wholesale API key is rotated or deactivated, breaking order creation and availability checking across the platforms.
* **Mitigation**: Separate API key management from general customer identities, utilizing robust environment variable stores and automated notification alerts for API key expiry times.

### 4. Overlapping Subscriptions
* **Risk**: Invoicing customers twice due to subscriptions running on both Itsi Mobile and Itsi Business platforms during transition.
* **Mitigation**: Enforce the "No Direct Business Signup/Billing" rule inside Itsi Mobile immediately, ensuring active business targets are managed on Itsi Business.

---

## 11. Open Architectural Decisions

Before writing production-ready microservices, the following decisions must be made and aligned:
1. **Database Sharing vs. Total Isolation**: Should Itsi Business share the Postgres instance under a separate schema, or run on a completely separate database server? *(Recommendation: Completely separate database server to guarantee strict operational isolation.)*
2. **Subdomain Namespace Routing**: Will Itsi Business utilize `admin.itsibusiness.co.uk` and `portal.itsibusiness.co.uk` to cleanly divide network realms?
3. **PII Minimization**: Exactly how much personal data of the business end-user (e.g., individual SIM holder name, delivery address) should be sent to Itsi Mobile for order fulfillment, vs. keeping it completely localized inside Itsi Business?
4. **Wholesale Invoice Sync Cadence**: Will wholesale billing data be fetched live via `wholesale.billing.read` during retail invoice drafting, or will Itsi Mobile export a monthly flat file?
5. **Authentication Sync**: Should Itsi Business use an independent database-backed auth strategy, or federate with a unified staff identity provider?

---

## 12. Immediate First Implementation Steps

1. **Scaffold Repository Layout**: Establish the monorepo structure using PNPM Workspaces and Turbo.
2. **Setup Base Configuration**: Copy essential configuration patterns (`package.json`, `.gitignore`, `tsconfig.json`, `tailwind.config.js`).
3. **Compile Database Client**: Bootstrap a dedicated `prisma/schema.prisma` with core identity, billing, CRM, and placeholder energy models.
4. **Deliver Mock Wholesale Client**: Write an internal HTTP client in Itsi Business to mock calls to Itsi Mobile's `GET /api/v1/wholesale/addresses` and `POST /api/v1/wholesale/orders` endpoints.
