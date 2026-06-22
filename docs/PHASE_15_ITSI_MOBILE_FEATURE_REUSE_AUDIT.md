# Phase 15 — Itsi Mobile Feature Reuse Audit

> Generated: Phase 15 — Itsi Mobile Feature Reuse and Business Portal Completion  
> **Status: CLOSED** — Phase 16 closeout at `docs/PHASE_16_PLACEHOLDER_UX_CLOSEOUT.md`  
> Source repo: `HFDavid89/itsimobileportal`  
> Target repo: `HFDavid89/itsibusinessportal`

## Golden rule

> **Copy/refocus proven Itsi Mobile logic wherever possible.**  
> **Only rewrite where business ownership, wholesale boundary, or customer type requires it.**

---

## Feature parity matrix

| Feature area | Itsi Mobile source | Reuse decision | Itsi Business target | Business changes | Boundary risks | Priority |
|---|---|---|---|---|---|---|
| **Dashboard (portal)** | `apps/portal/components/ConsumerDashboard.tsx`, `portal-ui/portal-cockpit.tsx` | **Refocus** | `apps/portal/src/app/page.tsx` | Remove usage/rating; add multi-service counts, energy renewals, product enquiries | Residential usage metrics | **P0** |
| **Login / session** | `apps/portal/lib/auth-context.tsx`, `LoginPage` | **Reuse** | `apps/portal/src/app/login/page.tsx` | Portal realm only; business account scoping | Consumer signup flows | Done |
| **Account page** | `apps/portal/app/(app)/account/page.tsx` | **Refocus** | `apps/portal/src/app/account/page.tsx` | Company profile, sites, contacts — no residential profile | Consumer household fields | **P1** |
| **Products / plans** | `apps/portal/app/(public)/pricing/page.tsx`, signup product cards | **Refocus** | `apps/portal/src/app/products/page.tsx` | Enquiry ticket only; retail price visible; no wholesale cost | Direct ordering | **P1** |
| **Services list/detail** | `apps/portal/app/(app)/services/page.tsx`, `[serviceId]/page.tsx` | **Refocus** | `apps/portal/src/app/services/` | Mobile/broadband/energy grouping; customer-safe status labels | Provider refs | **P1** |
| **SIM / fleet** | `apps/portal/app/(app)/business/fleet/page.tsx` | **Refocus** | `apps/portal/src/app/fleet/` | Label/cost centre edit; disabled network controls with support CTA | Live SIM actions | **P1** |
| **Order tracking** | `apps/portal/app/(app)/orders/page.tsx` | **Refocus** | Service detail + wholesale safe status | Local lifecycle + simulated statuses until 13B-2 | Provider KCI internals | **P2** |
| **Tickets / support** | `apps/portal/app/(app)/support/page.tsx` | **Refocus** | `apps/portal/src/app/tickets/` | Customer-visible threads only | Internal notes | **P1** |
| **Billing** | `apps/portal/app/(app)/billing/page.tsx` | **Refocus** | `apps/portal/src/app/billing/` | Business invoice lines; disabled pay/PDF with reason | Online payment (deferred) | **P1** |
| **Notifications** | `packages/staff-shell/notification-bell.tsx` | **Reuse** | Staff shell | Staff-only | Consumer push | **P3** |
| **Settings / profile** | `apps/portal/app/(app)/account/page.tsx` tabs | **Refocus** | `apps/portal/src/app/settings/page.tsx` | Contact edit; company edit deferred | Residential spend cap | **P2** |
| **Admin dashboard** | `apps/admin/app/(app)/dashboard/page.tsx` | **Refocus** | `apps/admin/src/app/page.tsx` | Platform KPIs from `/api/v1/stats/dashboard` | Reseller tenant metrics | **P0** |
| **Staff catalogue** | `apps/admin/app/(app)/catalog/products/page.tsx` | **Refocus** | `apps/services/src/app/catalogue/` | customerVisible toggle; margin separation | Consumer SKU assumptions | **P1** |
| **CRM Account 360** | `apps/crm/app/(app)/accounts/[accountId]/` | **Refocus** | `apps/crm/src/app/accounts/[id]/` | Business tabs; work items; energy tracking | Gamma/VoIP tabs | **P1** |
| **Desk tickets** | `apps/desk/app/(app)/tickets/` | **Refocus** | `apps/desk/src/app/tickets/` | Work item links; SLA integration | Escalation to provider | **P1** |
| **Billing staff** | `apps/billing/app/(app)/` | **Refocus** | `apps/billing/src/app/` | Business invoice lifecycle; no energy supplier billing | Xero/Stripe direct | **P2** |
| **Status badges** | `packages/ui/StatusBadge.tsx`, portal `StatusBadges.tsx` | **Reuse** | `@itsi-business/ui` + portal components | Business service status keys | Provider status enums | **P0** |
| **KPI cards** | `packages/ui/MetricCard.tsx`, `CompactKpiChip.tsx` | **Reuse** | `@itsi-business/ui` | Real API counts | Fake trend data | **P0** |
| **Data tables** | CRM `accounts/page.tsx`, Desk tickets list | **Refocus** | Per-app tables | Account-scoped portal; staff permissions | Shared DataTable (none in Mobile) | **P2** |
| **Empty states** | `packages/ui/EmptyState.tsx`, `PortalEmptyState.tsx` | **Reuse** | `@itsi-business/ui` + portal | Business copy | — | **P1** |
| **Loading / error** | `PageSkeleton`, `LoadErrorPanel` | **Reuse** | `@itsi-business/ui` | — | — | **P1** |
| **Detail headers** | CRM `AccountHero.tsx`, portal `PortalHero` | **Refocus** | CRM cockpit + portal hero | Company name vs consumer name | — | **P1** |
| **Timeline** | `@itsi/timeline`, CRM account timeline tab | **Refocus** | CRM Account 360 + service detail | Customer-safe events in portal | Provider events | **P2** |
| **Confirmation modals** | Admin catalog, Desk status menus | **Refocus** | Services wholesale confirm | Explicit submit for wholesale order | — | Done |
| **Work queue** | CRM next-action pattern | **Refocus** | `apps/services/work-queue/` | BusinessWorkItem model | Itsi Mobile task import | Done (Phase 14) |

