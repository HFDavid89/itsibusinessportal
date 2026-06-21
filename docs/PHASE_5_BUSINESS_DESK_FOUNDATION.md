# Phase 5 — Business Desk Foundation

## What was built

### Prisma schema changes

Extended `BusinessTicket` with:
- `ticketNumber` (unique, `TKT-XXXXXX` format)
- `contactId` (optional FK to `BusinessContact`)
- `description` (optional long text)
- `assignedToStaffUserId` (optional FK to `StaffUser`)
- Corrected priority default: `NORMAL` (was `MEDIUM`)
- Added composite indexes: `[accountId, status]` and `[status, priority]`

Extended `BusinessTicketThread` with:
- `customerVisible` (boolean, default `true`) — lets staff mark a reply as internal-only at the thread level

### API Routes (`apps/api/src/routes/tickets.ts`)

All routes registered at `/api/v1/tickets` (already wired in `apps/api/src/index.ts`).

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/tickets` | `desk.tickets.read` | List with search, status/priority/category/account filters, pagination |
| POST | `/api/v1/tickets` | `desk.tickets.write` | Create ticket, generate `TKT-XXXXXX` number, optional first message, write `TICKET_CREATED` timeline event |
| GET | `/api/v1/tickets/:id` | `desk.tickets.read` | Get ticket with account, site, all threads |
| PATCH | `/api/v1/tickets/:id` | `desk.tickets.write` | Update status/priority/category/subject/assignment, write `TICKET_STATUS_CHANGED` timeline event |
| GET | `/api/v1/tickets/:id/threads` | `desk.tickets.read` | List threads; `?includeInternal=false` for customer-facing callers |
| POST | `/api/v1/tickets/:id/threads` | `desk.tickets.write` | Add customer-visible reply, write `TICKET_REPLY_ADDED` timeline event |
| POST | `/api/v1/tickets/:id/internal-notes` | `desk.tickets.internal_notes` | Add internal staff note (not customer-visible), write `TICKET_INTERNAL_NOTE_ADDED` timeline event |
| POST | `/api/v1/tickets/:id/escalate-to-itsi-mobile` | `desk.tickets.escalate` | Placeholder — requires `ITSI_MOBILE_WHOLESALE_ENABLED=true`, sets status to `WAITING_ITSI_MOBILE`, writes `TICKET_ESCALATED_TO_ITSI_MOBILE` timeline event |

### Ticket statuses

| Status | Meaning |
|--------|---------|
| `OPEN` | Active, awaiting staff response |
| `WAITING_CUSTOMER` | Awaiting customer reply |
| `WAITING_INTERNAL` | Awaiting internal action |
| `WAITING_ITSI_MOBILE` | Escalated to wholesale desk |
| `RESOLVED` | Issue resolved, pending close |
| `CLOSED` | Fully closed |

### Ticket priorities

`LOW` · `NORMAL` · `HIGH` · `URGENT`

### Ticket categories

`GENERAL` · `BILLING` · `MOBILE` · `BROADBAND` · `ENERGY` · `SOFTWARE` · `ACCOUNT`

### Permissions

| Permission | Purpose |
|-----------|---------|
| `desk.tickets.read` | Read ticket list and detail |
| `desk.tickets.write` | Create/update tickets and replies |
| `desk.tickets.assign` | Assign tickets to staff users |
| `desk.tickets.internal_notes` | Add internal notes |
| `desk.tickets.escalate` | Trigger escalation placeholder |

### Desk API client (`apps/desk/src/lib/api.ts`)

Typed `deskApi` with:
- `deskApi.tickets(params?)` — list with filters
- `deskApi.ticket(id)` — single ticket
- `deskApi.createTicket(data)` / `deskApi.updateTicket(id, data)`
- `deskApi.threads(ticketId, includeInternal?)` — thread list
- `deskApi.addThread(ticketId, body, customerVisible?)` — customer reply
- `deskApi.addInternalNote(ticketId, body)` — internal note
- `deskApi.escalateToItsiMobile(ticketId)` — escalation placeholder

### Desk Frontend Screens

| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Dashboard — 4 stat cards (Open, Urgent, Escalated, Resolved) + recent tickets list |
| `/tickets` | `tickets/page.tsx` | Tickets list — status tabs, priority filter, search, paginated table |
| `/tickets/new` | `tickets/new/page.tsx` | Create ticket form — account ID, subject, description, category, priority, initial message |
| `/tickets/[id]` | `tickets/[id]/page.tsx` | Ticket detail — Customer Thread / Internal Notes / Timeline tabs + sidebar with live property editing + escalation action |

## What was reused from Itsi Mobile

| Pattern | Source | Reuse decision |
|---------|--------|----------------|
| Thread list/reply UI pattern | `apps/desk/app/(app)/tickets/[ticketId]/_components/TicketDetailWorkspace.tsx` | Refocused: removed WhatsApp/SMS/email channel routing, attachment upload, SLA |
| Status/priority filter tabs + view model | `apps/desk/app/(app)/tickets/page.tsx` | Refocused: removed saved views, cockpit health strip, overdue logic |
| Status pill / priority badge pattern | `components/tickets/TicketStatusMenu.tsx` | Reused colour mapping approach, re-implemented in Tailwind inline |
| Timeline write pattern | `apps/api/src/routes/admin/tickets.ts` | Reused — `prisma.timelineEvent.create` on status change, reply, note, escalation |
| Zod validation pattern | `apps/api/src/routes/admin/tickets.ts` | Reused — `safeParse` with `422` on failure |
| RBAC `requirePermission` hooks | `apps/api/src/middleware/rbac.ts` | Reused directly |
| API response envelope `{ success, data, meta }` | All admin routes | Reused |
| Thread `isInternal` flag | `apps/api/src/routes/admin/tickets.ts` | Reused — extended with `customerVisible` to support stricter visibility |

## What was skipped / not reused

- **SLA deadlines** (`ticket-sla.service.ts`) — deferred; no per-priority policy in Itsi Business yet
- **Multi-channel routing** (WhatsApp, SMS, Email, Facebook) — excluded; Itsi Business uses internal desk only
- **Attachment upload** — deferred; no file storage configured yet
- **Department / team assignment** — deferred; Itsi Business has no department model yet
- **VIP restriction checks** (`account-access.ts`) — skipped; no VIP concept in Itsi Business
- **Tenant multi-tenancy** — excluded; Itsi Business is single-tenant

## Escalation boundary

```
BusinessTicket ──► WAITING_ITSI_MOBILE (status only)
                            │
                            │  (future: requires ITSI_MOBILE_WHOLESALE_ENABLED=true)
                            ▼
                   Itsi Mobile wholesale desk
                   (provider-side ticket — NOT exposed to business customer)
```

The escalation route **does not** call Gamma, KCOM, MS3, or OTS Hero. It records the intent only. The wholesale integration is a Phase 6+ concern.

## Hard Exclusions (enforced)

- No direct Gamma/KCOM/MS3/OTS Hero escalation
- No provider notes exposed to business customer
- No provider-side supplier ticket creation
- No billing/payment implementation
- No wholesale order creation
- No fake/demo/pilot tickets
- No business customer records created inside Itsi Mobile

## Intentional Deferral — Delete / Archive

Same policy as Phase 4. **No DELETE routes** for tickets, threads, or notes. Lifecycle rules (archive vs. retain for audit) are not yet agreed.

## Validation Steps

```sh
pnpm install
pnpm --filter @itsi-business/api db:generate
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/desk type-check
pnpm type-check
```

## Commit

```
feat(desk): implement Business Desk foundation
```
