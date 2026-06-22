# Dependency and Runtime Modernisation Audit — Phase INFRA-1

> Generated: Phase INFRA-1 — pre-VPS production baseline
> Repo: `HFDavid89/itsibusinessportal`

## A. Current runtime inventory

| Item | Value |
|------|-------|
| **Node (dev machine)** | v22.13.1 |
| **pnpm (active)** | 8.15.6 |
| **packageManager** | `pnpm@8.15.6` |
| **engines (before INFRA-1)** | `node >=18.0.0`, `pnpm >=8.0.0` |
| **Turbo** | 2.9.18 |
| **TypeScript** | 5.9.3 |
| **Workspace layout** | `apps/*` + `packages/*` |

### Application stack (installed)

| Layer | Package | Installed | Latest available |
|-------|---------|-----------|------------------|
| API | fastify | 5.8.5 | 5.x current |
| API | @fastify/jwt | 9.1.0 → **10.x (INFRA-1)** | 10.1.0 |
| API | @fastify/cors | 10.1.0 | 11.2.0 (major — deferred) |
| API | @fastify/rate-limit | 10.3.0 | 11.0.0 (major — deferred) |
| API | zod | 3.25.76 | 4.4.3 (major — deferred) |
| API | bcryptjs | 2.4.3 | 3.0.3 (major — deferred) |
| API | tsx | 4.22.4 | current |
| DB | prisma / @prisma/client | 6.19.3 | 7.8.0 (major — deferred) |
| UI | next | 15.5.19 | 16.2.9 (major — deferred) |
| UI | react / react-dom | 19.2.7 | 19.x (already on React 19) |
| UI | tailwindcss | 4.3.1 | current |
| Auth pkg | jsonwebtoken | 9.0.3 | current |

> **Note:** All six Next.js apps already run **React 19** with **Next 15.5.x**. `@types/react` was pinned to v18 via root overrides — INFRA-1 aligns types to React 19 without changing runtime.

## B. Security advisories (`pnpm audit`)

| Severity | Package | Path | Action |
|----------|---------|------|--------|
| **Critical (×3)** | fast-jwt ≤6.2.3 | `@fastify/jwt@9` → `fast-jwt@5.0.6` | **Upgrade `@fastify/jwt` to ^10.1.0** (INFRA-1) |
| **High** | fast-jwt | same path | Resolved by jwt v10 |
| **Moderate (×2)** | fast-jwt | same path | Resolved by jwt v10 |
| **Moderate** | postcss <8.5.10 | transitive via `next@15.5.19` | Deferred — requires Next 16 or upstream postcss bump |

**Post-upgrade target:** 1 moderate advisory (postcss transitive) until Next 16 migration.

## C. Outdated packages — grouped by workspace

### Group 1 — Tooling (root `itsi-business-platform`)

