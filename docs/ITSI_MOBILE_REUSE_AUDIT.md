# Itsi Mobile → Itsi Business Reuse Audit

> Generated: Phase 3 — Controlled Reuse from Itsi Mobile
> Source repo: `HFDavid89/itsimobileportal`
> Target repo: `HFDavid89/itsibusinessportal`

## Golden rule

> **If Itsi Mobile already solved the platform problem — copy/refocus the pattern.**
> **If Itsi Mobile solved a provider or residential-consumer problem — do not copy it.**

---

## Package-level audit

| Source area | Reuse decision | Action | Reason | Boundary risk | Target location |
|---|---|---|---|---|---|
| `packages/core/src/errors.ts` | **Reuse** | Copy verbatim | Generic AppError hierarchy — no mobile/provider coupling | None | `packages/core/src/errors.ts` |
| `packages/core/src/env.ts` | **Reuse** | Copy verbatim | `requireEnv` / `optionalEnv` — completely generic | None | `packages/core/src/env.ts` |
| `packages/core/src/logger.ts` | **Reuse** | Copy verbatim | `createLogger` — no mobile assumptions | None | `packages/core/src/logger.ts` |
| `packages/auth/src/password.ts` | **Reuse** | Copy verbatim | `bcryptjs` hash/verify — universal | None | `packages/auth/src/password.ts` |
| `packages/auth/src/tokens.ts` | **Reuse** | Copy verbatim | JWT sign/verify — universal | None | `packages/auth/src/tokens.ts` |
| `packages/auth/src/realms.ts` | **Refocus** | Copy, rename `CUSTOMER` → `PORTAL_USER`, keep `PLATFORM` + `STAFF` | Same realm model; business portal users are not mobile consumers | Low | `packages/auth/src/realms.ts` |
| `packages/database/src/client.ts` | **Reuse** | Copy verbatim — points to its own `@prisma/client` | Singleton pattern identical | None | `packages/database/src/client.ts` |
| `packages/timeline/src/types.ts` | **Refocus** | Copy, remove `tenantId` (Itsi Business is single-tenant per deployment), keep all other fields | Itsi Business does not use reseller tenancy | Low | `packages/timeline/src/types.ts` |
| `packages/timeline/src/publisher.ts` | **Reuse** | Copy verbatim — noop until DB wired | Pattern identical | None | `packages/timeline/src/publish.ts` |
| `packages/ui/src/Button.tsx` | **Reuse** | Copy verbatim | Design system component — zero coupling | None | `packages/ui/src/Button.tsx` |
| `packages/ui/src/Badge.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/Badge.tsx` |
| `packages/ui/src/StatusBadge.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/StatusBadge.tsx` |
| `packages/ui/src/Card.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/Card.tsx` |
| `packages/ui/src/PageHeader.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/PageHeader.tsx` |
| `packages/ui/src/EmptyState.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/EmptyState.tsx` |
| `packages/ui/src/LoadingSpinner.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/LoadingSpinner.tsx` |
| `packages/ui/src/LoadErrorPanel.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/LoadErrorPanel.tsx` |
| `packages/ui/src/PageSkeleton.tsx` | **Reuse** | Copy verbatim | Design system component | None | `packages/ui/src/PageSkeleton.tsx` |
| `packages/ui/src/toast.tsx` | **Reuse** | Copy verbatim | Toast provider — no coupling | None | `packages/ui/src/toast.tsx` |
| `packages/ui/src/ThemeProvider.tsx` | **Reuse** | Copy, change storage key to `itsi-business-theme` | Theme system — rename storage key only | None | `packages/ui/src/ThemeProvider.tsx` |
| `packages/ui/src/ThemeToggle.tsx` | **Reuse** | Copy verbatim | UI only | None | `packages/ui/src/ThemeToggle.tsx` |
| `packages/ui/tailwind.preset.ts` | **Reuse** | Copy verbatim as `tailwind.preset.ts` | Design token contract — identical | None | `packages/ui/tailwind.preset.ts` |
| `packages/ui/src/TenantBrandingProvider.tsx` | **Skip** | Do not copy | Multi-tenant reseller branding — not applicable to Itsi Business | Medium | N/A |
| `packages/ui/src/TenantAdminProvider.tsx` | **Skip** | Do not copy | Reseller tenant management — belongs to Itsi Mobile | High | N/A |
| `packages/ui/src/mock-tenant-branding.ts` | **Skip** | Do not copy | Reseller test fixture | High | N/A |
| `packages/ui/src/tenant-branding-utils.ts` | **Skip** | Do not copy | Reseller branding utils | High | N/A |
| `packages/staff-shell/src/app-shell.tsx` | **Reuse** | Copy, change `@itsi/ui` import → `@itsi-business/ui`, update workspace rail labels (remove `telecom`, add `portal`) | Core staff UI shell — no provider coupling | Low | `packages/staff-shell/src/app-shell.tsx` |
| `packages/staff-shell/src/auth-context.tsx` | **Reuse** | Copy verbatim | Auth provider pattern — no mobile coupling | None | `packages/staff-shell/src/auth-context.tsx` |
| `packages/staff-shell/src/api-client.ts` | **Refocus** | Copy, update `API_URL` default port, remove `TENANT_SLUG`/`DEV_TENANT_KEY`/`X-Tenant-Slug` (Itsi Business is not multi-tenant), simplify login to single-realm flow | Transport + token layer — reusable, tenancy logic not applicable | Low | `packages/staff-shell/src/api-client.ts` |
| `packages/staff-shell/src/workspace-urls.ts` | **Refocus** | Copy, replace `telecom` workspace with `portal`, update dev ports (4005–4009) | Workspace config — just URL constants | None | `packages/staff-shell/src/workspace-urls.ts` |
| `packages/staff-shell/src/access-restricted.tsx` | **Reuse** | Copy verbatim | Generic RBAC UI panel | None | `packages/staff-shell/src/access-restricted.tsx` |
| `packages/staff-shell/src/platform-access-guard.tsx` | **Reuse** | Copy, change `@itsi/ui` import → `@itsi-business/ui` | Guard pattern — identical | None | `packages/staff-shell/src/platform-access-guard.tsx` |
| `packages/staff-shell/src/notification-bell.tsx` | **Reuse** | Copy, update import | UI pattern | None | `packages/staff-shell/src/notification-bell.tsx` |
| `packages/staff-shell/src/settings-cog.tsx` | **Reuse** | Copy, update import | UI pattern | None | `packages/staff-shell/src/settings-cog.tsx` |
| `packages/staff-shell/src/app-switcher.tsx` | **Refocus** | Copy, replace `telecom` with `portal` workspace entry | Workspace switcher — just label/URL config change | None | `packages/staff-shell/src/app-switcher.tsx` |
| `packages/staff-shell/src/tenant-copy.ts` | **Skip** | Do not copy | Reseller tenant display text — not applicable | Medium | N/A |
| `packages/staff-shell/src/use-workspace-badges.ts` | **Reuse** | Copy, update workspace keys to match business workspaces | Badge pattern | None | `packages/staff-shell/src/use-workspace-badges.ts` |
| `packages/staff-shell/src/staff-page-chrome.tsx` | **Reuse** | Copy, update import | Page chrome shell | None | `packages/staff-shell/src/staff-page-chrome.tsx` |
| `packages/staff-shell/src/settings-placeholder.tsx` | **Reuse** | Copy verbatim | Placeholder | None | `packages/staff-shell/src/settings-placeholder.tsx` |
| `packages/entitlements/` | **Skip** | Do not copy | Reseller entitlement/plan system — belongs to Itsi Mobile | High | N/A |
| `packages/tenancy/` | **Skip** | Do not copy | Multi-tenant reseller isolation — not applicable | Critical | N/A |

