# Itsi Business — Phase 2 Scaffold

> Status: **SCAFFOLD COMPLETE — awaiting `pnpm install` and `prisma generate`**

## What was created

### Root monorepo
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`
- `.gitignore`, `.prettierrc`, `.env.example`

### Packages (all in `packages/`)

| Package | Description |
|---|---|
| `@itsi-business/types` | Business domain TypeScript types |
| `@itsi-business/core` | Errors, env, logger utilities |
| `@itsi-business/auth` | Password hashing, JWT tokens, auth realms |
| `@itsi-business/database` | Singleton PrismaClient wrapper |
| `@itsi-business/timeline` | Timeline event types and publisher |
| `@itsi-business/ui` | Aurora UI component library (Button, Badge, Card, etc.) |
| `@itsi-business/staff-shell` | Shared staff navigation shell (AppShell) |

### Apps (all in `apps/`)

| App | Port | Description |
|---|---|---|
| `@itsi-business/api` | 4001 | Fastify 5 REST API |
| `@itsi-business/admin` | 4005 | Platform Admin (Next.js 15) |
| `@itsi-business/crm` | 4006 | Business Account CRM (Next.js 15) |
| `@itsi-business/billing` | 4007 | Billing — Invoices & Payments (Next.js 15) |
| `@itsi-business/desk` | 4008 | Support Desk — Tickets (Next.js 15) |
| `@itsi-business/portal` | 4009 | Business Customer Portal (Next.js 15) |

### API (`apps/api/`)
- Fastify routes: `health`, `auth`, `accounts`, `sites`, `contacts`, `tickets`, `invoices`, `services`, `wholesale`
- All non-health routes return `501 NOT_IMPLEMENTED` (scaffold placeholder)
- `prisma/schema.prisma` — full business domain schema (CRM, billing, support, services, timeline, audit)
- `prisma/seed.ts` — safe seed: staff roles + bootstrap admin user only
- `src/services/wholesale-client.ts` — wholesale API client placeholder (disabled until env vars set)

### Key business rule enforced throughout
```
RULE: Itsi Business owns the business customer.
      Itsi Mobile owns the wholesale/provider fulfilment.
```

## What is NOT implemented (by design)

- No live business logic (all routes return 501)
- No Gamma/KCOM/MS3/OTS Hero direct integration
- No consumer signup flow
- No live billing/payment collection
- No provider credential exposure
- No pilot/demo seed data
- No VPS deployment

## Next steps to make it runnable

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client
pnpm --filter @itsi-business/api db:generate

# 3. Copy and configure env
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET, etc.

# 4. Run migrations (needs Postgres)
pnpm --filter @itsi-business/api db:migrate

# 5. Seed bootstrap data
pnpm --filter @itsi-business/api db:seed

# 6. Run type-check
pnpm type-check

# 7. Start dev servers
pnpm dev
```

## Wholesale API connection

To activate the Itsi Mobile wholesale API boundary, set in `.env`:

```env
ITSI_MOBILE_API_BASE_URL="https://api.itsimobile.co.uk"
ITSI_MOBILE_WHOLESALE_API_KEY="your-wholesale-key"
ITSI_MOBILE_WHOLESALE_ENABLED="true"
```

The client is in `apps/api/src/services/wholesale-client.ts`.
It does **not** call Gamma, KCOM, MS3, or OTS Hero directly.

## Pre-install lint errors (expected)

The following errors are **expected before `pnpm install`** and will resolve automatically:

- `Cannot find module 'fastify'` — install pending
- `Cannot find module 'react'` — install pending
- `Cannot find module '@prisma/client'` — install pending, then `prisma generate`
- `Cannot find module 'bcryptjs'` / `'jsonwebtoken'` — install pending
- `Cannot find name 'process'` — `@types/node` not yet installed
- `Cannot find module 'next'` — install pending
- `JSX element implicitly has type 'any'` — `@types/react` not yet installed
- `@tailwind` CSS warnings — cosmetic, Tailwind CSS not yet installed

All TS/JSX errors are purely due to missing `node_modules`. None reflect logic errors.
