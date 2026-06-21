# Phase 6 — Business Billing Foundation

## Scope

Establish Itsi Business-owned retail billing records and a manual invoice workflow. No live payment collection, no automated rating, no Xero sync, no wholesale reconciliation automation in this phase.

## Route Table

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/api/v1/invoices` | `billing.invoices.read` | Paginated list. Filters: status, accountId, search |
| POST | `/api/v1/invoices` | `billing.invoices.write` | Creates DRAFT invoice |
| GET | `/api/v1/invoices/:id` | `billing.invoices.read` | Full invoice + lines + payments |
| PATCH | `/api/v1/invoices/:id` | `billing.invoices.write` | Update dueDate / notes (not on VOID) |
| POST | `/api/v1/invoices/:id/lines` | `billing.invoices.write` | Add line (DRAFT only) |
| PATCH | `/api/v1/invoices/:id/lines/:lineId` | `billing.invoices.write` | Edit line (DRAFT only) |
| DELETE | `/api/v1/invoices/:id/lines/:lineId` | `billing.invoices.write` | Delete line (DRAFT only) |
| POST | `/api/v1/invoices/:id/issue` | `billing.invoices.issue` | DRAFT → ISSUED. Requires ≥1 line |
| POST | `/api/v1/invoices/:id/void` | `billing.invoices.void` | → VOID. Not allowed on PAID |
| POST | `/api/v1/invoices/:id/mark-paid` | `billing.payments.record` | Manual/offline. No payment provider |

## Permissions

| Permission | Scope |
|---|---|
| `billing.invoices.read` | List and view invoices |
| `billing.invoices.write` | Create invoices, manage DRAFT lines |
| `billing.invoices.issue` | Transition DRAFT → ISSUED |
| `billing.invoices.void` | Void non-paid invoices |
| `billing.payments.record` | Record manual payments |
| `billing.reconciliation.read` | (Placeholder — not yet used) |

## Invoice Lifecycle

```
DRAFT  →  ISSUED  →  PART_PAID  →  PAID
                  ↓
                OVERDUE  (set externally or future scheduled job)
                  ↓
                 VOID  (manual staff action)
```

Rules enforced by the API:
- Lines can only be added/edited/deleted while `DRAFT`.
- Cannot issue with zero lines.
- Cannot void a `PAID` invoice — credit note process deferred.
- Cannot record payment against `DRAFT` or `VOID`.
- Payment accumulates into `amountPaidPence`; status promoted to `PART_PAID` or `PAID` automatically.

## Monetary Model

All monetary values are stored as **integer pence** (GBP by default). The `money()` helper formats for display.

Invoice line fields:
- `unitPricePence` — per-unit price
- `discountAmountPence` — flat discount off gross
- `taxRate` — percentage (e.g. `20.0`)
- `netAmountPence` — `(qty × unit) - discount`
- `taxAmountPence` — `net × taxRate / 100`
- `grossAmountPence` — `net + tax`

Invoice totals recalculated automatically on every line mutation:
- `subtotalPence` = sum of all `netAmountPence`
- `taxTotalPence` = sum of all `taxAmountPence`
- `discountTotalPence` = sum of all `discountAmountPence`
- `totalPence` = `subtotal + taxTotal`
- `balanceDue` = `total - amountPaid` (computed client-side)

## Prisma Models

### BusinessInvoice
Extended from scaffold. New fields:
- `issueDate`, `dueDate`, `notes`
- `subtotalPence`, `taxTotalPence`, `discountTotalPence`, `totalPence`, `amountPaidPence`
- Indexes on `[accountId, status]` and `[status, dueDate]`

### BusinessInvoiceLine (renamed from BusinessInvoiceLineItem)
Replaced the scaffold model entirely with the full field set.

### BusinessPayment
Extended from scaffold. New fields:
- `method` (default `MANUAL`), `reference`, `notes`, `paidAt`, `recordedByStaffUserId`
- Indexes on `[invoiceId]` and `[accountId]`

## Frontend Screens

| Screen | Route | Description |
|---|---|---|
| Dashboard | `/` | 4 stat cards (Draft/Issued/Overdue/Balance Pending) + recent invoices list + wholesale reconciliation placeholder |
| Invoices List | `/invoices` | Status tabs, search, paginated table with quick Issue/Void actions |
| Create Invoice | `/invoices/new` | Form: accountId, dueDate, notes → creates DRAFT → redirects to detail |
| Invoice Detail | `/invoices/:id` | Full detail: meta, line items (add/edit/delete DRAFT only), totals, payments, sidebar lifecycle |

## Timeline Events Written

| Event Type | Trigger |
|---|---|
| `INVOICE_CREATED` | POST /invoices |
| `INVOICE_LINE_ADDED` | POST /invoices/:id/lines |
| `INVOICE_LINE_UPDATED` | PATCH /invoices/:id/lines/:lineId |
| `INVOICE_LINE_DELETED` | DELETE /invoices/:id/lines/:lineId |
| `INVOICE_ISSUED` | POST /invoices/:id/issue |
| `INVOICE_VOIDED` | POST /invoices/:id/void |
| `INVOICE_MARKED_PAID` | POST /invoices/:id/mark-paid |

## What Was Reused from Itsi Mobile

See `docs/ITSI_MOBILE_REUSE_AUDIT.md` Phase 6 section for full table.

- Invoice list/table pattern — **Refocus** (stripped Cockpit components, subscription billing, portal fields)
- Invoice detail drawer layout — **Refocus** (reused layout structure, removed PDF, credit note, Xero)
- Line item edit modal — **Refocus** (reused field pattern, changed amounts to pence integers, added serviceType/discount/taxRate)
- Status badge colour palette — **Reuse** (same colour semantics)
- `$transaction` pattern + timeline write — **Reuse**
- RBAC hook structure — **Reuse**
- Response envelope `{ success, data, meta }` — **Reuse**
- `money()` helper — **Refocus** (reimplemented using `Intl.NumberFormat`)

## What Was Skipped

- Invoice PDF generation — deferred
- Credit notes — deferred
- Xero sync — excluded from Phase 6
- GoCardless / Stripe collection — hard excluded
- Automated usage rating — hard excluded
- Dunning / overdue chasing automation — deferred
- Subscription billing model — not applicable to Itsi Business
- `billingAccount` intermediary model — not needed (invoices attach directly to `BusinessAccount`)
- Portal invoice view for business customers — deferred to portal phase
- Wholesale cost reconciliation automation — placeholder only

## Hard Exclusions (enforced)

- No Stripe API calls
- No GoCardless API calls
- No Xero API calls
- No automated payment collection of any kind
- No Itsi Mobile wholesale billing API calls
- No consumer subscription billing assumptions
- No `mark-paid` route triggers any external action

## Known Deferred Items

1. **Live payment collection** — Stripe / GoCardless, requires commercial decision
2. **Xero / accounting sync** — requires Xero OAuth setup
3. **Automated usage rating** — requires service catalogue + usage data
4. **Wholesale billing reconciliation** — requires Itsi Mobile wholesale billing API integration
5. **PDF invoice generation** — requires file storage or PDF service
6. **Credit notes** — requires additional model and route
7. **Email invoice delivery** — requires email service
8. **OVERDUE scheduling** — requires a background job / worker
9. **Portal invoice view** — deferred to business portal phase

## Validation Commands

```bash
pnpm install
pnpm --filter @itsi-business/api db:generate
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/billing type-check
pnpm type-check
pnpm build
```
