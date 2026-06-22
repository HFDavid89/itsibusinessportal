# Phase 14 — Staff Request Workflow and SLA Hardening

## Purpose

Build staff-side operational workflow and SLA tracking on **local Itsi Business records** — without requiring live Itsi Mobile fulfilment.

This phase improves:

- Staff request queues
- SLA timers and breach visibility
- Assignment and ownership
- Manual retry / review controls
- Wholesale follow-up work items (local lifecycle only)
- Desk ↔ work queue linkage

**Blocked (unchanged):** live SIM barring, swaps, roaming, spend caps, PAC/STAC, customer-triggered network changes, and anything assuming live Itsi Mobile fulfilment until **13B-2** passes.

## Work item model

`BusinessWorkItem` (`business_work_items`)

| Field | Notes |
|-------|-------|
| `type` | `WHOLESALE_ORDER`, `WHOLESALE_STATUS_REVIEW`, `CUSTOMER_SERVICE_REQUEST`, `SIM_METADATA_CHANGE`, `PRODUCT_ENQUIRY`, `ENERGY_REVIEW`, `BILLING_QUERY`, `SUPPORT_ESCALATION` |
| `status` | `OPEN`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `WAITING_INTERNAL`, `WAITING_ITSI_MOBILE`, `RESOLVED`, `CANCELLED` |
| `priority` | `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| `accountId` | Required FK → `BusinessAccount` |
| `serviceType` / `serviceId` | Optional MOBILE / BROADBAND / ENERGY link |
| `ticketId` | Optional FK → `BusinessTicket` |
| `wholesaleLinkId` | Optional FK → `ItsiMobileWholesaleServiceLink` |
| `assignedToStaffUserId` | Optional staff owner |
| `dueAt` / `slaBreachedAt` / `completedAt` | SLA lifecycle |
| `source` | `STAFF`, `PORTAL`, `WHOLESALE_BRIDGE`, `SYSTEM` |
| `title`, `description`, `internalNotes` | Staff-facing content |

`BusinessWorkItemComment` — staff-only internal comments (not portal-visible).

## SLA policy

Implemented in `@itsi-business/core` (`sla-policy.ts`).

| Priority | Target (v1 simplification) |
|----------|----------------------------|
| URGENT | 4 hours |
| HIGH | 1 business day (8h) |
| NORMAL | 3 business days |
| LOW | 5 business days |

SLA statuses: `ON_TRACK`, `DUE_SOON` (within 4h of due), `BREACHED`, `COMPLETED`.

Business-day logic is intentionally simplified for v1 (documented; no holiday calendar yet).

## API routes

Prefix: `/api/v1/work-items`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/stats` | `work_items.read` |
| GET | `/` | `work_items.read` |
| POST | `/` | `work_items.write` |
| GET | `/:id` | `work_items.read` |
| PATCH | `/:id` | `work_items.write` |
| POST | `/:id/assign` | `work_items.assign` |
| POST | `/:id/start` | `work_items.write` |
| POST | `/:id/resolve` | `work_items.resolve` |
| POST | `/:id/cancel` | `work_items.resolve` |
| POST | `/:id/comment` | `work_items.comment` |

Filters: `status`, `priority`, `type`, `serviceType`, `accountId`, `ticketId`, `assignedToMe`, `unassigned`, `breached`, `dueSoon`.

RBAC: JWT now includes flattened `permissions[]` from `StaffRole.permissions`. Platform realm and `PLATFORM_ADMIN` bypass all checks.

## Automatic work item creation

| Event | Type | Source | Dedup key |
|-------|------|--------|-----------|
| Wholesale order requested | `WHOLESALE_ORDER` | `WHOLESALE_BRIDGE` | type + serviceId + wholesaleLinkId |
| Wholesale status warning/failure on refresh | `WHOLESALE_STATUS_REVIEW` | `WHOLESALE_BRIDGE` | type + wholesaleLinkId |
| Portal product enquiry | `PRODUCT_ENQUIRY` | `PORTAL` | type + ticketId |
| Portal service / general / SIM support ticket | `CUSTOMER_SERVICE_REQUEST` | `PORTAL` | type + ticketId |
| Portal energy review request | `ENERGY_REVIEW` | `PORTAL` | type + ticketId |
| Portal SIM label/cost centre update | `SIM_METADATA_CHANGE` | `PORTAL` | type + serviceId |
| Energy renewal window | `ENERGY_REVIEW` | `SYSTEM` | type + serviceId |

No duplicate open work items for the same type + entity combination.

## Staff UI

**Workspace:** Services (`apps/services`)

| Route | Purpose |
|-------|---------|
| `/work-queue` | Dashboard + filtered list |
| `/work-queue/[id]` | Detail, assign, resolve, internal comments |

Nav: **Services → Work Queue**

## Desk integration

`GET /api/v1/tickets/:id` includes `workItems[]` on the ticket payload.

Desk ticket detail sidebar links to Services work item detail. Customer thread remains in Desk; internal work item comments remain staff-only.

## Portal boundary

Portal routes **do not** expose work items, SLA state, or work item IDs.

Portal users see only:

- Customer-safe tickets and threads
- Customer-safe service status labels
- Customer-safe energy wording

## Wholesale dependency boundary

- Work items are created when wholesale orders succeed or when status refresh surfaces staff warnings.
- Phase 14 does **not** call live Itsi Mobile unless `ITSI_MOBILE_WHOLESALE_ENABLED=true` (existing gate).
- `WHOLESALE_STATUS_REVIEW` shows staff warnings only — no auto-cancel/cease of retail services, no raw provider payloads.

Manual staff actions on work items: assign, start, resolve, comment, link to CRM/Desk/service records.

## What remains blocked until 13B-2

- Live network execution controls
- Customer-triggered provider actions
- Production wholesale E2E sign-off

13B-1 simulated verification **allows** this staff workflow foundation to proceed in parallel.

## Validation

```bash
pnpm --filter @itsi-business/api type-check
pnpm --filter @itsi-business/services type-check
pnpm --filter @itsi-business/desk type-check
pnpm --filter @itsi-business/api test
node scripts/check-wiring.mjs
```

SLA unit tests: `pnpm --filter @itsi-business/api test:sla`

Simulated wholesale tests still require valid `DATABASE_URL` for DB-backed cases.
