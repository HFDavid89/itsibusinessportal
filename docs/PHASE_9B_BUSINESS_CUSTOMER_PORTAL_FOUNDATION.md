# Phase 9B — Business Customer Portal Foundation

> Builds the first real business customer self-service portal on Phase 9A wiring.

## Goal

Portal users can manage their business account safely, scoped only to their `accountId`.

## Portal routes (UI)

| Route | Feature |
|-------|---------|
| `/login` | Portal authentication |
| `/` | Account dashboard (live KPIs, recent invoices/tickets) |
| `/account` | Company profile, sites, contacts |
| `/products` | Customer-visible catalogue (ACTIVE items, retail pricing only) |
| `/services` | Mobile, broadband, energy service lists |
| `/billing` | Invoice list |
| `/billing/[id]` | Invoice detail with line items |
| `/tickets` | Ticket list + create form |
| `/tickets/[id]` | Ticket detail + customer replies |
| `/fleet` | Mobile fleet / SIM list |
| `/users` | Portal user list + invite |
| `/settings` | Edit own contact details |

## Portal API routes

All require `requireRealm('portal')` and scope by `accessContext.accountId`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/portal/me` | Current user + account summary |
| GET | `/api/v1/portal/account` | Account, sites, contacts |
| PATCH | `/api/v1/portal/account/contact-details` | Update own name |
| GET | `/api/v1/portal/dashboard` | KPIs + recent invoices/tickets |
| GET | `/api/v1/portal/products` | ACTIVE catalogue items (no wholesale/margin) |
| GET | `/api/v1/portal/services` | Account services by type |
| GET | `/api/v1/portal/invoices` | Customer-visible invoices (excludes DRAFT/VOID) |
| GET | `/api/v1/portal/invoices/:id` | Invoice detail + lines |
| GET | `/api/v1/portal/tickets` | Account tickets |
| POST | `/api/v1/portal/tickets` | Create ticket |
| GET | `/api/v1/portal/tickets/:id` | Ticket + customer-visible threads |
| POST | `/api/v1/portal/tickets/:id/replies` | Customer reply |
| GET | `/api/v1/portal/fleet` | Mobile/SIM lines |
| GET | `/api/v1/portal/users` | Portal users on account |
| POST | `/api/v1/portal/users` | Invite portal user |
| PATCH | `/api/v1/portal/users/:id` | Update/deactivate portal user |

## Account scoping

- `accountId` comes from JWT — never from query/body
- Foreign `accountId` in body is rejected
- Ticket/invoice/user lookups always filter `{ accountId }`
- Portal cannot access staff `/api/v1/stats/dashboard`

## Customer-visible data model

**Shown to portal users:**
- Business account profile (company name, account number, status)
- Sites and contacts (read-only on account page)
- ACTIVE catalogue retail prices
- Services: displayName, reference, status, retail price, site, safe fields
- Invoices: ISSUED, PART_PAID, PAID, OVERDUE only
- Tickets: customer-visible threads only (`customerVisible=true`, `isInternal=false`)
- Fleet: mobileNumber, simLabel, costCentre, status

**Hidden from portal:**
- `wholesaleCostEstimatePence`, `marginPolicy`, `wholesaleServiceLinkId`
- `wholesaleEscalationId`, `wholesaleEscalationReference`
- `assignedToStaffUserId`, internal ticket threads
- DRAFT and VOID invoices
- Platform/staff totals

## Deliberately disabled UI actions

| Action | Reason |
|--------|--------|
| Pay invoice | Online payment coming soon |
| Download PDF | PDF generation not yet available |
| SIM swap / spend cap | Fleet controls — Phase 10+ |
| Edit company details | Request via account manager |

## Portal demo seed

```bash
SEED_PORTAL_DEMO=true pnpm db:seed
```

Creates demo account `DEMO-0001`, portal user (`SEED_PORTAL_EMAIL`, default `portal@demo.itsi.business`), sample services, invoice, and ticket.

**Production warning:** Never set `SEED_PORTAL_DEMO=true` in production or any shared/staging environment. The seed creates a known demo password (`ChangeMe123!` by default) and must remain local-only.

## Reused Itsi Mobile patterns

- Cookie + JWT auth with realm separation
- Account dashboard with KPI cards and recent activity lists
- Service list table by type
- Invoice list/detail with balance due
- Ticket create + threaded replies (customer-visible only)
- Fleet/SIM display table
- Portal user invite form

## Validation

```bash
pnpm install
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/portal type-check
pnpm --filter @itsi-business/staff-shell type-check
node scripts/check-wiring.mjs
pnpm type-check
```

## Next phase

**Phase 10** — Wholesale order request flow from business service records.
