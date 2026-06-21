# Itsi Mobile → Itsi Business Reuse Audit

> Generated: Phase 3 — Controlled Reuse from Itsi Mobile
> Source repo: `HFDavid89/itsimobileportal`
> Target repo: `HFDavid89/itsibusinessportal`

## Golden rule

> **If Itsi Mobile already solved the platform problem — copy/refocus the pattern.**
> **If Itsi Mobile solved a provider or residential-consumer problem — do not copy it.**

---

## Package-level audit

| Source area | Reuse decision | Action | Reason | Boundary risk | Target location |
|---|---|---|---|---|---|
| `packages/core/src/errors.ts` | **Reuse** | Copy verbatim | Generic AppError hierarchy — no mobile/provider coupling | None | `packages/core/src/errors.ts` |
| `packages/core/src/env.ts` | **Reuse** | Copy verbatim | `requireEnv` / `optionalEnv` — completely generic | None | `packages/core/src/env.ts` |
| `packages/core/src/logger.ts` | **Reuse** | Copy verbatim | `createLogger` — no mobile assumptions | None | `packages/core/src/logger.ts` |
| `packages/auth/src/password.ts` | **Reuse** | Copy verbatim | `bcryptjs` hash/verify — universal | None | `packages/auth/src/password.ts` |
| `packages/auth/src/tokens.ts` | **Reuse** | Copy verbatim | JWT sign/verify — universal | None | `packages/auth/src/tokens.ts` |
| `packages/auth/src/realms.ts` | **Refocus** | Copy, rename `CUSTOMER` → `PORTAL_USER`, keep `PLATFORM` + `STAFF` | Same realm model; business portal users are not mobile consumers | Low | `packages/auth/src/realms.ts` |
| `packages/database/src/client.ts` | **Reuse** | Copy verbatim — points to its own `@prisma/client` | Singleton pattern identical | None | `packages/database/src/client.ts` |
| `packages/timeline/src/types.ts` | **Refocus** | Copy, remove `tenantId` (Itsi Business is single-tenant per deployment), keep all other fields | Itsi Business does not use reseller tenancy | Low | `packages/timeline/src/types.ts` |
| `packages/timeline/src/publisher.ts` | **Reuse** | Copy verbatim — noop until DB wired | Pattern identical | None | `packages/timeline/src/publish.ts` |
| `packages/ui/src/Button.tsx` | **Reuse** | Copy verbatim | Design system component — zero coupling | None | `packages/ui/src/Button.tsx` |
| `packages/ui/src/Badge.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/Badge.tsx` |
| `packages/ui/src/StatusBadge.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/StatusBadge.tsx` |
| `packages/ui/src/Card.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/Card.tsx` |
| `packages/ui/src/PageHeader.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/PageHeader.tsx` |
| `packages/ui/src/EmptyState.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/EmptyState.tsx` |
| `packages/ui/src/LoadingSpinner.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/LoadingSpinner.tsx` |
| `packages/ui/src/LoadErrorPanel.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/LoadErrorPanel.tsx` |
| `packages/ui/src/PageSkeleton.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/PageSkeleton.tsx` |
| `packages/ui/src/toast.tsx` | **Reuse** | Copy verbatim | Toast provider — no coupling | None | `packages/ui/src/toast.tsx` |
| `packages/ui/src/ThemeProvider.tsx` | **Reuse** | Copy, change storage key to `itsi-business-theme` | Theme system — rename storage key only | None | `packages/ui/src/ThemeProvider.tsx` |
| `packages/ui/src/ThemeToggle.tsx` | **Reuse** | Copy verbatim | UI only | None | `packages/ui/src/ThemeToggle.tsx` |
| `packages/ui/tailwind.preset.ts` | **Reuse** | Copy verbatim as `tailwind.preset.ts` | Design token contract — identical | None | `packages/ui/tailwind.preset.ts` |
| `packages/ui/src/TenantBrandingProvider.tsx` | **Skip** | Do not copy | Multi-tenant reseller branding — not applicable to Itsi Business | Medium | N/A |
| `packages/ui/src/TenantAdminProvider.tsx` | **Skip** | Do not copy | Reseller tenant management — belongs to Itsi Mobile | High | N/A |
| `packages/ui/src/mock-tenant-branding.ts` | **Skip** | Do not copy | Reseller test fixture | High | N/A |
| `packages/ui/src/tenant-branding-utils.ts` | **Skip** | Do not copy | Reseller branding utils | High | N/A |
| `packages/staff-shell/src/app-shell.tsx` | **Reuse** | Copy, change `@itsi/ui` import → `@itsi-business/ui`, update workspace rail labels (remove `telecom`, add `portal`) | Core staff UI shell — no provider coupling | Low | `packages/staff-shell/src/app-shell.tsx` |
| `packages/staff-shell/src/auth-context.tsx` | **Reuse** | Copy verbatim | Auth provider pattern — no mobile coupling | None | `packages/staff-shell/src/auth-context.tsx` |
| `packages/staff-shell/src/api-client.ts` | **Refocus** | Copy, update `API_URL` default port, remove `TENANT_SLUG`/`DEV_TENANT_KEY`/`X-Tenant-Slug` (Itsi Business is not multi-tenant), simplify login to single-realm flow | Transport + token layer — reusable, tenancy logic not applicable | Low | `packages/staff-shell/src/api-client.ts` |
| `packages/staff-shell/src/workspace-urls.ts` | **Refocus** | Copy, replace `telecom` workspace with `portal`, update dev ports (4005–4009) | Workspace config — just URL constants | None | `packages/staff-shell/src/workspace-urls.ts` |
| `packages/staff-shell/src/access-restricted.tsx` | **Reuse** | Copy verbatim | Generic RBAC UI panel | None | `packages/staff-shell/src/access-restricted.tsx` |
| `packages/staff-shell/src/platform-access-guard.tsx` | **Reuse** | Copy, change `@itsi/ui` import → `@itsi-business/ui` | Guard pattern — identical | None | `packages/staff-shell/src/platform-access-guard.tsx` |
| `packages/staff-shell/src/notification-bell.tsx` | **Reuse** | Copy, update import | UI pattern | None | `packages/staff-shell/src/notification-bell.tsx` |
| `packages/staff-shell/src/settings-cog.tsx` | **Reuse** | Copy, update import | UI pattern | None | `packages/staff-shell/src/settings-cog.tsx` |
| `packages/staff-shell/src/app-switcher.tsx` | **Refocus** | Copy, replace `telecom` with `portal` workspace entry | Workspace switcher — just label/URL config change | None | `packages/staff-shell/src/app-switcher.tsx` |
| `packages/staff-shell/src/tenant-copy.ts` | **Skip** | Do not copy | Reseller tenant display text — not applicable | Medium | N/A |
| `packages/staff-shell/src/use-workspace-badges.ts` | **Reuse** | Copy, update workspace keys to match business workspaces | Badge pattern | None | `packages/staff-shell/src/use-workspace-badges.ts` |
| `packages/staff-shell/src/staff-page-chrome.tsx` | **Reuse** | Copy, update import | Page chrome shell | None | `packages/staff-shell/src/staff-page-chrome.tsx` |
| `packages/staff-shell/src/settings-placeholder.tsx` | **Reuse** | Copy verbatim | Placeholder | None | `packages/staff-shell/src/settings-placeholder.tsx` |
| `packages/entitlements/` | **Skip** | Do not copy | Reseller entitlement/plan system — belongs to Itsi Mobile | High | N/A |
| `packages/tenancy/` | **Skip** | Do not copy | Multi-tenant reseller isolation — not applicable | Critical | N/A |

