# Phase 12 — Energy Account Tracking and Renewal Management

> Energy is CRM-managed referral and renewal tracking — not supplier fulfilment or billing.

## Business decision

- **Fidelity portal** is the source of truth for energy sales, contracts, and supplier billing
- **Itsi Business** tracks customer relationship, referral status, contract dates, renewal windows, check-ins, and notes
- **No live Fidelity API integration** is currently planned

## Architecture

| Domain | Approach |
|--------|----------|
| Mobile / Broadband | Itsi Mobile wholesale bridge |
| Energy | Manual Fidelity portal + CRM tracking in Itsi Business |

## Hard exclusions

- No Fidelity API calls
- No energy order submission from Itsi Business
- No supplier contract creation from Itsi Business
- No energy billing or payment collection in Itsi Business
- No supplier-only information in customer portal
- No misleading “connected to Fidelity” messaging

## Data model (`BusinessEnergyService`)

| Field | Purpose |
|-------|---------|
| `status` | PROSPECT, REFERRED_TO_FIDELITY, QUOTE_IN_PROGRESS, CONTRACTED, RENEWAL_DUE, LOST, CEASED |
| `supplierName` | e.g. Fidelity Energy |
| `fidelityReference` | Optional staff reference (not customer-facing by default) |
| `mpan` / `mprn` / `meterPointReference` | Meter identifiers |
| `contractStartDate` / `contractEndDate` | Contract lifecycle |
| `renewalWindowStartDate` | Defaults to 180 days before `contractEndDate` |
| `nextCheckInDate` / `lastCheckInDate` / `checkInCadenceDays` | Check-in cadence (default 90 days) |
| `estimatedAnnualSpendPence` | Optional planning field — not billing |
| `notes` | Staff notes |
| `customerVisible` | Portal visibility gate |

## API routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/services/energy/dashboard` | Dashboard KPIs |
| GET | `/api/v1/services/energy` | List with filters |
| GET | `/api/v1/services/energy/:id` | Detail |
| POST | `/api/v1/services/energy` | Create record |
| PATCH | `/api/v1/services/energy/:id` | Update record |
| POST | `/api/v1/services/energy/:id/check-ins` | Complete check-in |
| POST | `/api/v1/services/energy/:id/mark-referred` | Mark referred to Fidelity |
| POST | `/api/v1/services/energy/:id/mark-contracted` | Record contracted status |
| POST | `/api/v1/services/energy/:id/mark-lost` | Mark lost |

Permissions: `services.records.read`, `services.records.write`

## Timeline events

- `ENERGY_SERVICE_CREATED`
- `ENERGY_REFERRED_TO_FIDELITY`
- `ENERGY_QUOTE_IN_PROGRESS`
- `ENERGY_CONTRACTED`
- `ENERGY_RENEWAL_WINDOW_STARTED`
- `ENERGY_CHECK_IN_COMPLETED`
- `ENERGY_NEXT_CHECK_IN_SCHEDULED`
- `ENERGY_MARKED_LOST`
- `ENERGY_SERVICE_UPDATED`

## Staff UI

- **Services → Energy Tracking** (`/energy`) — dashboard, filters, quick actions
- **Service record detail** — Energy tracking panel (no order submission)
- **CRM Account 360 → Energy tab** — per-account energy records and actions

## Customer portal

Customer-safe fields only:

- Fuel type, site, supplier name (if visible)
- Contract end date, renewal/check-in wording
- Customer-safe status labels

Portal copy: *“Energy contracts and billing are handled directly through the supplier/Fidelity process. Itsi Business helps track renewals and support your account relationship.”*

Customer actions create tickets/CRM notes — not energy orders.

## Renewal workflow

1. Create energy record (PROSPECT)
2. Staff refers customer via Fidelity portal → Mark Referred
3. Quote/contract completed in Fidelity portal → Mark Contracted with dates
4. Renewal window opens (180 days before end) → RENEWAL_DUE
5. Staff completes check-ins on cadence → schedules next check-in

## Check-in workflow

- `checkInCadenceDays` default 90
- **Complete Check-in** sets `lastCheckInDate`, calculates `nextCheckInDate`
- Dashboard filter **Check-ins due** where `nextCheckInDate <= today`
- No scheduled jobs in Phase 12 — dashboard filters only

## Fidelity readiness files

Phase 11 Fidelity client remains as a **deferred** boundary. UI states:

- Live API integration not currently used
- Sales/contracts completed in Fidelity portal
- Itsi Business tracks relationship and renewals only

## Deferred

- Live Fidelity API integration (indefinitely deferred unless business process changes)
- Automated reminder jobs / email notifications
- Energy billing in Itsi Business

## Validation

```bash
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/services type-check
pnpm --filter @itsi-business/crm type-check
pnpm --filter @itsi-business/portal type-check
node scripts/check-wiring.mjs
```

Migration: `20260622120000_phase_12_energy_tracking`

## Next phase

**Phase 13 — Portal Product Management and SIM/Fleet Controls**
