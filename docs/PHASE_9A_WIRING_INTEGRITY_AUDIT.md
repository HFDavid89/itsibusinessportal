# Phase 9A — Wiring Integrity and Portal Boundary Audit

> Completed: wiring discipline pass before Phase 9B customer portal foundation and Phase 10 wholesale order flows.

## Purpose

Enforce one rule across all workspaces:

**Every visible link, button, nav item, and action must either work, be deliberately disabled with a clear reason, or be removed.**

## Apps reviewed

| App | Port | Status |
|-----|------|--------|
| API | 17001 | Portal routes added; staff realm guards fixed |
| Admin | 17005 | Shared nav; settings placeholder; Services + Portal workspace links |
| CRM | 17006 | Nav unchanged (working); registry defined |
| Billing | 17007 | Nav unchanged (working); registry defined |
| Desk | 17008 | Nav unchanged (working); registry defined |
| Services | 17010 | Nav unchanged (working); registry defined |
| Portal | 17009 | **Boundary fixed** — customer-only routes |

## Shared wiring registry

Location: `packages/staff-shell/src/wiring-registry.ts`

Exports per-workspace:
- `navLinks` — href, enabled, requiredRealm, requiredPermission, comingSoonReason
- `quickActions` — same metadata

Also: `packages/staff-shell/src/nav-config.ts` — `ADMIN_NAV_GROUPS`, `CRM_NAV_GROUPS`, etc. for `AppShell`.

## Links fixed

### Portal (critical)

| Before | After |
|--------|-------|
| Sidebar linked to Admin, CRM, Billing, Desk, Services staff apps | Portal-owned routes only: `/`, `/account`, `/products`, `/services`, `/billing`, `/tickets`, `/fleet`, `/users`, `/settings` |
| `WORKSPACE_URLS.*` imports | Removed from portal UI |

### Admin

| Before | After |
|--------|-------|
| `/settings` nav → 404 | Real placeholder page at `apps/admin/src/app/settings/page.tsx` |
| Workspaces nav missing Services, Portal | Added via `ADMIN_NAV_GROUPS` |
| Duplicated `navGroups` per page | Centralised `ADMIN_NAV_GROUPS` |

## Buttons / quick actions fixed

### Portal dashboard

| Removed (fake) | Replaced with |
|----------------|---------------|
| Create Invoice, Add Payment, New Customer, Run Dunning | Customer quick actions from `PORTAL_WIRING.quickActions` |
| AI insight buttons (no action) | Removed entirely |
| Static Acme Corporation / MRR / demo panels | Account-scoped dashboard from `/api/v1/portal/dashboard` |

Allowed portal quick actions (wired or labelled coming soon):
- View Services → `/services`
- View Invoices → `/billing`
- Raise Ticket → `/tickets` (form in 9B)
- Manage SIMs → `/fleet`
- Manage Users → `/users`
- Update Account Details → `/account`

## Portal boundary changes

### New portal routes (placeholder pages)

Each page states clearly that the feature is not live yet and points to Phase 9B.

- `/account` — company profile self-service
- `/products` — product/plan catalogue
- `/services` — active services list
- `/billing` — invoice self-service
- `/tickets` — support tickets
- `/fleet` — mobile fleet / SIMs
- `/users` — portal users and contacts
- `/settings` — account settings

### Portal API (account-scoped, portal realm only)

| Endpoint | Guard | Scope |
|----------|-------|-------|
| `GET /api/v1/portal/me` | `requireRealm('portal')` | Authenticated portal user + account |
| `GET /api/v1/portal/dashboard` | portal | `accessContext.accountId` |
| `GET /api/v1/portal/services` | portal | accountId |
| `GET /api/v1/portal/invoices` | portal | accountId |
| `GET /api/v1/portal/tickets` | portal | accountId |
| `GET /api/v1/portal/fleet` | portal | accountId |

Portal dashboard **no longer** calls `GET /api/v1/stats/dashboard`.

`GET /api/v1/stats/dashboard` now requires `platform` or `staff` realm.

### Portal auth

`POST /api/v1/auth/login` now supports portal users (`PortalUser` table) after staff lookup fails. JWT includes `accountId` for portal realm.

## Staff / admin wiring changes

| Issue | Fix |
|-------|-----|
| `requireRealm('staff')` blocked platform admins on `/api/v1/admin/staff` | Changed to `requireRealm('staff', 'platform')` |
| JWT `sub` vs `userId` mismatch | `authenticate.ts` and `auth-context.tsx` accept both |
| API default port `4001` vs dev `17001` | Defaults updated to `17001` in API index, `api-client.ts`, admin staff page |
| Admin `/settings` missing | Settings placeholder page added |

## Deliberately disabled / coming soon

| Location | Item | Reason |
|----------|------|--------|
| Portal sub-pages | Full feature UIs | Phase 9B — Business Customer Portal Foundation |
| Portal quick actions | Raise Ticket form, account edit | Phase 9B |
| Admin settings | Full configuration UI | Later phase; wholesale test lives at `/wholesale` |
| Admin overview stat cards | Live platform totals | Placeholder until admin dashboard wired to stats API |

## Automated checks

```bash
node scripts/check-wiring.mjs
```

Heuristic scan flags:
- Portal app references to staff workspace URLs
- Buttons in `.map()` without `onClick` or `disabled`

### Manual checklist

- [ ] Portal sidebar has no links to ports 17005–17008 or 17010
- [ ] Staff apps can open each other via `WORKSPACE_URLS`
- [ ] Admin nav includes Services and Portal workspace links
- [ ] Platform admin can open `/staff` and call staff APIs
- [ ] Portal login returns account-scoped JWT
- [ ] No portal page calls `/api/v1/stats/dashboard`

## Validation commands

```bash
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/admin type-check
pnpm --filter @itsi-business/portal type-check
pnpm --filter @itsi-business/services type-check
pnpm type-check
node scripts/check-wiring.mjs
```

## Remaining deferred (Phase 9B+)

- Portal login UI page (`/login`)
- Full portal self-service screens (invoices, tickets, fleet CRUD)
- CRM/Billing/Desk/Services sub-pages consolidated to shared `nav-config` imports
- Admin overview wired to `/api/v1/stats/dashboard`
- Phase 10 — wholesale order request from service records

## Next phase

**Phase 9B — Business Customer Portal Foundation** builds live features behind the placeholder routes.

**Phase 10** (renamed from Phase 9) — wholesale order request flow.