---

## App-level audit

| Source area | Reuse decision | Action | Reason | Boundary risk | Target location |
|---|---|---|---|---|---|
| `apps/api/src/lib/jwt.ts` | **Refocus** | Copy, adapt `JwtPayload` — keep `platform`/`staff`/`portal` realms, remove `tenantId` from platform realm | JWT payload contract — same pattern | None | `apps/api/src/lib/jwt.ts` |
| `apps/api/src/lib/auth-cookie.ts` | **Refocus** | Copy, change cookie name (`itsi_rt` → `itsi_biz_rt`), change domain env var | httpOnly cookie SSO pattern — identical | None | `apps/api/src/lib/auth-cookie.ts` |
| `apps/api/src/middleware/authenticate.ts` | **Reuse** | Copy verbatim — `requireAuth` / `requireRealm` Fastify hooks | Middleware pattern — no coupling | None | `apps/api/src/middleware/authenticate.ts` |
| `apps/api/src/middleware/rbac.ts` | **Reuse** | Copy, adapt Prisma model name (`StaffUserRole` → matches business schema) | RBAC pattern — proven, adapt model name | Low | `apps/api/src/middleware/rbac.ts` |
| `apps/api/src/middleware/security.ts` | **Refocus** | Copy, update `allowedOrigins` defaults to `itsi.business` domains | Security headers/CORS/rate-limit config — generic | None | `apps/api/src/middleware/security.ts` |
| `apps/api/src/routes/auth/` | **Refocus** | Reuse session/login/logout/refresh route structure, remove `tenantSlug` from staff login | Auth flow — same JWT/cookie pattern | Low | `apps/api/src/routes/auth.ts` |
| `apps/api/src/routes/admin/` | **Refocus** | Reuse platform admin route patterns, remove Gamma/KCOM/MS3/Stripe/GoCardless integration routes | Admin scaffold — strip provider routes | High | `apps/api/src/routes/` |
| `apps/api/src/routes/platform/` | **Skip** | Do not copy | Reseller/tenant management routes | Critical | N/A |
| `apps/api/src/routes/telecom/` | **Skip** | Do not copy | Provider service-order fulfilment routes | Critical | N/A |
| `apps/api/src/routes/portal/` | **Refocus** | Reuse customer self-service structure (account info, invoices, tickets); remove consumer signup, SIM ordering, usage rating | Portal auth + self-service pattern reusable | High | `apps/portal/` |
| `apps/api/src/routes/onboarding/` | **Skip** | Do not copy | Consumer residential signup — not applicable | Critical | N/A |
| `apps/api/src/routes/webhooks/` | **Skip** | Do not copy | Provider webhook handlers (Stripe, GoCardless, OTS Hero) | Critical | N/A |
| `apps/api/src/routes/wholesale/` | **Skip** | Do not copy | Raw Gamma/KCOM/MS3 wholesale API wiring — replaced by the Itsi Mobile boundary client | Critical | N/A |
| `apps/api/src/routes/partner/` | **Skip** | Do not copy | Partner/reseller API — not applicable | Critical | N/A |
| `apps/crm/app/(app)/accounts/[accountId]/_components/AccountHero.tsx` | **Refocus** | Reuse layout/UX pattern, rename entity to `BusinessAccount`, remove provider-specific tabs | Account 360 UX — proven pattern | Medium | `apps/crm/src/app/accounts/[id]/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/AccountProfileRail.tsx` | **Refocus** | Reuse layout, rebind to `BusinessAccount` data shape | Profile rail pattern | Medium | `apps/crm/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/AccountTabBar.tsx` | **Refocus** | Copy structure, replace tabs: remove `GammaServicesTab`, `PortingTab`, `VoipTab`, `EndUsersTab`, keep/rename: Overview, Contacts, Sites, Services, Tickets, Invoices, Timeline | Tab bar pattern — reusable, provider tabs skipped | Medium | `apps/crm/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/SitesTab.tsx` | **Refocus** | Reuse layout, bind to `BusinessSite` | Site display pattern | Low | `apps/crm/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/GammaServicesTab.tsx` | **Skip** | Do not copy | Direct Gamma service display — provider-specific | Critical | N/A |
| `apps/crm/app/(app)/accounts/[accountId]/_components/PortingTab.tsx` | **Skip** | Do not copy | Number porting — provider fulfilment | Critical | N/A |
| `apps/crm/app/(app)/accounts/[accountId]/_components/EnergyTab.tsx` | **Refocus** | Reuse layout structure only, bind to `BusinessEnergyService` (wholesale link) — no direct OTS Hero calls | Energy service display pattern reusable | High | `apps/crm/` |
| `apps/desk/` | **Refocus** | Reuse ticket queue/thread/status/priority UI patterns, add `wholesaleEscalationRef` field for Itsi Mobile escalation link | Desk UX proven — strip provider ticket internals | Medium | `apps/desk/` |
| `apps/billing/` | **Refocus carefully** | Reuse invoice list/detail/line-item UI patterns; do not copy Stripe/GoCardless live collection flows | Billing UX reusable; live collection not applicable | High | `apps/billing/` |
| `apps/admin/` | **Refocus** | Reuse settings/staff/roles/audit admin patterns; remove Gamma/KCOM/MS3/Stripe integration settings cards | Admin scaffold reusable; provider integration settings skipped | High | `apps/admin/` |
| `apps/portal/` | **Refocus** | Reuse auth/session/account-info/invoice-view/ticket-create patterns; remove consumer signup, SIM ordering | Business portal reuses mobile portal auth patterns | High | `apps/portal/` |
| `apps/scheduler/` | **Skip** | Do not copy | Mobile service scheduler — provider-specific jobs | High | N/A |
| `apps/telecom/` | **Skip** | Do not copy entirely | Provider service-order UI — belongs to Itsi Mobile | Critical | N/A |
| `apps/mobile/` | **Skip** | Do not copy | Mobile consumer app — out of scope | Critical | N/A |