---

## App-level audit

| Source area | Reuse decision | Action | Reason | Boundary risk | Target location |
|---|---|---|---|---|---|
| `apps/api/src/lib/jwt.ts` | **Refocus** | Copy, adapt `JwtPayload` — keep `platform`/`staff`/`portal` realms, remove `tenantId` from platform realm | JWT payload contract — same pattern | None | `apps/api/src/lib/jwt.ts` |
| `apps/api/src/lib/auth-cookie.ts` | **Refocus** | Copy, change cookie name (`itsi_rt` → `itsi_biz_rt`), change domain env var | httpOnly cookie SSO pattern — identical | None | `apps/api/src/lib/auth-cookie.ts` |
| `apps/api/src/middleware/authenticate.ts` | **Reuse** | Copy verbatim — `requireAuth` / `requireRealm` Fastify hooks | Middleware pattern — no coupling | None | `apps/api/src/middleware/authenticate.ts` |
| `apps/api/src/middleware/rbac.ts` | **Reuse** | Copy, adapt Prisma model name (`StaffUserRole` → matches business schema) | RBAC pattern — proven, adapt model name | Low | `apps/api/src/middleware/rbac.ts` |
| `apps/api/src/middleware/security.ts` | **Refocus** | Copy, update `allowedOrigins` defaults to `itsi.business` domains | Security headers/CORS/rate-limit config — generic | None | `apps/api/src/middleware/security.ts` |
| `apps/api/src/routes/auth/` | **Refocus** | Reuse session/login/logout/refresh route structure, remove `tenantSlug` from staff login | Auth flow — same JWT/cookie pattern | Low | `apps/api/src/routes/auth.ts` |
| `apps/api/src/routes/admin/` | **Refocus** | Reuse platform admin route patterns, remove Gamma/KCOM/MS3/Stripe/GoCardless integration routes | Admin scaffold — strip provider routes | High | `apps/api/src/routes/` |
| `apps/api/src/routes/platform/` | **Skip** | Do not copy | Reseller/tenant management routes | Critical | N/A |
| `apps/api/src/routes/telecom/` | **Skip** | Do not copy | Provider service-order fulfilment routes | Critical | N/A |
| `apps/api/src/routes/portal/` | **Refocus** | Reuse customer self-service structure (account info, invoices, tickets); remove consumer signup, SIM ordering, usage rating | Portal auth + self-service pattern reusable | High | `apps/portal/` |
| `apps/api/src/routes/onboarding/` | **Skip** | Do not copy | Consumer residential signup — not applicable | Critical | N/A |
| `apps/api/src/routes/webhooks/` | **Skip** | Do not copy | Provider webhook handlers (Stripe, GoCardless, OTS Hero) | Critical | N/A |
| `apps/api/src/routes/wholesale/` | **Skip** | Do not copy | Raw Gamma/KCOM/MS3 wholesale API wiring — replaced by the Itsi Mobile boundary client | Critical | N/A |
| `apps/api/src/routes/partner/` | **Skip** | Do not copy | Partner/reseller API — not applicable | Critical | N/A |
| `apps/crm/app/(app)/accounts/[accountId]/_components/AccountHero.tsx` | **Refocus** | Reuse layout/UX pattern, rename entity to `BusinessAccount`, remove provider-specific tabs | Account 360 UX — proven pattern | Medium | `apps/crm/src/app/accounts/[id]/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/AccountProfileRail.tsx` | **Refocus** | Reuse layout, rebind to `BusinessAccount` data shape | Profile rail pattern | Medium | `apps/crm/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/AccountTabBar.tsx` | **Refocus** | Copy structure, replace tabs: remove `GammaServicesTab`, `PortingTab`, `VoipTab`, `EndUsersTab`, keep/rename: Overview, Contacts, Sites, Services, Tickets, Invoices, Timeline | Tab bar pattern — reusable, provider tabs skipped | Medium | `apps/crm/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/SitesTab.tsx` | **Refocus** | Reuse layout, bind to `BusinessSite` | Site display pattern | Low | `apps/crm/` |
| `apps/crm/app/(app)/accounts/[accountId]/_components/GammaServicesTab.tsx` | **Skip** | Do not copy | Direct Gamma service display — provider-specific | Critical | N/A |
| `apps/crm/app/(app)/accounts/[accountId]/_components/PortingTab.tsx` | **Skip** | Do not copy | Number porting — provider fulfilment | Critical | N/A |
| `apps/crm/app/(app)/accounts/[accountId]/_components/EnergyTab.tsx` | **Refocus** | Reuse layout structure only, bind to `BusinessEnergyService` (wholesale link) — no direct OTS Hero calls | Energy service display pattern reusable | High | `apps/crm/` |
| `apps/desk/` | **Refocus** | Reuse ticket queue/thread/status/priority UI patterns, add `wholesaleEscalationRef` field for Itsi Mobile escalation link | Desk UX proven — strip provider ticket internals | Medium | `apps/desk/` |
| `apps/billing/` | **Refocus carefully** | Reuse invoice list/detail/line-item UI patterns; do not copy Stripe/GoCardless live collection flows | Billing UX reusable; live collection not applicable | High | `apps/billing/` |
| `apps/admin/` | **Refocus** | Reuse settings/staff/roles/audit admin patterns; remove Gamma/KCOM/MS3/Stripe integration settings cards | Admin scaffold reusable; provider integration settings skipped | High | `apps/admin/` |
| `apps/portal/` | **Refocus** | Reuse auth/session/account-info/invoice-view/ticket-create patterns; remove consumer signup, SIM ordering | Business portal reuses mobile portal auth patterns | High | `apps/portal/` |
| `apps/scheduler/` | **Skip** | Do not copy | Mobile service scheduler — provider-specific jobs | High | N/A |
| `apps/telecom/` | **Skip** | Do not copy entirely | Provider service-order UI — belongs to Itsi Mobile | Critical | N/A |
| `apps/mobile/` | **Skip** | Do not copy | Mobile consumer app — out of scope | Critical | N/A |

