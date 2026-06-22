# Phase 17 — Management Reporting and Operational Dashboards

> Status: **COMPLETE**  
> Base: `e8ed215` (Phase 16) → Phase 17 commit  
> Audience: Directors, platform admins, finance/billing staff, operations/service desk staff

Phase 17 builds the **business control tower** — staff-only management reporting from real database aggregates. This is **not** production readiness, live provider integration, or live SIM/network control.

---

## Hard boundaries (unchanged)

| Rule | Implementation |
|------|----------------|
| Portal users must not see management reports | `/api/v1/reports/*` requires `platform` or `staff` realm + `reports.*` permissions |
| No live SIM/network actions | Services report wholesale counts are local link status only |
| No provider API calls | Reporting service uses Prisma aggregates only |
| No raw wholesale/provider payloads | Wholesale section labelled simulated/local until 13B-2 |
| Energy = manual Fidelity tracking | Energy report label states manual referral/renewal |
| Wholesale billing reconciliation deferred | Billing report excludes reconciliation metrics |
| Online payment / PDF metrics deferred | Billing report footer references deferred register |

---

## Part A — Reporting API

**Location:** `apps/api/src/services/reporting/`

| File | Purpose |
|------|---------|
| `query.ts` | `from`, `to`, `accountId`, `serviceType`, `status` query parsing |
| `account-health.ts` | `classifyAccountHealth()` — score + tier |
| `billing-ageing.ts` | `computeAgeingBuckets()` — invoice ageing |
| `report-service.ts` | All report aggregations |

**Routes:** `apps/api/src/routes/reports.ts` — prefix `/api/v1/reports`

| Endpoint | Permission |
|----------|------------|
| `GET /overview` | `reports.read` |
| `GET /billing` | `reports.read` **or** `reports.billing.read` |
| `GET /services` | `reports.read` **or** `reports.operations.read` |
| `GET /desk` | `reports.read` **or** `reports.operations.read` |
| `GET /work-items` | `reports.read` **or** `reports.operations.read` |
| `GET /energy` | `reports.read` **or** `reports.energy.read` |
| `GET /products` | `reports.read` **or** `reports.operations.read` |
| `GET /accounts` | `reports.read` |

**Query params:** `from`, `to`, `accountId` (where useful), `serviceType`, `status`

**Seed:** `STAFF` role receives all four report permissions; `PLATFORM_ADMIN` has `*`.

---

## KPI definitions

### Overview (`/overview`)

| KPI | Source |
|-----|--------|
| Business accounts (total / active) | `BusinessAccount` count by `status` |
| Active services | Sum of active mobile + broadband + contracted/renewal-due energy |
| Open tickets | `BusinessTicket` in open statuses |
| Outstanding / overdue | Invoice balance due on ISSUED/PART_PAID/OVERDUE and OVERDUE |
| Open work items / breached / due soon / assigned to me | `getWorkQueueStats()` |
| Product enquiries open | `BusinessWorkItem` type `PRODUCT_ENQUIRY` open |
| Energy renewals / check-ins due | `BusinessEnergyService` renewal and check-in dates |
| 30-day activity | Ticket/invoice/work-item counts — **not** full time-series |

### Billing (`/billing`)

| KPI | Source |
|-----|--------|
| Outstanding / overdue balance | Invoice `totalPence - amountPaidPence` |
| Status counts | DRAFT, ISSUED, PART_PAID, PAID, OVERDUE, VOID |
| Due in 7/14/30 days | Outstanding invoices with `dueDate` in window |
| Ageing buckets | `computeAgeingBuckets()` — current, 1–30, 31–60, 61–90, 90+ days past due |
| Billing by service type | Invoice line `grossAmountPence` grouped by `serviceType` |
| Top overdue accounts | Accounts ranked by overdue balance |

### Services (`/services`)

| KPI | Source |
|-----|--------|
| Mobile / broadband / energy by status | `groupBy` on service tables |
| Broadband access technology | Active broadband `accessTechnology` |
| Data quality | Mobile without contact; services with open work items |
| Wholesale | `ItsiMobileWholesaleServiceLink` status — **local/simulated until 13B-2** |

### Desk (`/desk`)

| KPI | Source |
|-----|--------|
| Open / unassigned / with work items | Open ticket query + assignment |
| By status / priority / category | `groupBy` |
| Average / oldest open age | `createdAt` vs now |

### Work queue (`/work-items`)

