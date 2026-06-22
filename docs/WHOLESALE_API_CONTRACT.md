# Itsi Mobile Wholesale API Contract (Phase 14W)

> Forward contract for the Itsi Mobile partner wholesale API.
> Itsi Business consumes this contract via `itsi-mobile-client.ts`.
> Itsi Mobile Phase 14W (`e50d13d`) implements these family routes + reseller attribution from API key.

## Ownership

| System | Owns |
|--------|------|
| **Itsi Business** | End business customer, CRM, retail service records, retail billing, support |
| **Itsi Mobile** | Provider fulfilment, wholesale supply, wholesale account billing only |

Itsi Business **never** calls provider APIs directly. Itsi Mobile **never** owns the end customer or retail billing.

## Principles

- Mobile and Broadband use **separate route families** — do not collapse into one generic order endpoint.
- Reseller attribution (`wholesaleAccountId`, `sourceCompany`, `sourcePlatform`, retail owners) is derived from API key auth on Itsi Mobile — **clients must not send these fields**.
- Escalations are shared but **require `serviceType` and `businessServiceReference`** in the payload.
- Responses must never include raw Gamma, KCOM, MS3, OTS Hero, or provider payloads.
- `safeProviderReference` may be returned only when explicitly approved as customer/staff-safe.

## Shared

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Connectivity / version ping |
| POST | `/api/v1/wholesale/escalations` | Raise escalation (requires `serviceType`) |
| GET | `/api/v1/wholesale/escalations/:id` | Get escalation |

### Escalation request

```json
{
  "serviceType": "MOBILE" | "BROADBAND",
  "businessServiceReference": "required",
  "sourceOrderId": "optional — retail service id for correlation",
  "orderId": "optional — Itsi Mobile wholesale order id",
  "subject": "required",
  "description": "required",
  "priority": "LOW" | "NORMAL" | "HIGH" | "CRITICAL"
}
```

## Mobile

| Method | Path |
|--------|------|
| GET | `/api/v1/wholesale/products/mobile` |
| POST | `/api/v1/wholesale/quotes/mobile` |
| POST | `/api/v1/wholesale/orders/mobile` |
| GET | `/api/v1/wholesale/orders/mobile/:id` |
| GET | `/api/v1/wholesale/orders/mobile/:id/status` |
| GET | `/api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status` |

### Mobile quote payload

```json
{
  "productCode": "optional",
  "tariffCode": "optional",
  "contractTermMonths": "optional",
  "simType": "optional",
  "simQuantity": "optional",
  "userCount": "optional"
}
```

### Mobile order payload (14W attribution)

```json
{
  "sourceOrderId": "required — retail service id",
  "sourceCustomerReference": "required — e.g. account number",
  "sourceServiceReference": "required",
  "businessServiceReference": "required",
  "quoteId": "optional",
  "productCode": "optional",
  "tariffCode": "optional",
  "contractTermMonths": "optional",
  "simType": "optional",
  "simQuantity": "optional",
  "contact": { "name": "optional", "phone": "optional", "email": "optional" },
  "porting": { "pac": "optional", "stac": "optional", "portingDate": "optional" },
  "notes": "optional"
}
```

### Reserved mobile fields (not implemented until supported)

`spendCapPence`, `roamingEnabled`, `internationalBarred`, `replacementSim`

## Broadband

| Method | Path |
|--------|------|
| GET | `/api/v1/wholesale/availability/broadband?postcode=&uprn=` |
| GET | `/api/v1/wholesale/products/broadband` |
| POST | `/api/v1/wholesale/quotes/broadband` |
| POST | `/api/v1/wholesale/orders/broadband` |
| GET | `/api/v1/wholesale/orders/broadband/:id` |
| GET | `/api/v1/wholesale/orders/broadband/:id/status` |
| GET | `/api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status` |

### Broadband availability query

- `postcode` — required
- `uprn` — optional

### Broadband quote payload

```json
{
  "postcode": "required",
  "uprn": "optional",
  "productCode": "optional",
  "contractTermMonths": "optional",
  "accessTechnology": "optional"
}
```

### Broadband order payload (14W attribution)

```json
{
  "sourceOrderId": "required — retail service id",
  "sourceCustomerReference": "required — e.g. account number",
  "sourceServiceReference": "required",
  "businessServiceReference": "required",
  "quoteId": "optional",
  "postcode": "required",
  "uprn": "optional",
  "address": { "line1": "optional", "line2": "optional", "city": "optional", "postcode": "required", "uprn": "optional" },
  "productCode": "optional",
  "accessTechnology": "optional",
  "installContact": { "name": "optional", "phone": "optional", "email": "optional" },
  "appointmentWindow": "optional",
  "notes": "optional"
}
```

### Reserved broadband fields (not implemented until supported)

`appointmentSlotId`, `routerRequired`, `staticIpRequired`, `installNotes`, `careLevel`, `siteContactId`

## Response contract

### Order response (create + get)

```json
{
  "orderId": "required",
  "serviceType": "MOBILE" | "BROADBAND",
  "status": "required",
  "serviceOrderId": "optional",
  "safeProviderReference": "optional",
  "message": "optional"
}
```

### Status response

```json
{
  "orderId": "required",
  "serviceType": "MOBILE" | "BROADBAND",
  "status": "required",
  "safeProviderReference": "optional",
  "lastUpdatedAt": "required ISO8601",
  "events": [{ "occurredAt": "...", "status": "...", "note": "optional safe note" }]
}
```

## Authentication

- `Authorization: Bearer <ITSI_MOBILE_WHOLESALE_API_KEY>` — binds to wholesale reseller account on Itsi Mobile
- `X-Client: itsi-business`

### Fields clients must never send upstream

`wholesaleAccountId`, `apiKeyId`, `sourceCompany`, `sourcePlatform`, `providerFacingOwner`, `retailOwner`, `retailBillingOwner`, `businessAccountId`

## Deprecated generic routes (Itsi Mobile legacy only)

Itsi Mobile may retain these for backwards compatibility; **Itsi Business does not call them**:

- `GET /api/v1/wholesale/availability` → use broadband-specific path
- `POST /api/v1/wholesale/quotes` → use family paths
- `POST /api/v1/wholesale/orders` → use family paths
- `GET /api/v1/wholesale/orders/:id` → use family paths

Itsi Business staff routes still expose deprecated aliases that map legacy bodies to 14W attribution and route internally to family-specific upstream paths.
