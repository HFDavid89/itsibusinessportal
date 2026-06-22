# Phase 13B — Wholesale Contract Verification and E2E Smoke Test

> **Prerequisite:** Itsi Mobile Phase 14W complete — family-specific wholesale routes live in `HFDavid89/itsimobileportal`.
> **Gate:** Do not extend Itsi Business portal/SIM controls until this phase passes.

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

1. **Itsi Mobile 14W** — implement/verify family routes + contract tests + `docs/WHOLESALE_API_CONTRACT.md`
2. **Verify** — Itsi Mobile contract tests green; contract doc matches `docs/WHOLESALE_API_CONTRACT.md` in Itsi Business
3. **Phase 13B (this phase)** — e2e smoke test from Itsi Business against live/staging Itsi Mobile
4. **Only then** — resume portal/staff feature work (e.g. request workflow hardening)

## Phase 13B smoke test matrix

### Environment

```env
ITSI_MOBILE_WHOLESALE_ENABLED=true
ITSI_MOBILE_API_BASE_URL=<itsi-mobile-staging-url>
ITSI_MOBILE_WHOLESALE_API_KEY=<partner-key>
```

### 1. Connectivity

- [ ] Admin → Wholesale Connection → ping OK
- [ ] `GET /api/v1/wholesale/status` returns `enabled: true, ok: true`

### 2. Mobile order flow

- [ ] Staff: open DRAFT/REQUESTED mobile service record
- [ ] Request wholesale order → `POST /api/v1/services/mobile/:id/request-wholesale-order`
- [ ] Upstream receives `POST /api/v1/wholesale/orders/mobile` with `sourceOrderId`, `sourceCustomerReference`, `sourceServiceReference` (verify in Itsi Mobile logs)
- [ ] Retail record gets `ItsiMobileWholesaleServiceLink` with order ID
- [ ] Status refresh → upstream `GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status` (fallback: `/:id/status`)
- [ ] Timeline events: `WHOLESALE_ORDER_REQUESTED`, `WHOLESALE_STATUS_REFRESHED`

### 3. Broadband order flow

- [ ] Service has postcode populated
- [ ] Request wholesale order → `POST /api/v1/services/broadband/:id/request-wholesale-order`
- [ ] Upstream receives `POST /api/v1/wholesale/orders/broadband`
- [ ] Status refresh → `GET /api/v1/wholesale/orders/broadband/:id/status`
- [ ] Postcode validation rejects broadband without postcode (400 before upstream call)

### 4. Escalation

- [ ] `POST /api/v1/wholesale/escalations` with `serviceType: MOBILE`, `businessServiceReference`, optional `sourceOrderId`
- [ ] Same with `serviceType: BROADBAND`

### 5. Negative cases

- [ ] `ITSI_MOBILE_WHOLESALE_ENABLED=false` → 503 `WHOLESALE_DISABLED`
- [ ] Invalid API key → 401/403, no provider payload in response
- [ ] Duplicate wholesale order on same service → 400 validation

### 6. Contract tests (Itsi Business)

```bash
pnpm --filter @itsi-business/api test:wholesale-contract
pnpm --filter @itsi-business/api type-check
```

## Pass criteria

All smoke matrix items pass against Itsi Mobile staging. No raw Gamma/KCOM/MS3/OTS Hero payloads visible in Itsi Business staff UI or API responses.

## Deferred until pass

- Portal SIM live network controls
- Additional portal self-service flows tied to wholesale fulfilment
- Staff request queue / SLA hardening that assumes proven wholesale status sync

## References

- [`WHOLESALE_API_CONTRACT.md`](./WHOLESALE_API_CONTRACT.md)
- [`WHOLESALE_API_CONTRACT_GAP_REPORT.md`](./WHOLESALE_API_CONTRACT_GAP_REPORT.md)
- [`ITSI_MOBILE_WHOLESALE_CONTRACT_DEPENDENCY.md`](./ITSI_MOBILE_WHOLESALE_CONTRACT_DEPENDENCY.md)