| KPI | Source |
|-----|--------|
| Open / assigned / unassigned / due soon / breached | `getWorkQueueStats()` |
| Completed this month | Resolved items with `completedAt` in current month |
| By type / priority / status / breached by type | `groupBy` |

### Energy (`/energy`)

| KPI | Source |
|-----|--------|
| Pipeline (referred, quote, contracted, lost) | Energy status counts |
| Renewals 30/60/90 days | `contractEndDate` / `RENEWAL_DUE` |
| Check-ins due | `nextCheckInDate` |
| Missing supplier/meter | Null `supplierName` or `meterPointReference` |
| Estimated annual spend | Sum of `estimatedAnnualSpendPence` where entered |

### Products (`/products`)

| KPI | Source |
|-----|--------|
| Customer-visible catalogue | `BusinessServiceCatalogueItem` ACTIVE + `customerVisible` |
| Incomplete catalogue | Missing price/term/description |
| Open enquiries | `BusinessWorkItem` PRODUCT_ENQUIRY open |

### Account health (`/accounts`)

| Tier | Logic |
|------|-------|
| Healthy | Score ≥ 75 |
| Watch | Score 55–74 |
| At risk | Score 35–54 |
| Needs attention | Score < 35 |

Signals: account status, contacts/sites, open tickets, overdue invoices, breached/due-soon work items, active services, energy renewals, product enquiries.

CRM Account 360 retains local `computeAccountHealth()` for cockpit display; reporting API uses the shared `classifyAccountHealth()` for consistency.

---

## Part B–I — Admin UI

**App:** `apps/admin`  
**Route:** `/reports` (tab shell via `ReportShell`)

| Page | Path |
|------|------|
| Overview | `/reports` |
| Billing | `/reports/billing` |
| Services | `/reports/services` |
| Desk | `/reports/desk` |
| Work queue / SLA | `/reports/work-items` |
| Energy | `/reports/energy` |
| Products | `/reports/products` |
| Account health | `/reports/accounts` |

**Shared UI:** `packages/ui/src/reporting.tsx` — `ReportKpiGrid`, `ReportSection`, `AgeingBucketBar`, `StatusDistributionTable`, `DrilldownLinkList`, `RiskBadge`, `TrendTable`

---

## Drill-down routes

| From report | Target |
|-------------|--------|
| Billing — top overdue | Billing `/invoices?accountId=&status=OVERDUE` |
| Desk — oldest tickets | Desk `/tickets/:id` |
| Work queue — oldest items | Services `/work-queue/:id` |
| Account health | CRM `/accounts/:id` |
| Overview | Sub-reports + breached queue + desk tickets |

Cross-workspace URLs use `WORKSPACE_URLS` from `@itsi-business/staff-shell`.

---

## Limitations and deferred metrics

| Metric | Status |
|--------|--------|
| Full MRR time-series | Deferred — overview shows 30-day activity counts only |
| Wholesale billing reconciliation | Deferred until 13B-2 + Itsi Mobile wholesale billing E2E |
| Live network / SIM status reporting | Deferred until 13B-2 |
| Online payment / PDF metrics | Deferred — not shown |
| Real Itsi Mobile lifecycle trends | Deferred until 13B-2 |
| Energy supplier billing | Not applicable — manual referral model |
| Charting library | Not added — tables/cards only |

---

## Validation commands

```bash
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/admin type-check
pnpm --filter @itsi-business/ui type-check
pnpm --filter @itsi-business/api test
node scripts/check-wiring.mjs
pnpm check-placeholders
```

**Reporting unit tests:** `pnpm --filter @itsi-business/api test:reporting`

- Account health classification
- Billing ageing buckets
- Portal boundary (reports staff-only; portal routes exclude `/reports`)

---

## Files touched (summary)

- `apps/api/src/services/reporting/*`
- `apps/api/src/routes/reports.ts`
- `apps/api/src/index.ts`
- `apps/api/prisma/seed.ts`
- `apps/admin/src/app/reports/**`
- `apps/admin/src/components/ReportShell.tsx`
- `apps/admin/src/lib/reports-api.ts`
- `packages/ui/src/reporting.tsx`
- `packages/staff-shell/src/nav-config.ts`
- `packages/staff-shell/src/wiring-registry.ts`
- `scripts/check-wiring.mjs`

---

## Next phase

**Phase 18** — Dependency/runtime modernisation (after reporting layer exposes remaining data gaps).
