# Phase 15 — Itsi Mobile Feature Reuse Completion

> Phase 15 — Itsi Mobile Feature Reuse and Business Portal Completion

## Purpose

Systematically refocus mature Itsi Mobile Portal patterns into Itsi Business so the platform feels like a complete business-focused portal — not a separate scaffold.

## Wave 2 — Portal depth and shared table patterns (69efa7a → current)

### Itsi Mobile patterns copied/refocused

| Area | Itsi Mobile source | Itsi Business implementation |
|---|---|---|
| Product/plan cards | Public pricing card layout | `apps/portal/src/app/products/page.tsx` with type filters, setup fee, contract term |
| SIM/fleet table | `business/fleet/page.tsx` | `apps/portal/src/app/fleet/page.tsx` + `[id]` detail with metadata edit |
| Support list/detail | `support/page.tsx` | `apps/portal/src/app/tickets/` with filters, context labels, reply thread |
| Billing list/detail | `billing/page.tsx` expandable rows | `apps/portal/src/app/billing/` with status tabs, payment instructions panel |
| CRM tab empty states | Account workspace panels | `TabEmptyState` in CRM account tab panels |
| Shared tables/filters | Per-app table patterns | `@itsi-business/ui` `DataTable`, `FilterBar`, `LoadingList` |

### Pages completed in Wave 2

- Portal `/products` — filters, loading/error, enquiry CTA
- Portal `/fleet` and `/fleet/[id]` — contact/site, related tickets, activity timeline, explicit network defer
- Portal `/tickets` and `/tickets/[id]` — status/category/priority filters, context panel
- Portal `/billing` and `/billing/[id]` — outstanding/overdue KPIs, payment instructions (no fake pay/PDF)
- CRM Account 360 tabs — consistent empty states with guidance

### API enhancements

- `GET /api/v1/portal/tickets` — `category`, `priority`, `q` filters
- `GET /api/v1/portal/fleet` — contact and site resolution
- `GET /api/v1/portal/fleet/:id` — related tickets, customer-safe activity timeline

### Placeholder reduction

- Removed per-row fake Pay buttons from billing list
- Replaced invoice detail disabled pay/PDF with payment instructions panel when balance due
- Network control reasons now cite 13B-2 staging gate explicitly
- CRM tab panels use guided empty states instead of bare “No X yet” text

## What was copied / refocused from Itsi Mobile (Wave 1)

| Area | Itsi Mobile source | Itsi Business implementation |
|---|---|---|
| Portal dashboard layout | `ConsumerDashboard.tsx`, `portal-cockpit.tsx`, KPI chips | `apps/portal/src/app/page.tsx` + `portal-ui/` components |
| Status badges | `portal-ui/StatusBadges.tsx` | `apps/portal/src/components/portal-ui/StatusBadges.tsx` |
| Quick actions panel | `ActionListPanel` | `@itsi-business/ui` + portal dashboard |
| KPI components | `CompactKpiChip`, `MetricCard` | `@itsi-business/ui` |
| Admin platform dashboard | `apps/admin/dashboard/page.tsx` pattern | `apps/admin/src/app/page.tsx` wired to `/api/v1/stats/dashboard` |
| CRM Account 360 cockpit | Account hero / health strip (Phase 14) | Retained and documented in audit |
| Staff services dashboard | Aggregate KPI pattern | `/api/v1/services/summary` + Services home page |
| Desk CRM deep link | Workspace URL pattern | `WORKSPACE_URLS.crm` instead of hardcoded localhost |

## What was deliberately not copied

- Consumer usage rings and data allowance metrics
- Residential signup wizards and multi-account selector
- Stripe/GoCardless consumer checkout
- Gamma/KCOM/MS3/OTS Hero direct provisioning UI
- Itsi Mobile business handoff redirect (Business portal IS the target)
- Live SIM/network controls (blocked until 13B-2)
- Wholesale cost/margin in portal catalogue
- Work item visibility in portal (staff-only)

## Placeholder removal summary

| Before | After |
|---|---|
| Admin dashboard static KPI scaffold | Live stats from `/api/v1/stats/dashboard` + wholesale status |
| Services dashboard counts from 10-record sample | Aggregate counts from `/api/v1/services/summary` |
| Desk CRM link `localhost:4006` | `WORKSPACE_URLS.crm` |
| Billing wholesale reconciliation "Placeholder" badge | "Deferred" with 13B-2 reason |
| Portal dashboard "service health not yet available" stub | Real energy renewals, product enquiries, activity feed |

**Retained with explicit defer reasons (not fake data):**

- Portal pay invoice / PDF — online payment deferred
- Portal SIM/network controls — 13B-2 blocked, support ticket CTA
- Admin settings — SettingsPlaceholder
- Desk wholesale escalation — until `ITSI_MOBILE_WHOLESALE_ENABLED`

## Portal / staff boundary notes

- Portal dashboard API returns account-scoped data only
- No work item IDs, SLA state, or wholesale internals in portal responses
- Staff admin dashboard uses platform-wide stats (staff/platform realm only)
- Energy renewals/check-ins shown with customer-safe labels only

## Remaining gaps

- Admin settings full configuration UI
- Online invoice payment and PDF download
- Wholesale billing reconciliation (requires 13B-2 + billing bridge)
- Shared DataTable component (tables remain per-app, as in Itsi Mobile)
- Order tracking dedicated page (service detail covers local lifecycle for now)
- Fidelity Energy live API integration

## Blocked live network controls

Until Itsi Mobile 13B-2 real staging E2E passes:

- Bar/unbar SIM, SIM swap, roaming, spend cap, PAC/STAC, replacement SIM, tariff change
- Customer-triggered provider actions
- Auto retail service cease on upstream failure

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
