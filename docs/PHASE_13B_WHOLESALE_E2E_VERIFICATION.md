# Phase 13B — Wholesale Contract Verification (13B-1 + 13B-2)

> **13B-1** — Simulated contract verification (mock Itsi Mobile) — **can run now**
> **13B-2** — Staging/live end-to-end smoke test — **deferred until Itsi Mobile staging is ready**
>
> See [`PHASE_13B1_SIMULATED_WHOLESALE_CONTRACT.md`](./PHASE_13B1_SIMULATED_WHOLESALE_CONTRACT.md) for the 13B-1 gate in full.

## Gate split

| Phase | Meaning | Status |
|-------|---------|--------|
| **13B-1** | Itsi Business simulated contract test against mocked Itsi Mobile 14W API | **Active gate** — run in CI/local with `DATABASE_URL` |
| **13B-2** | Real staging smoke test against live Itsi Mobile | **Later** — blocked on Itsi Mobile staging |

13B-1 proves Itsi Business contract behaviour. It does **not** prove Itsi Mobile implementation, credentials, network, reseller auth, or provider lifecycle.

## Itsi Business client status (Phase 14W — done)

Active upstream client calls family routes with 14W attribution:

| Operation | Mobile | Broadband |
|-----------|--------|-----------|
| Create order | `POST /api/v1/wholesale/orders/mobile` | `POST /api/v1/wholesale/orders/broadband` |
| Order status (by id) | `GET /api/v1/wholesale/orders/mobile/:id/status` | `GET /api/v1/wholesale/orders/broadband/:id/status` |
| Order status (by source) | `GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status` | `GET /api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status` |

Used by:

- `requestWholesaleOrderForService()` → `buildOrderPayload()` maps retail service id → `sourceOrderId`, account number → `sourceCustomerReference`
- `refreshWholesaleStatusForService()` → `getOrderStatusBySource()` first, falls back to `getOrderStatus()` for legacy orders

Deprecated generic `/wholesale/orders` exists only on **Itsi Business staff proxy routes** (with `X-Deprecated`) — the upstream client does not call generic paths.

## Recommended sequence

1. **Itsi Mobile 14W** — implement/verify family routes + contract tests (separate repo)
2. **Phase 13B-1** — simulated contract verification in Itsi Business (mock server)
3. **Phase 14** — staff request workflow and SLA hardening (local lifecycle only) — **done**
4. **Phase 13B-2** — e2e smoke test from Itsi Business against live/staging Itsi Mobile
5. **Only then** — live customer SIM/network self-service

> **Note:** 13B-1 simulated verification allows the Phase 14 staff workflow foundation to proceed without live Itsi Mobile. 13B-2 real staging E2E remains required before live network controls.

---

## Phase 13B-1 — Simulated contract verification

### Commands

```bash
pnpm --filter @itsi-business/api test
pnpm --filter @itsi-business/api type-check
node scripts/check-wiring.mjs
```

Requires `DATABASE_URL` for simulated integration tests. Static contract tests run without a database.

### 13B-1 checklist (automated)

- [x] Mobile order → `POST /orders/mobile` with 14W attribution
- [x] Broadband order → `POST /orders/broadband` with postcode/address/install contact
- [x] Forbidden reseller fields stripped
- [x] Broadband without postcode rejected locally (no upstream call)
- [x] `ItsiMobileWholesaleServiceLink` created
- [x] Timeline `WHOLESALE_ORDER_REQUESTED`
- [x] By-source status refresh (mobile + broadband)
- [x] Order-id fallback when by-source 404
- [x] Rejected upstream → staff warning, no retail auto-cancel
- [x] Provider payload sanitised before storage
- [x] `WHOLESALE_DISABLED` when bridge off
- [x] Masked 401/500 errors
- [x] Duplicate wholesale order blocked

### 13B-1 pass criteria

All simulated tests green. No provider payloads in stored status responses or masked error bodies.

### Unlocks after 13B-1

Staff request workflow, SLA hardening, manual queues, retry/recheck, staff warnings — **local lifecycle only**.

### Still blocked until 13B-2

Portal SIM live network controls, PAC/STAC, roaming/spend-cap toggles, anything assuming live provider execution.

---

## Phase 13B-2 — Staging/live end-to-end verification (future)

> **Prerequisite:** Itsi Mobile staging with Phase 14W routes + partner credentials.
> **Gate:** Do not enable customer-facing live SIM/network controls until 13B-2 passes.

### Environment

```env
ITSI_MOBILE_WHOLESALE_ENABLED=true
ITSI_MOBILE_API_BASE_URL=<itsi-mobile-staging-url>
ITSI_MOBILE_WHOLESALE_API_KEY=<partner-key>
```

### 13B-2 smoke test matrix

#### 1. Connectivity

- [ ] Admin → Wholesale Connection → ping OK
- [ ] `GET /api/v1/wholesale/status` returns `enabled: true, ok: true`

#### 2. Mobile order flow

- [ ] Staff: open DRAFT/REQUESTED mobile service record
- [ ] Request wholesale order → `POST /api/v1/services/mobile/:id/request-wholesale-order`
- [ ] Upstream receives `POST /api/v1/wholesale/orders/mobile` with 14W attribution (verify in Itsi Mobile logs)
- [ ] Retail record gets `ItsiMobileWholesaleServiceLink` with order ID
- [ ] Status refresh → `GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status` (fallback: `/:id/status`)
- [ ] Timeline events: `WHOLESALE_ORDER_REQUESTED`, `WHOLESALE_STATUS_REFRESHED`

#### 3. Broadband order flow

- [ ] Service has postcode populated
- [ ] Request wholesale order → `POST /api/v1/services/broadband/:id/request-wholesale-order`
- [ ] Upstream receives `POST /api/v1/wholesale/orders/broadband`
- [ ] Status refresh → `GET /api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status`
- [ ] Postcode validation rejects broadband without postcode (400 before upstream call)

#### 4. Escalation

- [ ] `POST /api/v1/wholesale/escalations` with `serviceType: MOBILE`, `businessServiceReference`, optional `sourceOrderId`
- [ ] Same with `serviceType: BROADBAND`

#### 5. Negative cases

- [ ] `ITSI_MOBILE_WHOLESALE_ENABLED=false` → 503 `WHOLESALE_DISABLED`
- [ ] Invalid API key → 401/403, no provider payload in response
- [ ] Duplicate wholesale order on same service → 400 validation

### 13B-2 pass criteria

All smoke matrix items pass against Itsi Mobile staging. No raw Gamma/KCOM/MS3/OTS Hero payloads visible in Itsi Business staff UI or API responses.

## References

- [`PHASE_13B1_SIMULATED_WHOLESALE_CONTRACT.md`](./PHASE_13B1_SIMULATED_WHOLESALE_CONTRACT.md)
- [`WHOLESALE_API_CONTRACT.md`](./WHOLESALE_API_CONTRACT.md)
- [`WHOLESALE_API_CONTRACT_GAP_REPORT.md`](./WHOLESALE_API_CONTRACT_GAP_REPORT.md)
- [`ITSI_MOBILE_WHOLESALE_CONTRACT_DEPENDENCY.md`](./ITSI_MOBILE_WHOLESALE_CONTRACT_DEPENDENCY.md)