---

## Explicitly skipped (never copy to Itsi Business)

| Module / concept | Reason |
|---|---|
| Gamma API client / credentials | Provider integration — belongs to Itsi Mobile |
| KCOM API client / credentials | Provider integration — belongs to Itsi Mobile |
| MS3 API client / credentials | Provider integration — belongs to Itsi Mobile |
| OTS Hero energy client | Provider integration — belongs to Itsi Mobile |
| Stripe payment collection | Consumer billing — not applicable |
| GoCardless direct debit | Consumer billing — not applicable |
| Number porting routes | Provider fulfilment — belongs to Itsi Mobile |
| SIM card ordering | Provider fulfilment — belongs to Itsi Mobile |
| Consumer signup / onboarding flow | Residential consumer — not applicable |
| Reseller/tenant management | Multi-tenant SaaS — not applicable to Itsi Business |
| Reseller entitlements/plans | Reseller commercial model — belongs to Itsi Mobile |
| Provider webhook handlers | Provider data push — belongs to Itsi Mobile |
| Raw wholesale API routes | Replaced by Itsi Mobile boundary client |
| Mobile usage rating | Consumer billing internals |
| `pilot-fixture-ids.ts` | Fake pilot data — forbidden in scaffold |
| Consumer portal identity | Residential-only assumptions |