---

## Explicitly skipped (never copy to Itsi Business)

| Module / concept | Reason |
|---|---|
| Gamma API client / credentials | Provider integration — belongs to Itsi Mobile |
| KCOM API client / credentials | Provider integration — belongs to Itsi Mobile |
| MS3 API client / credentials | Provider integration — belongs to Itsi Mobile |
| OTS Hero energy client | Provider integration — belongs to Itsi Mobile |
| Stripe payment collection | Consumer billing — not applicable |
| GoCardless direct debit | Consumer billing — not applicable |
| Number porting routes | Provider fulfilment — belongs to Itsi Mobile |
| SIM card ordering | Provider fulfilment — belongs to Itsi Mobile |
| Consumer signup / onboarding flow | Residential consumer — not applicable |
| Reseller/tenant management | Multi-tenant SaaS — not applicable to Itsi Business |
| Reseller entitlements/plans | Reseller commercial model — belongs to Itsi Mobile |
| Provider webhook handlers | Provider data push — belongs to Itsi Mobile |
| Raw wholesale API routes | Replaced by Itsi Mobile boundary client |
| Mobile usage rating | Consumer billing internals |
| `pilot-fixture-ids.ts` | Fake pilot data — forbidden in scaffold |
| Consumer portal identity | Residential-only assumptions |

---

## Phase 3 execution sequence

1. **packages/core** — copy `errors.ts`, `env.ts`, `logger.ts` verbatim
2. **packages/auth** — copy `password.ts`, `tokens.ts`; refocus `realms.ts`
3. **packages/database** — copy `client.ts` singleton
4. **packages/timeline** — copy `publisher.ts`, refocus `types.ts`
5. **packages/ui** — copy full Aurora component set + `tailwind.preset.ts`
6. **packages/staff-shell** — copy shell components, refocus `api-client.ts` + `workspace-urls.ts`
7. **apps/api middleware** — copy `authenticate.ts`, `rbac.ts`, `security.ts`; refocus `auth-cookie.ts`, `jwt.ts`
8. **apps/api auth routes** — reuse login/logout/session/refresh route structure
9. **apps/crm** — reuse account list + account 360 layout patterns with `BusinessAccount` model
10. **apps/desk** — reuse ticket queue/thread/status patterns, add wholesale escalation link
11. **apps/billing** — reuse invoice list/detail UI patterns only
12. **apps/admin** — reuse settings/staff/roles admin patterns, strip provider integration cards
13. **apps/portal** — reuse auth + self-service patterns, no consumer signup
