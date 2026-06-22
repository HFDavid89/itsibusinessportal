# Phase 16 — Portal Boundary Compliance Audit

> Date: 2026-06-22  
> Scope: `apps/portal` routes + `/api/v1/portal/*`  
> Baseline: Phase 13 security boundaries, Phase 14 portal boundary rules

## Result: PASS WITH FIXES APPLIED

Phase 16 hardened portal boundaries and removed customer-facing leakage risks. All portal routes remain account-scoped via `portalGuard` + `requireRealm('portal')`.

---

## Summary

| Check | Status |
|-------|--------|
| Account-scoped data | Pass |
| No work items exposed | Pass |
| No staff SLA exposed | Pass |
| No internal notes in tickets | Pass (threads filtered) |
| No provider/wholesale payloads | Pass (sanitized) |
| No wholesale costs in portal | Pass |
| No fake pay/PDF buttons | Pass |
| No customer wholesale execution | Pass |

---

## Routes audited

| Route | Account-scoped | Notes |
|-------|----------------|-------|
| `/` (dashboard) | Yes | KPIs from `/api/v1/portal/dashboard` |
| `/products` | Catalogue global; enquiry account-scoped | By design |
| `/services`, `/services/[id]` | Yes | Customer-safe status labels |
| `/fleet`, `/fleet/[id]` | Yes | Metadata edit only; network controls disabled |
| `/tickets`, `/tickets/[id]` | Yes | Customer-visible threads only |
| `/billing`, `/billing/[id]` | Yes | No staff invoice notes |
| `/account` | Yes | |
| `/settings` | Yes | Contact edit only; company edit deferred |

---

## Fixes applied in Phase 16

### P1 — Activity label allowlist (API)

**Files:** `apps/api/src/routes/portal/helpers.ts`, `index.ts`, `portal-phase13.ts`

- Added `PORTAL_CUSTOMER_ACTIVITY_TYPES` allowlist
- Dashboard and fleet activity feeds filter to customer-safe events only
- Unknown/internal event types (e.g. `WHOLESALE_ORDER_REQUESTED`) no longer appear in portal

### P2 — Invoice notes removed from portal API

**File:** `apps/api/src/routes/portal/index.ts`

- Staff-written invoice `notes` omitted from `GET /portal/invoices/:id`
- Portal billing detail notes panel removed

### P3 — Fleet contact/site defense-in-depth

**File:** `apps/api/src/routes/portal/index.ts`

- Fleet list contact/site lookups now include `accountId` in `where` clause

### P4 — Customer copy jargon removed (UI)

**Files:** `apps/portal/src/components/PortalRequests.tsx`, `apps/portal/src/app/fleet/[id]/page.tsx`

- Replaced "staging E2E passes" with customer-safe defer reasons
- Network controls: "not available in the portal yet — raise a support ticket"

---

## Confirmed boundaries (no change needed)

- Work items created server-side on enquiries/tickets — never returned to portal
- `sanitizeTicketForPortal` strips wholesale escalation and assignee fields
- Portal invoice list excludes DRAFT/VOID
- Product catalogue shows retail price only (`customerVisible` items)
- Payment instructions shown when balance due; no online pay button
- Energy shown with Fidelity-safe status labels

---

## Remaining low-priority items (documented, not blocking)

| Item | Risk | Mitigation |
|------|------|------------|
| Raw status enums in portal API payloads | Low — UI maps to labels | Future: map statuses in API responses |
| Legacy portal pages (services list, account) use inline styles | UX only | Phase 17+ portal modernization |
| `businessServiceReference` on invoice lines | Low — business ref, not provider | UI shows description first |

---

## Verification

```bash
pnpm --filter @itsi-business/api test
pnpm check-placeholders
```

Manual: confirm portal user cannot access `/api/v1/work-items`, `/api/v1/stats/dashboard`, or staff ticket internal notes.