---

## Phase 3 execution sequence

1. **packages/core** — copy `errors.ts`, `env.ts`, `logger.ts` verbatim
2. **packages/auth** — copy `password.ts`, `tokens.ts`; refocus `realms.ts`
3. **packages/database** — copy `client.ts` singleton
4. **packages/timeline** — copy `publisher.ts`, refocus `types.ts`
5. **packages/ui** — copy full Aurora component set + `tailwind.preset.ts`
6. **packages/staff-shell** — copy shell components, refocus `api-client.ts` + `workspace-urls.ts`
7. **apps/api middleware** — copy `authenticate.ts`, `rbac.ts`, `security.ts`; refocus `auth-cookie.ts`, `jwt.ts`
8. **apps/api auth routes** — reuse login/logout/session/refresh route structure
9. **apps/crm** — reuse account list + account 360 layout patterns with `BusinessAccount` model
10. **apps/desk** — reuse ticket queue/thread/status patterns, add wholesale escalation link
11. **apps/billing** — reuse invoice list/detail UI patterns only
12. **apps/admin** — reuse settings/staff/roles admin patterns, strip provider integration cards
13. **apps/portal** — reuse auth + self-service patterns, no consumer signup

---

## Phase 5 — Desk reuse decisions

| Source (Itsi Mobile) | Reuse decision | Action | Skipped / boundary |
|---|---|---|---|
| `apps/api/src/routes/admin/tickets.ts` — list, create, patch, thread routes | **Refocus** | Reused route structure, Zod schema approach, `$transaction` pattern, response envelope. Removed: `tenantId` resolution, VIP restriction checks, SLA deadline stamping, `assignedToName` snapshot. | Multi-tenancy, VIP, SLA deferred |
| `apps/api/src/routes/admin/tickets.ts` — thread `isInternal` flag | **Reuse** | Reused directly. Extended with `customerVisible` boolean. | — |
| `apps/api/src/routes/admin/tickets.ts` — SLA service (`ticket-sla.service.ts`) | **Skip** | No per-priority SLA policy model in Itsi Business yet. | SLA deferred to future phase |
| `apps/api/src/routes/admin/tickets.ts` — outbound channel routing (WhatsApp, SMS, Email) | **Skip** | Itsi Business desk is internal-only at this stage. No multi-channel. | Channel routing excluded |
| `apps/api/src/routes/admin/tickets.ts` — attachment upload | **Skip** | No file storage configured. | Attachments deferred |
| `apps/desk/app/(app)/tickets/[ticketId]/_components/TicketDetailWorkspace.tsx` — tab layout | **Refocus** | Reused 3-tab pattern (Thread / Notes / Timeline). Removed: WhatsApp compose, SLA strip, cockpit health score, department/agent selectors, attachment upload. | Provider/SLA/channel UI excluded |
| `apps/desk/app/(app)/tickets/page.tsx` — list with status filter views | **Refocus** | Reused status tabs + search pattern. Simplified: removed saved views, cockpit strip, overdue flag, assignedToMe filter. | Cockpit/SLA/overdue deferred |
| `components/tickets/TicketStatusMenu.tsx` / `TicketOwnerMenu.tsx` — status/priority badge colours | **Reuse** | Re-implemented as Tailwind inline `STATUS_CLS` / `PRIORITY_CLS` maps, same colour logic. | — |
| Timeline write pattern — `prisma.timelineEvent.create` on key events | **Reuse** | Same pattern reused for `TICKET_CREATED`, `TICKET_STATUS_CHANGED`, `TICKET_REPLY_ADDED`, `TICKET_INTERNAL_NOTE_ADDED`, `TICKET_ESCALATED_TO_ITSI_MOBILE`. | — |
| `apps/desk/lib/ticket-detail-utils.ts` — SLA/overdue/channel helpers | **Skip** | Not applicable without SLA policy or multi-channel. | — |
| Department/team model | **Skip** | Itsi Business has no department model. Assignment to staff user only. | Departments deferred |
| VIP account restriction (`account-access.ts`) | **Skip** | No VIP concept in Itsi Business. | — |

