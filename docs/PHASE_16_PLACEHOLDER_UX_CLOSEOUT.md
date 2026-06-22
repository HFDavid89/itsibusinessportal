# Phase 16 — Placeholder and UX Consistency Closeout

> Phase 16 — Placeholder Removal and UX Consistency Closeout  
> Base commit: `5c738bb` (Phase 15 Wave 3)  
> Closeout commit: current

## Objective

Formal quality gate after Phase 15. Remove or properly classify remaining placeholders, fake data, thin pages, inconsistent UX, broken links, and confusing deferred features — without expanding scope into new product features.

**This is not production readiness.** It is a consistency gate before Phase 17 (management reporting / operational dashboards).

---

## Checks run

| Check | Result |
|-------|--------|
| `pnpm check-placeholders` | Pass |
| Manual scan (placeholder, coming soon, mock, localhost, TODO) | Reviewed — see findings below |
| Portal boundary audit | Pass with fixes — `docs/PHASE_16_PORTAL_BOUNDARY_AUDIT.md` |
| UX consistency audit | Documented — `docs/PHASE_16_UX_CONSISTENCY_AUDIT.md` |
| Cross-app link audit | Pass — `WORKSPACE_URLS` verified; billing/desk API transport fixed |
| Data authenticity audit | Pass — all dashboards API-backed |
| `pnpm --filter @itsi-business/* type-check` | Pass |
| `pnpm --filter @itsi-business/api test` | Pass |
| `node scripts/check-wiring.mjs` | Pass |

---

## Pages reviewed

### Portal
- Dashboard, products, services, fleet, tickets, billing, account, settings

### Staff
- Admin overview, settings, wholesale, energy integration
- CRM accounts list + Account 360
- Billing dashboard, invoices list/detail
- Desk dashboard, tickets list/detail
- Services dashboard, records, catalogue, work queue

### Packages
- `packages/ui` — DataTable, FilterBar, DetailHeader, format helpers
- `packages/staff-shell` — DeferredSettingsPanel, WORKSPACE_URLS, apiFetch

---

## Fixes made

### Code

| Area | Fix |
|------|-----|
| Billing API client | Migrated to `@itsi-business/staff-shell` `apiFetch` (fixes `localhost:4001` drift) |
| Desk API client | Same migration + `/api/v1` path prefix |
| Portal activity feeds | Customer-safe event allowlist; no raw internal timeline types |
| Portal invoice detail | Staff `notes` omitted from API; UI panel removed |
| Portal fleet list | Contact/site lookups scoped by `accountId` |
| Portal network defer copy | Removed "staging E2E" jargon |
| Desk escalation panel | "Deferred" badge + explicit 13B-2 reason |
| Billing invoice line form | Renamed wholesale cost ref label |
| EnergyTrackingPanel | `WORKSPACE_URLS.crm` instead of hardcoded CRM URL |
| Work queue due dates | `fmtDateTime` helper (fixes datetime formatting bug) |
| Tickets escalation API message | Explicit defer wording |
| Shared format helpers | `packages/ui/src/format.ts` — `money`, `fmtDate`, `fmtDateTime` |

### Documentation

| Document | Purpose |
|----------|---------|
| `docs/DEFERRED_FEATURE_REGISTER.md` | Canonical deferred feature list |
| `docs/PHASE_16_PORTAL_BOUNDARY_AUDIT.md` | Portal security/copy boundary audit |
| `docs/PHASE_16_UX_CONSISTENCY_AUDIT.md` | Cross-app UX consistency findings |
| `docs/PHASE_16_PLACEHOLDER_UX_CLOSEOUT.md` | This document |
| Phase 15 docs updated | Closeout summary added |

---

## Placeholder scan classifications

| Finding | Classification |
|---------|----------------|
| `SettingsPlaceholder` (staff-shell) | Docs-only — superseded by `DeferredSettingsPanel`; kept for export compatibility |
| `app-switcher` "Coming soon" for unavailable workspaces | Explicit defer — workspace not deployed |
| Wholesale mock server (API tests) | Complete — test infrastructure only |
| `wholesale-link-placeholder` API route | Explicit defer — local reference only, no provider call |
| Input `placeholder=` attributes | Complete — HTML hints, not UI placeholders |
| Admin energy integration "Environment placeholders" | Docs-only — env var documentation |
| Legacy portal inline-style pages | Explicit defer — Phase 17 Tailwind migration |

---

## Remaining known gaps (Phase 17+)

- Domain status badge consolidation across staff apps
- Staff dashboard `LoadingList` / `PageSkeleton` rollout
- Legacy portal pages (services list, account, settings) Tailwind migration
- CRM inline money formatting → shared `money()` helper
- Online payment and PDF generation (see deferred register)
- Wholesale billing reconciliation (13B-2 blocked)
- Live SIM/network controls (13B-2 blocked)

---

## Phase 15 closeout statement

Phase 15 is **complete** across three waves:

| Wave | Focus | Outcome |
|------|-------|---------|
| Wave 1 | Audit, shared UI, portal cockpit, admin/services foundations | Shipped `69efa7a` |
| Wave 2 | Portal products, fleet, tickets, billing, CRM empty states | Shipped `82d88b9` |
| Wave 3 | Staff CRM, billing, services, desk, work queue depth | Shipped `5c738bb` |

No Wave 4 required. Platform is ready for **Phase 17 — management reporting and operational dashboards**.

---

## Deferred feature register

See: [DEFERRED_FEATURE_REGISTER.md](./DEFERRED_FEATURE_REGISTER.md)

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
pnpm --filter @itsi-business/ui type-check
pnpm --filter @itsi-business/api test
node scripts/check-wiring.mjs
pnpm check-placeholders
```

---

## Hard boundaries (unchanged)

- No live SIM/network actions until 13B-2
- No provider API calls from Itsi Business UI
- No raw wholesale/provider payloads in any customer UI
- No fake pay/PDF buttons
- Portal must not expose work items, SLA, wholesale costs, or internal notes
