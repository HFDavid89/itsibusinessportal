# VPS Deployment Baseline — Phase INFRA-1

> Target: Docker-first production on **Ubuntu 26.04 LTS**
> Application repo: `HFDavid89/itsibusinessportal`

## Host baseline

| Component | Target version | Notes |
|-----------|----------------|-------|
| OS | Ubuntu 26.04 LTS | Hardened, unattended-upgrades for security patches |
| Docker Engine | Latest stable (≥27.x) | Official Docker CE apt repo |
| Docker Compose | v2 plugin (`docker compose`) | Not legacy `docker-compose` v1 |
| Node.js | **22 LTS** (`>=22 <23`) | Use `node:22-bookworm-slim` image |
| pnpm | **8.15.6** (current) | Re-test pnpm 10 on Linux before bumping |
| PostgreSQL | **16** (or 17 if Prisma-tested) | Prisma 6.19 supports PG 12–17 |
| Redis | **Not required** | No Redis usage in current codebase |

## Recommended Docker base image

```dockerfile
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@8.15.6 --activate
WORKDIR /app
```

Pin the digest in production Dockerfiles once built and scanned.

## Services architecture (production)

| Service | Port (dev) | Production |
|---------|------------|------------|
| API (`@itsi-business/api`) | 17001 | Expose via reverse proxy |
| Admin | 17005 | Staff internal |
| CRM | 17006 | Staff internal |
| Billing | 17007 | Staff internal |
| Desk | 17008 | Staff internal |
| Services | 17010 | Staff internal |
| Portal | 17009 | Customer-facing |
| PostgreSQL | 5432 | Managed or containerised |

## Required environment variables

See `.env.example`. Minimum production set:

```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/itsi_business

# Auth
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
COOKIE_DOMAIN=.itsi.business

# API
NODE_ENV=production
PORT=17001
CORS_ORIGINS=https://portal.itsi.business,https://crm.itsi.business

# Wholesale bridge (optional until 13B proven)
ITSI_MOBILE_WHOLESALE_ENABLED=false
ITSI_MOBILE_API_BASE_URL=
ITSI_MOBILE_WHOLESALE_API_KEY=

# Next.js apps (each app)
NEXT_PUBLIC_API_URL=https://api.itsi.business
```

## Database operations

```bash
# Generate client (after schema change or Prisma upgrade)
pnpm --filter @itsi-business/api db:generate

# Production migrations (never use migrate dev in prod)
pnpm --filter @itsi-business/api db:migrate:prod

# Seed policy: staging only — do NOT auto-seed production
pnpm --filter @itsi-business/api db:seed   # staging/dev only
```

## Build pipeline (CI/VPS)

```bash
pnpm install --frozen-lockfile
pnpm --filter @itsi-business/api db:generate
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/portal type-check
# ... other apps as needed
pnpm --filter @itsi-business/api test:wholesale-contract
node scripts/check-wiring.mjs
pnpm build   # when Docker images include Next builds
```

## Backup approach

1. **PostgreSQL:** nightly `pg_dump` to encrypted object storage; retain 30 days
2. **Env/secrets:** vault or host secret manager — never in git
3. **Uploaded assets:** N/A currently (no blob store in scope)

## Rollback approach

1. Keep previous Docker image tags (API + each Next app)
2. Database: restore from last `pg_dump` if migration failed; use `prisma migrate resolve` for partial deploys
3. Wholesale bridge: `ITSI_MOBILE_WHOLESALE_ENABLED=false` kills live upstream calls without code rollback

## Security checklist (pre-go-live)

- [ ] `@fastify/jwt` ≥ 10.1.0 (fast-jwt CVEs patched)
- [ ] `pnpm audit` — no critical/high in direct deps
- [ ] TLS termination at reverse proxy (Caddy/nginx/Traefik)
- [ ] PostgreSQL not publicly exposed
- [ ] Staff apps behind VPN or IP allowlist
- [ ] Portal CORS locked to customer domain
- [ ] JWT secrets rotated from dev defaults

## Deferred infrastructure

| Item | Reason |
|------|--------|
| pnpm 10 | Windows corepack failure; re-test on Ubuntu Docker |
| Redis | Not used |
| Next 16 / Prisma 7 | Major upgrades — separate phases |
| Full `pnpm build` in CI | Validate when Dockerfiles added |

## References

- [`DEPENDENCY_RUNTIME_AUDIT.md`](./DEPENDENCY_RUNTIME_AUDIT.md)
- [`PHASE_13B_WHOLESALE_E2E_VERIFICATION.md`](./PHASE_13B_WHOLESALE_E2E_VERIFICATION.md)
