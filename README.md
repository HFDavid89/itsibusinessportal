# Itsi Business Platform

> Phase 2 scaffold — clean, buildable foundation for the Itsi Business monorepo.

## Architecture

```
itsibusinessportal/
├── apps/
│   ├── api/          — Fastify 5 REST API (port 4001)
│   ├── admin/        — Platform Admin (Next.js 15, port 4005)
│   ├── crm/          — Business Account CRM (Next.js 15, port 4006)
│   ├── billing/      — Billing & Invoices (Next.js 15, port 4007)
│   ├── desk/         — Support Desk (Next.js 15, port 4008)
│   └── portal/       — Business Customer Portal (Next.js 15, port 4009)
└── packages/
    ├── types/        — Business domain TypeScript types
    ├── core/         — Errors, env, logger
    ├── auth/         — Password hashing, JWT, auth realms
    ├── database/     — Prisma client singleton
    ├── timeline/     — Audit/timeline event publishing
    ├── ui/           — Aurora UI component library
    └── staff-shell/  — Shared staff navigation shell
```

## Core rule

> **Itsi Business owns the business customer.**
> **Itsi Mobile owns the wholesale/provider fulfilment.**

Itsi Business does not call Gamma, KCOM, MS3, or OTS Hero directly.
All provider interactions are proxied through the Itsi Mobile wholesale API boundary.

## Quick start

```bash
# Prerequisites: Node 20+, pnpm 9+, PostgreSQL

pnpm install
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, etc.

pnpm --filter @itsi-business/api db:generate
pnpm --filter @itsi-business/api db:migrate
pnpm --filter @itsi-business/api db:seed

pnpm dev
```

## Wholesale API (Itsi Mobile boundary)

Set in `.env` to activate:

```env
ITSI_MOBILE_API_BASE_URL="https://api.itsimobile.co.uk"
ITSI_MOBILE_WHOLESALE_API_KEY="your-key"
ITSI_MOBILE_WHOLESALE_ENABLED="true"
```

See `apps/api/src/services/wholesale-client.ts` and `docs/ITSI_BUSINESS_PHASE_2_SCAFFOLD.md`.

## Documentation

- `docs/ITSI_BUSINESS_EXTRACTION_PLAN.md` — Phase 1 architecture & extraction plan
- `docs/ITSI_BUSINESS_PHASE_2_SCAFFOLD.md` — Phase 2 scaffold status & next steps
