# Phase 16 — UX Consistency Audit

> Generated: Phase 16 — Placeholder Removal and UX Consistency Closeout  
> Scope: portal, admin, crm, billing, desk, services/work-queue, packages/ui, packages/staff-shell

## Executive summary

Phase 15 delivered shared table/filter primitives and cross-app `WORKSPACE_URLS` wiring. Phase 16 closes transport drift, defers copy standardisation, and documents remaining visual inconsistencies for Phase 17.

**Phase 16 fixes applied:** billing/desk API transport unified; shared `fmtDate`/`fmtDateTime`/`money` in `@itsi-business/ui`; work-queue date bug fixed; deferred-feature copy aligned; `EnergyTrackingPanel` uses `WORKSPACE_URLS`.

**Remaining for Phase 17:** domain status badge consolidation; staff empty/loading state rollout; legacy portal page Tailwind migration.

---

## Canonical targets

| Concern | Canonical home | Status after Phase 16 |
|---------|----------------|----------------------|
| API transport (staff) | `@itsi-business/staff-shell` `apiFetch` | Billing + desk migrated |
| Dates | `@itsi-business/ui` `fmtDate` / `fmtDateTime` | Added; work-queue uses it |
| Money | `@itsi-business/ui` `money()` | Added; billing/services retain local re-exports |
| Cross-app links | `WORKSPACE_URLS.*` | EnergyTrackingPanel fixed |
| Deferred features | `DeferredSettingsPanel`, "Deferred" badge + reason | Desk escalation aligned |
| Staff empty states | `StaffEmptyState` | Desk tickets + work queue |
| Portal empty/loading | `LoadingList`, `PortalPage` | Modern portal pages |
| Detail headers | `DetailHeader` | Services record detail |

---

## Findings by area

### A. API transport — FIXED

| Before | After |
|--------|-------|
| `apps/billing/src/lib/api.ts` defaulted to `localhost:4001` | Uses `staff-shell` `apiFetch` → `localhost:17001` |
| `apps/desk/src/lib/api.ts` same + no Bearer refresh | Uses `staff-shell` `apiFetch` with auth refresh |

### B. Status badges — DOCUMENTED (Phase 17)

- `@itsi-business/ui/StatusBadge` exists but staff apps use ~15 local `STATUS_CLS` maps
- Portal uses friendly labels via `labels.ts`; staff shows raw enums
- Recommendation: domain badges (`InvoiceStatusBadge`, `TicketStatusBadge`, etc.) in Phase 17

### C. Date formatting — PARTIALLY FIXED

- Added shared helpers in `packages/ui/src/format.ts`
- Work-queue due column bug fixed (`toLocaleDateString` with hour/minute → `fmtDateTime`)
- CRM inline `toFixed(2)` money and mixed `numeric` vs `2-digit` day remain for Phase 17

### D. Empty & loading states — DOCUMENTED

- `StaffEmptyState`: desk tickets list, work queue
- `LoadingList`: portal modern pages
- Staff dashboards still use plain "Loading…" text — acceptable for Phase 16

### E. Page headers — DOCUMENTED

- `DetailHeader` on services record detail only
- CRM retains `BusinessAccountHero` (intentional command-centre pattern)
- Desk/billing detail use custom headers — Phase 17 optional migration

### F. Deferred copy — FIXED

| Location | Before | After |
|----------|--------|-------|
| Desk escalation panel | "placeholder until" | "Deferred" badge + 13B-2 reason |
| Billing wholesale cost ref label | "Wholesale Cost Ref (placeholder)" | "Internal cost reference" + defer note |
| Portal network controls | "staging E2E passes" | Customer-safe defer message |
| Admin settings | `SettingsPlaceholder` | `DeferredSettingsPanel` (Wave 3) |

### G. Cross-app links — FIXED

- `EnergyTrackingPanel`: `NEXT_PUBLIC_CRM_URL` → `WORKSPACE_URLS.crm`
- CRM, billing, desk, services, admin: verified `WORKSPACE_URLS` usage

### H. Portal vs staff visual gap — DOCUMENTED

Legacy portal pages (`services/page.tsx`, `account/page.tsx`, `settings/page.tsx`) still use inline styles. Modern pages (dashboard, tickets, billing, fleet, products) use Tailwind + shared UI. Phase 17 can migrate legacy pages.

---

## Phase 17 recommendations

1. Domain status badge components in `@itsi-business/ui`
2. `StaffEmptyState` on billing invoice list, CRM accounts list, services records
3. Portal legacy page Tailwind migration
4. CRM money formatting via shared `money()` helper
5. Optional `DetailHeader` on desk ticket and billing invoice detail

---

## Verification checklist

- [x] Billing/desk use `staff-shell` apiFetch
- [x] No `localhost:4001` in billing/desk API clients
- [x] `pnpm check-wiring` passes
- [x] `pnpm check-placeholders` passes
- [ ] Visual spot-check same status in portal + staff (Phase 17)
