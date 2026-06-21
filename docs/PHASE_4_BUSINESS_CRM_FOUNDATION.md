# Phase 4 — Business CRM Foundation

## What was built

### API Routes (`apps/api/src/routes/accounts.ts`)

All routes live under `/api/v1/accounts` and are protected by RBAC middleware using the permissions defined below.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/accounts` | `crm.accounts.read` | List accounts with search, status filter, pagination |
| POST | `/api/v1/accounts` | `crm.accounts.write` | Create account, auto-generates `BIZ-XXXXXX` account number |
| GET | `/api/v1/accounts/:id` | `crm.accounts.read` | Get account with contacts, sites, and service counts |
| PATCH | `/api/v1/accounts/:id` | `crm.accounts.write` | Partial update, writes timeline event |
| GET | `/api/v1/accounts/:accountId/contacts` | `crm.contacts.read` | List contacts for account |
| POST | `/api/v1/accounts/:accountId/contacts` | `crm.contacts.write` | Add contact, enforces single primary |
| PATCH | `/api/v1/accounts/:accountId/contacts/:contactId` | `crm.contacts.write` | Update contact |
| GET | `/api/v1/accounts/:accountId/sites` | `crm.sites.read` | List sites for account |
| POST | `/api/v1/accounts/:accountId/sites` | `crm.sites.write` | Add site, enforces single primary |
| PATCH | `/api/v1/accounts/:accountId/sites/:siteId` | `crm.sites.write` | Update site |
| GET | `/api/v1/accounts/:accountId/timeline` | `crm.accounts.read` | Paginated timeline events |

**Timeline events written automatically:**
- `ACCOUNT_CREATED`, `ACCOUNT_UPDATED`
- `CONTACT_ADDED`, `CONTACT_UPDATED`
- `SITE_ADDED`, `SITE_UPDATED`

**Validation:** All inputs validated with Zod schemas. Errors return `422` with `{ success: false, error: { code: 'VALIDATION_ERROR', message } }`.

### CRM API Client (`apps/crm/src/lib/api.ts`)

Typed fetch wrapper with full domain types:
- `crmApi.accounts(params?)` — list with filters
- `crmApi.account(id)` — single account
- `crmApi.createAccount(data)` / `crmApi.updateAccount(id, data)`
- `crmApi.contacts(accountId)` / `crmApi.createContact(...)` / `crmApi.updateContact(...)`
- `crmApi.sites(accountId)` / `crmApi.createSite(...)` / `crmApi.updateSite(...)`
- `crmApi.timeline(accountId, params?)` — paginated events

### CRM App Screens (`apps/crm/src/app/`)

| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Dashboard — live stats, recent accounts list |
| `/accounts` | `accounts/page.tsx` | Accounts list — searchable, filterable by status, paginated sortable table |
| `/accounts/new` | `accounts/new/page.tsx` | Create account form — company name, trading name, Companies House, VAT, initial status |
| `/accounts/[id]` | `accounts/[id]/page.tsx` | Account 360 — Overview, Contacts, Sites, Timeline tabs |

### Permissions Required

Assign these to staff roles via `StaffRole.permissions`:

```
crm.accounts.read
crm.accounts.write
crm.contacts.read
crm.contacts.write
crm.sites.read
crm.sites.write
```

## Hard Exclusions (enforced)

- No wholesale/provider API calls (Gamma, KCOM, MS3, OTS Hero)
- No residential signup or consumer portal flows
- No fake/demo/pilot customer data
- No billing, tickets, wholesale ordering, or payments in this phase

## Validation Steps

```sh
pnpm install
pnpm --filter @itsi-business/api db:generate
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/crm type-check
pnpm type-check
```

## Commit

```
feat(crm): implement Business CRM foundation
```
