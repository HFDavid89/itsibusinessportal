# Fidelity Energy Integration Discovery

> Energy fulfilment for Itsi Business uses **Fidelity Energy** — not the Itsi Mobile wholesale bridge.
> Public Fidelity Energy API documentation was not found at the start of Phase 11.
> **Do not implement live API calls** until Fidelity confirms documentation and credentials.

## Architecture boundary

| Service type | Integration |
|--------------|-------------|
| Mobile / Broadband | Itsi Mobile wholesale bridge (Phase 8–10) |
| Energy | Fidelity Energy integration bridge (Phase 11 readiness, Phase 12A live) |

**Hard rules:**

- Do not put Fidelity Energy inside `itsi-mobile-client.ts`
- Do not route energy orders through Itsi Mobile wholesale endpoints
- Do not expose Fidelity internals or supplier references to the customer portal unless explicitly approved as customer-safe

## What to ask Fidelity Energy

### API and developer access

- [ ] API / developer documentation (OpenAPI/Swagger, PDF, or portal)
- [ ] Authentication method (API key, OAuth, mutual TLS, IP allowlist)
- [ ] Test / sandbox environment URL and credentials
- [ ] Production environment onboarding process
- [ ] Rate limits and throttling policy
- [ ] Webhook support (order status, quote expiry, contract events)

### Functional APIs

- [ ] Quote API (MPAN/MPRN, postcode, consumption, contract term)
- [ ] Contract / order submission API
- [ ] Order status / lifecycle API
- [ ] Meter / MPAN / MPRN lookup or validation API
- [ ] Customer / account creation rules (who owns the supply account?)
- [ ] Escalation / support API or process

### Security and data protection

- [ ] Data protection and security requirements (GDPR, retention, encryption)
- [ ] Allowed customer-facing fields (what may appear in the business portal?)
- [ ] PCI or billing data boundaries
- [ ] Incident / breach notification process

### Operations

- [ ] Support and escalation contacts
- [ ] SLA for quote turnaround and order provisioning
- [ ] Error code catalogue and retry guidance
- [ ] Idempotency requirements for order submission

## Environment placeholders (Phase 11)

```env
FIDELITY_ENERGY_ENABLED=false
FIDELITY_ENERGY_API_BASE_URL=
FIDELITY_ENERGY_API_KEY=
FIDELITY_ENERGY_TIMEOUT_MS=10000
FIDELITY_ENERGY_RETRY_ATTEMPTS=3
```

Client location: `apps/api/src/services/energy/fidelity-energy-client.ts`

Staff status route: `GET /api/v1/energy-integrations/status`

## API documentation checklist

Before Phase 12A (live integration), confirm for each endpoint:

1. HTTP method and path
2. Request schema (required vs optional fields)
3. Response schema and status codes
4. Authentication headers
5. Idempotency key support
6. Sandbox vs production differences
7. Example requests and responses from Fidelity

## Open decisions

| Decision | Options | Status |
|----------|---------|--------|
| Quote-first vs order-first flow | Staff quote → customer accept → submit | Open |
| Portal energy self-service | View only / request quote / full order | Deferred — portal shows services + coming soon |
| Energy link model | New `FidelityEnergyServiceLink` table vs extend retail record | Open for Phase 12A |
| Status sync | Poll vs webhook | Depends on Fidelity capability |
| MPAN/MPRN validation | Pre-submit validation API vs manual staff check | Open |

## Customer-visible field approval

Until Fidelity confirms allowed fields, the portal must show:

- Service display name, fuel type, meter reference (if business-owned)
- Customer-safe status labels only (`Preparing`, `Active`, etc.)
- “Energy quote/order support coming soon” — not fake live integration

Must **not** show:

- Fidelity internal order IDs (unless approved)
- Supplier contract references
- Raw upstream status codes or diagnostics

## Phase 12A entry criteria

Proceed to live Fidelity integration only when:

1. Written API documentation received
2. Sandbox credentials and base URL confirmed
3. Quote and order endpoint shapes validated
4. Security review complete
5. Customer-visible field list approved by Fidelity

Otherwise proceed with **Phase 12B** (portal product management / SIM fleet controls).
