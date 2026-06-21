# Phase 8 — Itsi Mobile Wholesale API Bridge Foundation

## Overview

Phase 8 introduces the **Itsi Mobile wholesale API bridge** — the plumbing that allows
Itsi Business staff to request availability checks, quotes, and service orders from
Itsi Mobile's wholesale layer.

This is **request/response plumbing only**. No provider integrations live here.

---

## Boundary rule (must never be violated)

| Actor | May call |
|---|---|
| **Itsi Business** | Itsi Mobile wholesale APIs (`/api/v1/wholesale/*`) |
| **Itsi Mobile** | Gamma, KCOM, MS3, OTS Hero, and all provider APIs |
| **Itsi Business** | **NEVER** calls Gamma, KCOM, MS3, OTS Hero, or provider APIs directly |

---

## New files

### `apps/api/src/services/wholesale/itsi-mobile-client.ts`

Typed HTTP client for the Itsi Mobile wholesale API.

**Features**:
- API key auth (`Authorization: Bearer <key>`)
- Configurable timeout (`ITSI_MOBILE_WHOLESALE_TIMEOUT_MS`)
- Auto-retry on 5xx (`ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS`)
- Circuit breaker (`ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED`)
  - Opens after 5 consecutive failures
  - Attempts half-open after 30 s
- Hard disable guard (`ITSI_MOBILE_WHOLESALE_ENABLED=false` → `WholesaleDisabledError`)

**Exported client methods**:

| Method | Itsi Mobile endpoint | Description |
|---|---|---|
| `ping(config)` | `GET /api/v1/health` | Connectivity test with latency |
| `getAvailability(config, postcode, uprn?)` | `GET /api/v1/wholesale/availability` | Service availability check |
| `getQuote(config, params)` | `POST /api/v1/wholesale/quotes` | Wholesale price quote |
| `createOrder(config, payload)` | `POST /api/v1/wholesale/orders` | Submit service order |
| `getOrder(config, orderId)` | `GET /api/v1/wholesale/orders/:id` | Get order by ID |
| `getOrderStatus(config, orderId)` | `GET /api/v1/wholesale/orders/:id/status` | Poll live order status |
| `createEscalation(config, payload)` | `POST /api/v1/wholesale/escalations` | Raise escalation |
| `getEscalation(config, escalationId)` | `GET /api/v1/wholesale/escalations/:id` | Get escalation by ID |

**Error types**:
- `WholesaleDisabledError` — `ITSI_MOBILE_WHOLESALE_ENABLED=false`
- `WholesaleCircuitOpenError` — circuit breaker tripped
- `WholesaleTimeoutError` — request exceeded `ITSI_MOBILE_WHOLESALE_TIMEOUT_MS`
- `WholesaleApiError` — non-2xx from Itsi Mobile (includes upstream body)

---

## Updated: `apps/api/src/routes/wholesale.ts`

All 501 stubs replaced with real delegating handlers.

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/wholesale/status` | `wholesale.read` | Connectivity test — returns `{enabled, ok, latencyMs, version}` |
| GET | `/api/v1/wholesale/availability` | `wholesale.read` | Availability check via Itsi Mobile |
| POST | `/api/v1/wholesale/quotes` | `wholesale.read` | Wholesale quote request |
| POST | `/api/v1/wholesale/orders` | `wholesale.write` | Submit service order to Itsi Mobile |
| GET | `/api/v1/wholesale/orders/:id` | `wholesale.read` | Get order |
| GET | `/api/v1/wholesale/orders/:id/status` | `wholesale.read` | Poll order status |
| POST | `/api/v1/wholesale/escalations` | `wholesale.write` | Create escalation |
| GET | `/api/v1/wholesale/escalations/:id` | `wholesale.read` | Get escalation |

Error responses:
- `503 WHOLESALE_DISABLED` — feature flag off
- `503 CIRCUIT_OPEN` — circuit breaker tripped
- `504 WHOLESALE_TIMEOUT` — timeout
- `502 WHOLESALE_API_ERROR` — Itsi Mobile returned non-2xx

---

## Updated: Prisma `ItsiMobileWholesaleServiceLink`

Two new fields added (migration `20260621184211_new_2`):

| Field | Type | Purpose |
|---|---|---|
| `lastStatusCheckedAt` | `DateTime?` | When the status was last polled from Itsi Mobile |
| `lastStatusResponse` | `Json?` | Cached status response body — avoids hammering Itsi Mobile |

---

## New: `apps/admin/src/app/wholesale/page.tsx`

Admin UI page at `/wholesale` with a **Test Connection** button that:
1. Calls `GET /api/v1/wholesale/status`
2. Shows enabled/disabled badge
3. If enabled, shows reachability, latency, and API version
4. Shows actionable error message on failure with env var hints

---

## New env vars

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:17001` | API base URL for frontend apps |
| `ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS` | `3` | Retry count on 5xx |
| `ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED` | `true` | Enable/disable circuit breaker |

---

## RBAC permissions added

| Permission | Scope |
|---|---|
| `wholesale.read` | Availability checks, quotes, order/escalation reads, status poll |
| `wholesale.write` | Submit orders, create escalations |

---

## Hard exclusions (never violate)

- No Gamma, KCOM, MS3, OTS Hero, or provider API calls from Itsi Business code
- No automatic order submission on record create — orders are staff-initiated only
- No webhook ingestion from Itsi Mobile (Phase 9+)
- No billing integration with wholesale costs (Phase 9+)