---

## Phase 6 — Business Billing Foundation reuse decisions

| Source (Itsi Mobile) | Reuse decision | Action | Skipped / boundary |
|---|---|---|---|
| `apps/billing/app/(app)/invoices/page.tsx` — invoice list, status filter tabs, search | **Refocus** | Reused status tab + search list pattern. Removed: Cockpit components, `account_id` selector from URL, PDF download column, subscription billing columns, finalise action. | Cockpit/PDF/subscription stripped |
| `apps/billing/app/(app)/invoices/page.tsx` — invoice detail drawer with line items | **Refocus** | Reused 2-column layout (lines+totals / sidebar). Removed: credit note, Xero sync button, GoCardless charge button, Stripe charge button. | All provider payment buttons excluded |
| `apps/billing/app/(app)/invoices/page.tsx` — edit modal for line items + due date | **Refocus** | Reused line item form pattern. Changed amounts from decimal pence strings to integer pence. Added: `serviceType`, `discountAmountPence`, `taxRate`. | Subscription rate card lookup excluded |
| Status badge colour palette (DRAFT/ISSUED/PAID/VOID etc.) | **Reuse** | Same colour semantics re-implemented as Tailwind `STATUS_CLS` map. | — |
| `apps/api/src/routes/admin/billing.ts` — RBAC hook structure | **Reuse** | Same `onRequest` hook array pattern with `requirePermission`. Permissions renamed: `billing.invoices.write`, `.issue`, `.void`, `billing.payments.record`. | — |
| `apps/api/src/routes/admin/billing.ts` — lifecycle guards (no edit on non-DRAFT) | **Reuse** | Same status guard pattern. Extended: cannot void PAID, cannot mark-paid on DRAFT or VOID. | — |
| `apps/api/src/routes/portal/invoices.ts` — list + get with includes | **Refocus** | Reused query shape. Removed `tenantId` filter, `account.billingAccount` include, `payments.transactions`. Added `lines`, `payments`. | Multi-tenancy stripped |
| `$transaction` + timeline write on lifecycle events | **Reuse** | Same pattern. Events: `INVOICE_CREATED`, `INVOICE_LINE_ADDED/UPDATED/DELETED`, `INVOICE_ISSUED`, `INVOICE_VOIDED`, `INVOICE_MARKED_PAID`. | — |
| Response envelope `{ success, data, meta }` | **Reuse** | Same pattern throughout. | — |
| `money()` helper | **Refocus** | Re-implemented using `Intl.NumberFormat('en-GB', { style: 'currency', currency })`. | Removed Cockpit decimal formatting |
| `billingApi` typed client | **Refocus** | Re-implemented from scratch matching new route structure. No legacy `billingAccount` intermediary. | — |
| PDF invoice generation | **Skip** | No file storage in Phase 6. | Deferred |
| Credit notes | **Skip** | No credit note model or route. | Deferred |
| Xero sync (`apps/api/src/services/xero/`) | **Skip (hard excluded)** | No accounting integration in Itsi Business Phase 6. | Hard excluded |
| GoCardless / Stripe collect routes | **Skip (hard excluded)** | No live payment collection. `mark-paid` is manual/offline only. | Hard excluded |
| Automated usage rating / rating engine | **Skip (hard excluded)** | No usage data or rate cards. | Hard excluded |
| Subscription billing model (`billingAccount`, `plan`, `ratingPeriod`) | **Skip** | Itsi Business invoices attach directly to `BusinessAccount`. No subscription intermediary. | Not applicable |
| Wholesale billing API calls (`/api/v1/wholesale/billing/…`) | **Skip (hard excluded)** | No wholesale billing calls. `wholesaleCostReference` field is placeholder only, never populated via API. | Hard excluded |
| Dunning / overdue automation | **Skip** | No scheduled job or dunning runner. OVERDUE status set manually or future background worker. | Deferred |