| Package | Current | Latest | Decision |
|---------|---------|--------|----------|
| turbo | 2.9.18 | 2.9.18 | ✅ Current |
| typescript | 5.9.3 | 6.0.3 | ⏸ Defer TS 6 |
| eslint | 9.39.4 | 10.5.0 | ⏸ Defer ESLint 10 |
| eslint-config-next | 15.5.19 | 16.2.9 | ⏸ Tied to Next 15 |
| eslint-config-prettier | 9.1.2 | 10.1.8 | ✅ Upgrade to ^10 |
| prettier | 3.8.4 | 3.8.4 | ✅ Current |
| @typescript-eslint/* | 8.61.1 | 8.x | ✅ Current |
| concurrently | 9.2.3 | 10.0.3 | ⏸ Defer major |

### Group 2 — Next/React (all `apps/*` + `packages/ui`, `staff-shell`)

| Package | Current | Latest | Decision |
|---------|---------|--------|----------|
| next | 15.5.19 | 16.2.9 | ⏸ **Stay Next 15 LTS line** |
| react / react-dom | 19.2.7 | 19.x | ✅ Keep — already stable, all apps type-check |
| @types/react | 18.3.31 | 19.2.17 | ✅ Align to ^19.2.0 (types only) |
| @types/react-dom | 18.3.7 | 19.2.3 | ✅ Align to ^19.2.0 (types only) |

### Group 3 — API/runtime (`apps/api`, `packages/auth`)

| Package | Current | Latest | Decision |
|---------|---------|--------|----------|
| fastify | 5.8.5 | 5.8.5 | ✅ Current |
| @fastify/jwt | 9.1.0 | 10.1.0 | ✅ **Upgrade — security** |
| @fastify/cors | 10.1.0 | 11.2.0 | ⏸ Defer — Fastify plugin major |
| @fastify/rate-limit | 10.3.0 | 11.0.0 | ⏸ Defer |
| zod | 3.25.76 | 4.4.3 | ⏸ Defer Zod 4 |
| bcryptjs | 2.4.3 | 3.0.3 | ⏸ Defer — API stable |

### Group 4 — Database (`apps/api`, `packages/database`)

| Package | Current | Latest | Decision |
|---------|---------|--------|----------|
| prisma / @prisma/client | 6.19.3 | 7.8.0 | ⏸ **Stay Prisma 6.19.x** — pin `~6.19.3` |
| PostgreSQL (production target) | — | 16 or 17 | See VPS baseline |

### Group 5 — Test tooling

| Package | Current | Decision |
|---------|---------|----------|
| tsx | 4.22.4 | ✅ Current — used for API dev + `node:test` |
| vitest/jest | not installed | N/A — wholesale contract uses `tsx --test` |

## D. Major-version upgrades — do NOT batch

| Upgrade | Risk | Defer until |
|---------|------|-------------|
| Prisma 6 → 7 | Schema/client breaking changes | Dedicated migration phase |
| Next 15 → 16 | App router, eslint-config-next, postcss | Post-VPS, dedicated UI phase |
| Zod 3 → 4 | API validation schema changes | Dedicated API phase |
| TypeScript 5 → 6 | Workspace-wide compile changes | Dedicated tooling phase |
| pnpm 8 → 10 | Lockfile format, corepack on Windows | INFRA-1 attempted — **deferred** (see below) |
| bcryptjs 2 → 3 | Hash API changes | Low priority |
| @fastify/cors/rate-limit 10 → 11 | Plugin API changes | With Fastify audit |

## E. pnpm 10 migration attempt

```
corepack prepare pnpm@10.12.4 --activate
```

**Result:** Failed on Windows dev host (corepack signature/permission error). pnpm remains **8.15.6** until a dedicated pnpm 10 migration on Linux CI/VPS where corepack is reliable.

**Recommendation:** Pin `packageManager: "pnpm@8.15.6"` for now; re-test pnpm 10 on Ubuntu 26.04 Docker build host.

## F. Pre-existing validation issues

| Target | Status | Notes |
|--------|--------|-------|
| `@itsi-business/api` type-check | ✅ Pass | |
| `@itsi-business/admin` type-check | ✅ Pass | |
| `@itsi-business/crm` type-check | ✅ Pass | |
| `@itsi-business/billing` type-check | ✅ Pass | |
| `@itsi-business/desk` type-check | ✅ Pass | |
| `@itsi-business/services` type-check | ✅ Pass | |
| `@itsi-business/portal` type-check | ✅ Pass | |
| `@itsi-business/timeline` type-check | ❌ Fail | **Pre-existing** — `tsc` resolves `apps/admin` JSX into timeline compile graph (missing `--jsx`). Not introduced by INFRA-1. |
| Root `pnpm type-check` (turbo) | ❌ Fail | Fails via `@itsi-business/timeline` dependency chain |
| `pnpm audit` (post jwt upgrade) | Target: 1 moderate | postcss transitive |
| Redis | N/A | Not used in codebase |

## G. INFRA-1 changes applied

1. Pin `engines.node` to `>=22.0.0 <23.0.0`
2. Add `.nvmrc` → `22`
3. Upgrade `@fastify/jwt` → `^10.1.0` (critical security)
4. Upgrade `eslint-config-prettier` → `^10.1.8`
5. Align `@types/react` / `@types/react-dom` to `^19.2.0`
6. Pin Prisma to `~6.19.3`
7. Add `test` script to API package for turbo
8. Document VPS/Docker production baseline

## H. Validation commands (post-upgrade)

```bash
pnpm install
pnpm --filter @itsi-business/api db:generate
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/admin type-check
pnpm --filter @itsi-business/crm type-check
pnpm --filter @itsi-business/billing type-check
pnpm --filter @itsi-business/desk type-check
pnpm --filter @itsi-business/services type-check
pnpm --filter @itsi-business/portal type-check
pnpm --filter @itsi-business/api test:wholesale-contract
node scripts/check-wiring.mjs
pnpm audit
```
