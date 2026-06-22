# Phase 11 — Service Lifecycle, Status Sync and Energy Integration Readiness

> Builds on Phase 10 (`3270802`). Hardens mobile/broadband lifecycle after wholesale order requests and prepares a separate Fidelity Energy integration boundary.

## Goals

1. Harden mobile/broadband lifecycle after Phase 10
2. Standardise service status event history
3. Make portal-visible status safe and consistent
4. Add Energy Supplier Integration boundary for Fidelity Energy
5. Keep Fidelity disabled until API docs/credentials are confirmed

## Architecture rules

| Domain | Integration |
|--------|-------------|
| Mobile / Broadband | Itsi Mobile wholesale bridge |
| Energy | Fidelity Energy integration bridge (separate) |

- Fidelity Energy is **not** inside the Itsi Mobile wholesale client
- No live Fidelity API calls in Phase 11
- No supplier/internal references in customer portal unless explicitly safe

## Part A — Service lifecycle module

**Location:** `packages/core/src/service-lifecycle.ts`

Exports:

- Retail status constants (mobile/broadband, energy)
- Wholesale link status constants
- `PORTAL_RETAIL_STATUS_LABELS` — customer-safe labels
- `STAFF_RETAIL_STATUS_LABELS`, `STAFF_WHOLESALE_LINK_STATUS_LABELS`
- Transition guards: `canAutomateRetailTransition`, `isStaffRetailTransitionAllowed`
- Upstream helpers: `isUpstreamFailureStatus`, `getStaffWarningForUpstream`, `getSuggestedActionForUpstream`
- `ServiceLifecycleEventMeta` — structured timeline metadata

**Lifecycle event writer:** `apps/api/src/services/service-lifecycle-events.ts`

Timeline metadata includes:

- `previousStatus`, `newStatus`
- `source`: `STAFF` | `ITSI_MOBILE` | `SYSTEM` | `FIDELITY_ENERGY`
- `safeExternalReference`, `reason`, `upstreamStatus`, `staffWarning`

### Portal-visible status labels

| Internal | Customer label |
|----------|----------------|
| DRAFT | Preparing |
| REQUESTED | Order in progress |
| ACTIVE | Active |
| SUSPENDED | Temporarily suspended |
| CEASED | Ceased |
| CANCELLED | Cancelled |

Portal API adds `statusLabel` on `/api/v1/portal/services` and `/api/v1/portal/fleet`.
Portal pages display `statusLabel` — never raw wholesale diagnostics.

## Part B — Wholesale status refresh hardening

**Files:**

- `apps/api/src/services/wholesale/status-mapper.ts`
- `apps/api/src/services/wholesale/wholesale-order-service.ts`
- `apps/services/src/components/WholesaleFulfilmentPanel.tsx`

Improvements:

- Staff warnings for upstream `FAILED` / `REJECTED` / `CANCELLED`
- `wholesaleInsights` on status/refresh responses: `staffWarning`, `suggestedAction`, `upstreamFailure`
- Last status refresh timestamp in UI
- Safe error messages — no raw upstream or provider reference leakage
- Conservative retail promotion — no auto-cease/cancel from upstream

## Part C — Fidelity Energy readiness

**Client:** `apps/api/src/services/energy/fidelity-energy-client.ts`  
**Config:** `apps/api/src/services/energy/fidelity-energy-config.ts`  
**Routes:** `GET /api/v1/energy-integrations/status`, `GET /api/v1/energy-integrations/ping` (staff-only)

Environment:

```env
FIDELITY_ENERGY_ENABLED=false
FIDELITY_ENERGY_API_BASE_URL=
FIDELITY_ENERGY_API_KEY=
FIDELITY_ENERGY_TIMEOUT_MS=10000
FIDELITY_ENERGY_RETRY_ATTEMPTS=3
```

Placeholder methods (throw `FidelityEnergyNotReadyError` until Phase 12A):

- `ping`, `getQuote`, `submitOrder`, `getOrder`, `getOrderStatus`, `raiseEscalation`

**Admin UI:** `/integrations/energy` — shows Disabled / Not configured / Awaiting API documentation  
**Services UI:** `EnergyFulfilmentPanel` — Fidelity provider, disabled quote/order buttons  
**Portal:** Energy services visible with customer-safe labels; coming-soon message for quote/order

## Part D — Discovery documentation

- `docs/FIDELITY_ENERGY_INTEGRATION_DISCOVERY.md` — checklist for Fidelity engagement
- `docs/ITSI_MOBILE_REUSE_AUDIT.md` — Phase 11 section; Energy/Fidelity separate from Itsi Mobile

## Validation

```bash
pnpm install
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/services type-check
pnpm --filter @itsi-business/portal type-check
node scripts/check-wiring.mjs
```

Root `pnpm type-check` may still fail on `@itsi-business/timeline` (pre-existing).

## Deferred (Phase 12+)

| Feature | Phase |
|---------|-------|
| Live Fidelity API integration | 12A (when docs/credentials available) |
| Portal SIM/fleet controls | 12B (if Fidelity not ready) |
| Full automated lifecycle sync | 11+ hardening continuation |
| Billing automation tied to fulfilment | Later |

## Next steps

- **Phase 12A** — Fidelity Energy live integration (if Fidelity provides docs/credentials)
- **Phase 12B** — Customer portal product management and SIM/fleet controls (if Fidelity not ready)