---

## Phase 7 — Business Service Catalogue reuse decisions

| Source (Itsi Mobile) | Reuse decision | Action | Skipped / boundary |
|---|---|---|---|
| `apps/api/src/routes/admin/billing.ts` — RBAC hook / Zod / `$transaction` patterns | **Reuse** | Same pattern. Permissions: `services.catalogue.read/write`, `services.records.read/write`, `services.wholesale_links.read/write`. | — |
| `apps/billing/src/lib/api.ts` — typed `apiFetch` client | **Reuse** | Pattern reused verbatim in `apps/services/src/lib/api.ts`. | — |
| `apps/billing/src/app/invoices/page.tsx` — status tabs, search, pagination | **Reuse** | Same UI pattern reused for catalogue list and service records list. | — |
| `apps/billing/src/app/page.tsx` — dashboard stat cards + two-panel layout | **Reuse** | Pattern reused in services dashboard. | — |
| `packages/staff-shell/src/workspace-urls.ts` + `app-switcher.tsx` | **Extend** | Added `services` workspace key, URL env `NEXT_PUBLIC_SERVICES_URL`, port 4010, switcher entry. | — |
| Timeline write pattern — `prisma.timelineEvent.create` | **Reuse** | Events: `CATALOGUE_ITEM_CREATED`, `CATALOGUE_ITEM_UPDATED`, `CATALOGUE_ITEM_ARCHIVED`, `MOBILE_SERVICE_CREATED`, `MOBILE_SERVICE_UPDATED`, `BROADBAND_SERVICE_CREATED`, `BROADBAND_SERVICE_UPDATED`, `ENERGY_SERVICE_CREATED`, `ENERGY_SERVICE_UPDATED`, `WHOLESALE_LINK_PLACEHOLDER_CREATED`. | — |
| `apps/api/src/routes/admin/telecom/` — service order routes | **Skip (hard excluded)** | Provider service-order routes belong to Itsi Mobile. Phase 7 creates retail records only. | Hard excluded |
| Gamma, KCOM, MS3 wholesale API clients | **Skip (hard excluded)** | No direct wholesale API calls. `ItsiMobileWholesaleServiceLink` is a local placeholder reference only. | Hard excluded |
| OTS Hero energy provisioning | **Skip (hard excluded)** | No energy provider API. Energy service records are retail-only. | Hard excluded |
| Itsi Mobile wholesale API (`/api/v1/wholesale/…`) | **Skip (hard excluded)** | Wholesale link placeholder created locally. NEVER calls Itsi Mobile at this phase. | Hard excluded |
| Number porting, SIM ordering, usage rating | **Skip (hard excluded)** | Provider fulfilment — belongs to Itsi Mobile. | Hard excluded |
| `money()` helper | **Reuse** | Re-implemented in `apps/services/src/lib/api.ts` using `Intl.NumberFormat('en-GB')`. Prices always stored as integer pence. | — |
| Response envelope `{ success, data, meta }` | **Reuse** | Same pattern throughout `catalogue.ts` and `services.ts` routes. | — |
