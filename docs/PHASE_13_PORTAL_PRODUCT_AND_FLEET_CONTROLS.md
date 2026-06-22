# Phase 13 — Portal Product Management and SIM/Fleet Controls

> Completed after Phase 12 (`8c4e598`). Energy remains CRM-managed referral/renewal tracking only; Fidelity portal handles contracts manually.

## Goal

Improve the business customer portal so customers can manage products, services, SIM/fleet metadata, and support requests without exposing staff-only, supplier-only, wholesale-only, or provider-only data.

## Part A — Product catalogue

### Schema

- `BusinessServiceCatalogueItem.customerVisible` — `Boolean`, default `false`
- Staff catalogue API accepts `customerVisible` on create/patch

### Portal API

- `GET /api/v1/portal/products` — only `ACTIVE` + `customerVisible: true`
- Response excludes: `sku`, `wholesaleCostEstimatePence`, `marginPolicy`, `taxRate`, supplier metadata
- Adds customer-safe `availability: 'AVAILABLE'`

### Product enquiry

- `POST /api/v1/portal/products/:id/enquiry`
- Creates `BusinessTicket` with `customerVisible` thread, `isInternal: false`
- Category mapped: `MOBILE` / `BROADBAND` / `ENERGY` / `GENERAL`
- Timeline: `CUSTOMER_PRODUCT_ENQUIRY_CREATED`
- Does **not** create wholesale orders or Fidelity submissions

### UI

- `/products` — product cards with “Request more info” modal

## Part B — Service detail pages

- `GET /api/v1/portal/services/:id` — account-scoped lookup across mobile, broadband, energy
- `/services/[id]` — display name, reference, status label, type, site/cost centre, contract dates, related invoices/tickets
- Energy detail: fuel type, supplier, renewal window, next review, Fidelity/supplier billing copy
- Hidden: provider refs, wholesale diagnostics, internal notes

## Part C — Fleet / SIM controls

### Portal API

- `GET /api/v1/portal/fleet/:id` — SIM detail with related invoices/tickets
- `PATCH /api/v1/portal/fleet/:id` — only `simLabel`, `costCentre`; timeline `CUSTOMER_SIM_METADATA_UPDATED`

### UI — `/fleet`

- Status counts (active, requested, suspended, ceased)
- Filters by status; search by number, label, cost centre
- Links to `/fleet/[id]`

### Deferred live network controls

Bar/unbar SIM, SIM swap, roaming, spend cap, PAC/STAC, replacement SIM, tariff change — shown as **disabled** with “Coming soon — contact support to request this change”.

## Part D — Ticket-from-service flows

| Flow | Route | Timeline event |
|---|---|---|
| Service support | `POST /api/v1/portal/services/:id/tickets` | `CUSTOMER_SERVICE_TICKET_CREATED` or `CUSTOMER_ENERGY_REVIEW_REQUESTED` |
| SIM support | `POST /api/v1/portal/fleet/:id/support` | `CUSTOMER_SIM_SUPPORT_REQUEST_CREATED` |
| Product enquiry | `POST /api/v1/portal/products/:id/enquiry` | `CUSTOMER_PRODUCT_ENQUIRY_CREATED` |

All create normal customer-visible `BusinessTicket` records — no internal notes, no supplier escalation, no provider calls.

## Part E — Billing / service cross-links

- Invoice line select includes `businessServiceReference`
- Portal resolves to `serviceLink: { displayName, serviceId, serviceType }` when reference matches an account service
- Invoice detail and service detail show reciprocal links where data exists
- Placeholder copy when linkage not yet modelled on lines

## Part F — Portal user roles

- `PortalUser.portalRole`: `ACCOUNT_ADMIN` | `BILLING_CONTACT` | `TECHNICAL_CONTACT` | `READ_ONLY` (default `READ_ONLY`)
- Account admins can assign roles on invite; non-admins see disabled role selector
- Cannot deactivate self; cannot remove last active `ACCOUNT_ADMIN`

## Part G — Wiring discipline

- Extended `scripts/check-wiring.mjs` for portal wholesale/admin API URL patterns
- All portal buttons wired: real navigation, modals, support requests, or disabled with reason

## Security boundaries (unchanged)

| Forbidden in portal |
|---|
| Provider API calls |
| Itsi Mobile wholesale API calls |
| Fidelity Energy API calls |
| Raw provider references |
| Wholesale order IDs (unless explicitly approved customer-safe) |
| Margin, wholesale cost, supplier diagnostics, internal notes |
| Staff fulfilment controls |
| Energy order submission |

## Validation

```bash
pnpm --filter @itsi-business/api db:generate
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/portal type-check
node scripts/check-wiring.mjs
```

## Deferred to Phase 14

- Customer request workflow hardening on staff side (queues, SLA, ownership)
- Live SIM/network controls when safe API boundary exists
- Richer invoice line ↔ service modelling in billing engine
