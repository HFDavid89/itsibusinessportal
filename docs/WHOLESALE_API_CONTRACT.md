# Itsi Mobile Wholesale API Contract

> Target contract for the Itsi Mobile partner wholesale API.
> Itsi Business consumes this contract via `itsi-mobile-client.ts`.
> Itsi Mobile must implement these routes before end-to-end fulfilment is proven.

## Principles

- Mobile and Broadband use **separate route families** — do not collapse into one generic order endpoint.
- Escalations are shared but **require `serviceType`** in the payload.
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
  "orderId": "optional",
  "businessServiceReference": "required",
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

### Mobile quote payload

```json
{
  "productCode": "optional",
  "contractTermMonths": "optional",
  "simType": "optional",
  "simQuantity": "optional",
  "userCount": "optional"
}
```

### Mobile order payload

```json
{
  "businessAccountId": "required",
  "businessServiceReference": "required",
  "quoteId": "optional",
  "productCode": "optional",
  "contractTermMonths": "optional",
  "simType": "optional",
  "simQuantity": "optional",
  "contactName": "optional",
  "contactPhone": "optional",
  "contactEmail": "optional",
  "notes": "optional"
}
```

### Reserved mobile fields (not implemented until supported)

`pac`, `stac`, `portingDate`, `spendCapPence`, `roamingEnabled`, `internationalBarred`, `replacementSim`

## Broadband

| Method | Path |
|--------|------|
| GET | `/api/v1/wholesale/availability/broadband?postcode=&uprn=` |
| GET | `/api/v1/wholesale/products/broadband` |
| POST | `/api/v1/wholesale/quotes/broadband` |
| POST | `/api/v1/wholesale/orders/broadband` |
| GET | `/api/v1/wholesale/orders/broadband/:id` |
| GET | `/api/v1/wholesale/orders/broadband/:id/status` |

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

### Broadband order payload

```json
{
  "businessAccountId": "required",
  "businessServiceReference": "required",
  "quoteId": "optional",
  "postcode": "required",
  "uprn": "optional",
  "productCode": "optional",
  "accessTechnology": "optional",
  "installContactName": "optional",
  "installContactPhone": "optional",
  "installContactEmail": "optional",
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

- `Authorization: Bearer <ITSI_MOBILE_WHOLESALE_API_KEY>`
- `X-Client: itsi-business`

## Deprecated generic routes (Itsi Business backwards compat only)

Itsi Mobile should **not** implement these as primary endpoints:

- `GET /api/v1/wholesale/availability` → use broadband-specific path
- `POST /api/v1/wholesale/quotes` → use family paths
- `POST /api/v1/wholesale/orders` → use family paths
- `GET /api/v1/wholesale/orders/:id` → use family paths

Itsi Business staff routes still expose deprecated aliases that route internally to family-specific upstream paths.
