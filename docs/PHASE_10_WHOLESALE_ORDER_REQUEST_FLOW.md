# Phase 10 — Wholesale Order Request Flow from Business Service Records

> Staff-side only. Customer portal must not trigger wholesale ordering or expose provider references.

## Goal

Allow staff users to request Itsi Mobile wholesale fulfilment from existing **MOBILE** and **BROADBAND** retail service records, using the Phase 8 wholesale bridge only.

## Route table

All routes are registered under `/api/v1/services` with explicit type prefixes (no ambiguous `/:id` wholesale routes).

| Method | Route | Permissions |
|--------|-------|-------------|
| POST | `/api/v1/services/mobile/:id/request-wholesale-order` | `services.records.write`, `services.wholesale_links.write`, `wholesale.write` |
| POST | `/api/v1/services/broadband/:id/request-wholesale-order` | same |
| GET | `/api/v1/services/mobile/:id/wholesale-status` | `services.records.read`, `services.wholesale_links.read`, `wholesale.read` |
| GET | `/api/v1/services/broadband/:id/wholesale-status` | same |
| POST | `/api/v1/services/mobile/:id/refresh-wholesale-status` | `services.records.write`, `services.wholesale_links.write`, `wholesale.write` |
| POST | `/api/v1/services/broadband/:id/refresh-wholesale-status` | same |

Phase 7 placeholder route remains separate:

| POST | `/api/v1/services/:id/wholesale-link-placeholder` | Local placeholder only — never calls Itsi Mobile |

## Request body (`request-wholesale-order`)

```json
{
  "quoteId": "optional",
  "productCode": "optional",
  "contactName": "optional",
  "contactPhone": "optional",
  "notes": "optional",
  "confirm": true
}
```

Validated with Zod. `confirm` must be exactly `true`.

## Request flow

1. Staff opens service detail in **Services** workspace (`/records/[id]`).
2. **Wholesale Fulfilment** panel shows **Request Wholesale Order** when eligible.
3. Staff confirms via modal checkbox (`confirm: true`).
4. API loads retail service + account/site data.
5. API validates lifecycle and data (see below).
6. API builds `WholesaleOrderPayload` and calls `itsiMobileClient.createOrder()` via the wholesale bridge.
7. API creates `ItsiMobileWholesaleServiceLink` and attaches `wholesaleServiceLinkId` to the retail service.
8. Retail status moves to `REQUESTED` when currently `DRAFT` (unchanged if already `REQUESTED`).
9. Timeline events: `WHOLESALE_ORDER_REQUESTED`, `SERVICE_STATUS_UPDATED` (if status changed).
10. Response returns updated service + wholesale link.

## Refresh status flow

1. Staff clicks **Refresh Status** on a service with an existing wholesale link.
2. API returns 404 if no link; 400 if link has no `itsiMobileWholesaleOrderId`.
3. API polls `itsiMobileClient.getOrderStatus()` via the bridge.
4. API stores `lastStatusCheckedAt` and sanitized `lastStatusResponse`.
5. Local link status updated via explicit mapper.
6. Retail service promoted to `ACTIVE` only when upstream status is explicitly completion-safe.
7. Timeline event: `WHOLESALE_STATUS_REFRESHED`.

## Validation rules

| Rule | Behaviour |
|------|-----------|
| Service types | MOBILE and BROADBAND only |
| ENERGY | Rejected — UI shows disabled panel |
| Retail status | Only `DRAFT` or `REQUESTED` |
| Blocked statuses | `CEASED`, `CANCELLED`, `SUSPENDED` rejected |
| Existing link | Rejected if `wholesaleServiceLinkId` already set |
| Account | Service must have `accountId` |
| Broadband postcode | Required before order |
| `confirm` | Must be `true` |

## Status mapping

Conservative local mapper (`apps/api/src/services/wholesale/status-mapper.ts`):

| Upstream (Itsi Mobile) | Local link status |
|------------------------|-------------------|
| PENDING, REQUESTED, SUBMITTED, IN_PROGRESS, PROCESSING | PENDING |
| ACTIVE, COMPLETED, LIVE, PROVISIONED | ACTIVE |
| CEASED, TERMINATED, DISCONNECTED | CEASED |
| CANCELLED, REJECTED, FAILED | PENDING (flagged; retail not auto-reverted) |

Retail promotion to `ACTIVE` only when upstream is `ACTIVE`, `COMPLETED`, `LIVE`, or `PROVISIONED` and retail is not already `ACTIVE`.

## Service lifecycle rules

- Itsi Business owns retail service records and customer-facing status labels.
- Itsi Mobile owns provider fulfilment and raw provider references.
- Do not auto-create retail + wholesale in one step.
- Do not over-automate lifecycle transitions in this phase.

## Customer portal exclusions

- No request-wholesale buttons or API calls from portal.
- Portal `/services` shows customer-safe status only.
- No wholesale order IDs or provider references in portal responses unless explicitly approved as customer-safe (not in Phase 10).

## Provider boundary

**Itsi Business must never:**

- Call Gamma, KCOM, MS3, or OTS Hero APIs
- Import provider SDKs
- Expose raw provider references to customers

**Itsi Business may:**

- Call Itsi Mobile wholesale bridge endpoints only
- Store `safeProviderReference` when returned as such by the bridge

## Frontend (Services workspace)

`WholesaleFulfilmentPanel` on `/records/[id]`:

- MOBILE/BROADBAND: request, status display, refresh — wired or disabled with reason
- ENERGY: disabled — "Energy wholesale ordering is not supported yet."
- Wholesale API disabled / circuit open: clear error/disabled state from API responses

## Validation commands

```bash
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/services type-check
pnpm --filter @itsi-business/portal type-check
node scripts/check-wiring.mjs
```

Root `pnpm type-check` may still fail on `@itsi-business/timeline` (pre-existing JSX/tsconfig issue).

## Deferred features (Phase 11+)

- Full lifecycle sync hardening and failure/retry policies
- Energy wholesale ordering
- Auto retail+wholesale creation in one step
- Portal-visible wholesale status (if ever customer-safe)
- Billing automation tied to wholesale fulfilment
