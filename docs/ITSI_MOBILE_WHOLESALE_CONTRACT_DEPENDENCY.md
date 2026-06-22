# Itsi Mobile Wholesale Contract Dependency

> Itsi Business depends on Itsi Mobile for all wholesale/provider fulfilment.
> This document defines the cross-repo contract boundary and verification status.

## Ownership

| System | Owns |
|--------|------|
| **Itsi Business** | Business customer, retail service records, staff workflows, customer portal (safe visibility only) |
| **Itsi Mobile** | Wholesale API, provider fulfilment (Gamma, KCOM, MS3, etc.), upstream diagnostics |

Itsi Business **never** calls provider APIs directly.

## Contract reference

Canonical contract spec: [`docs/WHOLESALE_API_CONTRACT.md`](./WHOLESALE_API_CONTRACT.md)

Gap analysis: [`docs/WHOLESALE_API_CONTRACT_GAP_REPORT.md`](./WHOLESALE_API_CONTRACT_GAP_REPORT.md)

## Itsi Business implementation map

| Concern | Location |
|---------|----------|
| Upstream HTTP client | `apps/api/src/services/wholesale/itsi-mobile-client.ts` |
| Path constants | `apps/api/src/services/wholesale/wholesale-paths.ts` |
| Payload validation | `apps/api/src/services/wholesale/wholesale-payload-schemas.ts` |
| Retail order request | `apps/api/src/services/wholesale/wholesale-order-service.ts` |
| Staff proxy routes | `apps/api/src/routes/wholesale.ts` |
| Service record routes | `apps/api/src/routes/services-wholesale.ts` |
| Shared types | `packages/types/src/wholesale.ts` |
| Contract tests | `apps/api/src/services/wholesale/wholesale-contract.test.ts` |

## Internal routing pattern

Staff and service flows call a single internal function shape:

```typescript
requestWholesaleOrderForService('MOBILE' | 'BROADBAND', serviceId, body)
```

The client routes underneath:

```typescript
itsiMobileClient.createOrder(config, serviceType, payload)
// → POST /api/v1/wholesale/orders/mobile
// → POST /api/v1/wholesale/orders/broadband
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ITSI_MOBILE_WHOLESALE_ENABLED` | Master switch (`false` = client throws `WholesaleDisabledError`) |
| `ITSI_MOBILE_API_BASE_URL` | Itsi Mobile API base URL |
| `ITSI_MOBILE_WHOLESALE_API_KEY` | Bearer token for partner auth |
| `ITSI_MOBILE_WHOLESALE_TIMEOUT_MS` | Request timeout |
| `ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS` | 5xx retry count |
| `ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED` | Circuit breaker toggle |

## Verification status

| Phase | Scope | Status |
|-------|-------|--------|
| **13A** | Itsi Business client + contract docs + payload tests | **Complete** (`864eefe`) — calls `/orders/mobile`, `/orders/broadband`, family status paths |
| **14W** | Itsi Mobile family routes + contract tests | **Pending** — run in `HFDavid89/itsimobileportal` |
| **13B** | E2E smoke test Itsi Business → Itsi Mobile | **Blocked** on 14W — see [`PHASE_13B_WHOLESALE_E2E_VERIFICATION.md`](./PHASE_13B_WHOLESALE_E2E_VERIFICATION.md) |

> **Gate:** Do not extend portal/SIM controls until 13B passes.

## Itsi Mobile deliverables (required for 13B)

1. Implement family-specific routes per `WHOLESALE_API_CONTRACT.md`
2. Add partner auth for `X-Client: itsi-business`
3. Return normalized order/status responses (no raw provider payloads)
4. Publish `docs/WHOLESALE_API_CONTRACT.md` in Itsi Mobile repo (mirror or source of truth)
5. Provide staging credentials for smoke tests

## Backwards compatibility

Itsi Business staff routes retain deprecated generic endpoints that:

- Set `X-Deprecated: true` response header
- Route internally to family-specific upstream paths
- Require `serviceType` query param on deprecated GET order/status routes

Itsi Mobile should **not** treat generic `/wholesale/orders` as the long-term contract.

## Security boundaries

- No raw provider references in responses unless approved as `safeProviderReference`
- No margin/wholesale cost in customer portal
- No portal access to `/api/v1/wholesale/*` routes
- Escalations must include `serviceType` for queue routing