---

## Placeholder completion matrix

| App | Route | Current state | Phase 15 action |
|---|---|---|---|
| **Admin** | `/` | Static KPI scaffold | Wire to `/api/v1/stats/dashboard` + wholesale status |
| **Admin** | `/settings` | SettingsPlaceholder | **Wave 3:** `DeferredSettingsPanel` — env-managed vs UI-deferred |
| **CRM** | `/`, `/accounts/*` | Real API | Polish empty states; remove any demo remnants |
| **Billing** | `/` | Real KPIs + wholesale reconciliation placeholder | Remove fake panel; link to Services work queue |
| **Billing** | `/invoices/[id]` | Wholesale cost ref field label | Rename to staff-only internal ref |
| **Desk** | `/tickets/[id]` | Hardcoded localhost CRM link | Use `WORKSPACE_URLS.crm` |
| **Desk** | `/tickets/[id]` escalation | Placeholder until wholesale | Keep with explicit 13B-2 reason |
| **Services** | `/` | KPIs from 10-record sample | Add `/api/v1/services/summary` aggregate counts |
| **Portal** | `/` | Basic stats; service health stub | Refocus ConsumerDashboard layout; real energy/enquiry data |
| **Portal** | `/billing/*` | Pay/PDF disabled | Keep — explicit deferred reason (not fake) |
| **Portal** | `/fleet/*` | Network controls disabled | Keep — 13B-2 blocked with support CTA |
| **Portal** | `/settings` | Company edit disabled | Keep — staff-managed company profile |

---

## Residential assumptions to remove

| Itsi Mobile pattern | Do not copy | Business alternative |
|---|---|---|
| Consumer usage rings / data allowance | Yes | Service count + status summary |
| Residential signup wizards | Yes | Staff-provisioned accounts + portal invite |
| Multi-account consumer selector | Yes | Single business account per portal user |
| Subscription bolt-ons / porting self-service | Yes | Support ticket or staff workflow |
| Stripe/GoCardless consumer checkout | Yes | Invoice + manual payment instructions |
| Gamma/KCOM direct provisioning UI | Yes | Itsi Mobile wholesale bridge (staff only) |
| Business handoff redirect | N/A (inverse) | Business portal IS the target |

---

## Provider / wholesale boundaries (unchanged)

- No Gamma, KCOM, MS3, OTS Hero, or Fidelity live API calls from Itsi Business UI
- Mobile/broadband fulfilment via Itsi Mobile wholesale bridge only
- Energy via manual Fidelity portal + Itsi Business renewal/check-in tracking
- Live SIM/network controls blocked until 13B-2 real staging E2E passes
- Portal never sees work items, wholesale costs, or provider payloads

---

## Implementation priority order

1. **P0** — Admin dashboard real data; portal dashboard refocus; shared KPI components; placeholder gate script ✅ Wave 1
2. **P1** — Portal products/services/fleet/tickets/billing polish ✅ Wave 2
3. **P2** — Billing staff polish; order tracking copy; timeline enrichment
4. **P3** — Admin settings; notifications; advanced CRM tabs

### Wave 2 completion status

| P1 item | Status |
|---|---|
| Portal products polish | Done |
| Portal fleet detail polish | Done |
| Portal tickets UX polish | Done |
| Portal billing UX polish | Done |
| CRM Account 360 empty states | Done |
| Shared DataTable/FilterBar | Done |

---

## Validation commands

```bash
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/admin type-check
pnpm --filter @itsi-business/crm type-check
pnpm --filter @itsi-business/billing type-check
pnpm --filter @itsi-business/desk type-check
pnpm --filter @itsi-business/services type-check
pnpm --filter @itsi-business/portal type-check
pnpm --filter @itsi-business/api test
node scripts/check-wiring.mjs
pnpm check-placeholders
```
