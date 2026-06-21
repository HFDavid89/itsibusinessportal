# Phase 7 — Business Service Catalogue and Retail Service Records

## Overview

Phase 7 introduces Itsi Business's own retail service catalogue and retail service records.  
This is a **purely internal** record-keeping layer. No external provider APIs are called.

---

## Hard exclusions (never violate)

- No calls to Gamma, KCOM, MS3, or OTS Hero APIs.
- No calls to the Itsi Mobile wholesale API at this phase.
- `ItsiMobileWholesaleServiceLink` is a **local placeholder reference only** — its fields store IDs for future human-mediated reconciliation.
- No consumer/residential signup or SIM ordering.
- No live billing or payment collection.

---

## New Prisma models

### `BusinessServiceCatalogueItem`

Itsi Business's retail product catalogue. One record per sellable product.

| Field | Type | Notes |
|---|---|---|
| `sku` | String (unique) | Auto-generated `{TYPE}-{RAND6}` if not supplied |
| `name` | String | Customer-facing product name |
| `serviceType` | Enum | `MOBILE \| BROADBAND \| ENERGY \| SOFTWARE \| SUPPORT \| OTHER` |
| `status` | Enum | `ACTIVE \| INACTIVE \| ARCHIVED` |
| `retailPricePence` | Int | Stored as integer pence (e.g. 2999 = £29.99) |
| `wholesaleCostEstimatePence` | Int? | Internal cost estimate — never fetched from provider |
| `setupFeePence` | Int? | One-off setup charge |
| `contractTermMonths` | Int? | e.g. 12, 24, 36 |
| `taxRate` | Float | Default 20.0 (%) |
| `marginPolicy` | String? | Internal note only |

### `BusinessMobileService`

Retail mobile service record owned by Itsi Business.

Key fields: `serviceReference` (auto `MOB-YYYYMM-RAND6`), `displayName`, `status`, `mobileNumber`, `simLabel`, `costCentre`, `retailPricePence`, `catalogueItemId`, `wholesaleServiceLinkId`.

### `BusinessBroadbandService`

Retail broadband service record. Must have a `siteId` and `postcode`.

Key fields: `serviceReference` (auto `BB-YYYYMM-RAND6`), `displayName`, `status`, `accessTechnology`, `uprn`, `circuitLabel`, `postcode`, `retailPricePence`.

### `BusinessEnergyService`

Retail energy service record. Must have a `siteId` and `fuelType`.

Key fields: `serviceReference` (auto `ENE-YYYYMM-RAND6`), `displayName`, `status`, `fuelType` (`ELECTRICITY \| GAS \| DUAL_FUEL`), `meterPointReference`, `retailPriceDescription`.

### `ItsiMobileWholesaleServiceLink`

Local placeholder linking a retail service to a future Itsi Mobile wholesale order.  
**RULE: This record is created locally. The Itsi Mobile wholesale API is NEVER called.**

Key fields: `businessServiceType`, `businessServiceReference`, `itsiMobileWholesaleOrderId` (placeholder), `safeProviderReference` (placeholder), `status` (`PLACEHOLDER \| PENDING \| ACTIVE \| CEASED`).

---

## API routes

All routes are prefixed `/api/v1/`.

### Catalogue (`/api/v1/services/catalogue`)

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/` | `services.catalogue.read` | List with filters: `serviceType`, `status`, `search`, `page`, `limit` |
| GET | `/:id` | `services.catalogue.read` | Single item with `_count` of linked services |
| POST | `/` | `services.catalogue.write` | Create — auto-generates SKU if not supplied |
| PATCH | `/:id` | `services.catalogue.write` | Update mutable fields |
| POST | `/:id/archive` | `services.catalogue.write` | Archive — sets status ARCHIVED, refuses if already archived |

### Services (`/api/v1/services`)

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/` | `services.records.read` | Aggregate list of mobile + broadband + energy, with `_serviceType` discriminator |
| GET | `/:id` | `services.records.read` | Universal lookup — tries all three tables |
| POST | `/mobile` | `services.records.write` | Create mobile service record |
| PATCH | `/mobile/:id` | `services.records.write` | Update mobile service record |
| POST | `/broadband` | `services.records.write` | Create broadband service record |
| PATCH | `/broadband/:id` | `services.records.write` | Update broadband service record |
| POST | `/energy` | `services.records.write` | Create energy service record |
| PATCH | `/energy/:id` | `services.records.write` | Update energy service record |
| GET | `/:id/wholesale-link` | `services.wholesale_links.read` | Get wholesale link placeholder (null if none) |
| POST | `/:id/wholesale-link-placeholder` | `services.wholesale_links.write` | Create local placeholder — NEVER calls Itsi Mobile |

---

## Frontend app (`apps/services`, port 4010)

| Route | Description |
|---|---|
| `/` | Dashboard — stat cards + catalogue snapshot + recent records |
| `/catalogue` | Catalogue list — type tabs, search, pagination, inline archive |
| `/catalogue/new` | Create catalogue item form |
| `/catalogue/[id]` | Catalogue item detail + inline edit form + archive action |
| `/records` | Service records list — type tabs (mobile/broadband/energy), search, pagination |
| `/records/new` | Create service form — mobile/broadband/energy type selector |
| `/records/[id]` | Service record detail — type-specific fields, inline edit, wholesale link |

---

## RBAC permissions added

| Permission | Scope |
|---|---|
| `services.catalogue.read` | List and view catalogue items |
| `services.catalogue.write` | Create, update, archive catalogue items |
| `services.records.read` | List and view mobile, broadband, energy service records |
| `services.records.write` | Create and update service records |
| `services.wholesale_links.read` | View wholesale link placeholder |
| `services.wholesale_links.write` | Create wholesale link placeholder |

---

## Timeline events written

- `CATALOGUE_ITEM_CREATED`
- `CATALOGUE_ITEM_UPDATED`
- `CATALOGUE_ITEM_ARCHIVED`
- `MOBILE_SERVICE_CREATED`
- `MOBILE_SERVICE_UPDATED`
- `BROADBAND_SERVICE_CREATED`
- `BROADBAND_SERVICE_UPDATED`
- `ENERGY_SERVICE_CREATED`
- `ENERGY_SERVICE_UPDATED`
- `WHOLESALE_LINK_PLACEHOLDER_CREATED`

---

## Workspace config

- **Key**: `services`
- **Port**: `17010`
- **Env var**: `NEXT_PUBLIC_SERVICES_URL` (default `http://localhost:17010`)
- **Dev script**: `pnpm dev:services` or included in root `pnpm dev`
