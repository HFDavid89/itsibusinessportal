# Phase 13B-1 — Simulated Wholesale Contract Verification

> **Gate type:** Contract simulation — no live Itsi Mobile required.
> **Successor:** Phase 13B-2 — real staging/live end-to-end verification when Itsi Mobile is ready.

## Why this exists

Itsi Mobile Phase 14W is still in active development. Itsi Business cannot yet run a trustworthy live or staging smoke test against a finished wholesale API.

Phase 13B-1 proves that **Itsi Business** sends and handles the expected 14W product-family contract using a **mocked Itsi Mobile HTTP server**. This is sufficient to safely begin staff request workflow and SLA hardening that depends on **local** lifecycle state — not live provider execution.

## Why live testing is deferred (13B-2)

13B-2 requires:

- Itsi Mobile staging with 14W routes deployed
- Partner API credentials bound to a wholesale reseller account
- Real network/provider lifecycle behaviour

Until then, do **not** treat wholesale fulfilment as production-proven.

## What 13B-1 proves

| Area | Proof |
|------|-------|
| Mobile orders | `POST /api/v1/wholesale/orders/mobile` with 14W attribution payload |
| Broadband orders | `POST /api/v1/wholesale/orders/broadband` with postcode, address, install contact |
| Forbidden fields | Reseller/retail owner fields stripped before upstream POST |
| By-source refresh | `GET .../by-source/:sourceOrderId/status` preferred using local service id |
| Legacy fallback | Order-id status used when by-source returns 404 |
| Local persistence | `ItsiMobileWholesaleServiceLink` created/updated |
| Timeline | `WHOLESALE_ORDER_REQUESTED`, `WHOLESALE_STATUS_REFRESHED` events written |
| Safe failures | Disabled bridge, masked 401/500, duplicate order blocked |
| Sanitisation | Provider/internal upstream fields not stored in `lastStatusResponse` |
| Staff warnings | Rejected/failed upstream statuses warn staff without auto-ceasing retail |

## What 13B-1 does **not** prove

- Itsi Mobile implementation correctness
- Reseller API key binding on Itsi Mobile
- Real Gamma/KCOM/MS3/OTS Hero provider lifecycle
- Network/SIM execution reliability
- Customer-facing live SIM/network controls

**Live customer SIM/network controls remain blocked until 13B-2 passes.**

## Mock endpoints

The test adapter (`mock-itsi-mobile-server.ts`) simulates:

| Family | Endpoints |
|--------|-----------|
| Mobile | `POST /orders/mobile`, `GET /orders/mobile/:id/status`, `GET /orders/mobile/by-source/:sourceOrderId/status` |
| Broadband | `POST /orders/broadband`, `GET /orders/broadband/:id/status`, `GET /orders/broadband/by-source/:sourceOrderId/status` |
| Shared | `POST /escalations`, `GET /health` |
| Optional | Products, quotes, broadband availability |

The mock captures: path, method, headers, body, `sourceOrderId`, inferred `serviceType`, forbidden-field presence, `Authorization`, `X-Client`.

## Test implementation

| File | Purpose |
|------|---------|
| `apps/api/src/services/wholesale/mock-itsi-mobile-server.ts` | Mock HTTP server + env helpers |
| `apps/api/src/services/wholesale/wholesale-test-fixtures.ts` | Prisma fixtures + cleanup |
| `apps/api/src/services/wholesale/wholesale-simulated.test.ts` | 13B-1 integration tests |
| `apps/api/src/services/wholesale/wholesale-contract.test.ts` | Static path/payload contract tests (13A/14W) |

Tests call **`requestWholesaleOrderForService()`** and **`refreshWholesaleStatusForService()`** — the same service layer used by staff routes — not only the low-level client.

## Pass criteria

```bash
pnpm --filter @itsi-business/api test
pnpm --filter @itsi-business/api type-check
node scripts/check-wiring.mjs
```

All 13B-1 simulated tests pass against a reachable `DATABASE_URL`. Static contract tests pass without a database.

## Unlocks after 13B-1

| Allowed | Still blocked |
|---------|---------------|
| Staff request workflow / SLA hardening | Live SIM barring |
| Manual wholesale follow-up queues | SIM swaps |
| Retry/recheck controls | Roaming toggles |
| Staff warnings | Spend cap changes |
| Ownership and due-date queues | PAC/STAC actions |
| | Customer-facing provider execution |

## Sequence

1. **14W** — Itsi Mobile product-family API (separate repo)
2. **13B-1** — Simulated contract verification (this phase) ✅ target
3. **Phase 14** — Staff request workflow and SLA hardening (local lifecycle only)
4. **13B-2** — Staging/live E2E smoke test when Itsi Mobile is ready
5. **Later** — Live network self-service after proven lifecycle reliability

## References

- [`PHASE_13B_WHOLESALE_E2E_VERIFICATION.md`](./PHASE_13B_WHOLESALE_E2E_VERIFICATION.md) — 13B-1 + 13B-2 overview
- [`WHOLESALE_API_CONTRACT.md`](./WHOLESALE_API_CONTRACT.md) — 14W forward contract
- [`ITSI_MOBILE_WHOLESALE_CONTRACT_DEPENDENCY.md`](./ITSI_MOBILE_WHOLESALE_CONTRACT_DEPENDENCY.md)
