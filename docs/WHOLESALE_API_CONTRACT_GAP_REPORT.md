# Wholesale API Contract Gap Report — Phase 13A

> Generated: Phase 13A — Itsi Mobile wholesale API contract verification
> Itsi Business repo: `HFDavid89/itsibusinessportal`
> Itsi Mobile repo: `HFDavid89/itsimobileportal` (audit pending)

## Executive summary

The Itsi Business wholesale **client is now aligned** to a Mobile/Broadband-separated partner contract. The **end-to-end flow remains unproven** until Itsi Mobile implements the matching upstream routes and Phase 13B smoke tests pass against a live or stubbed Itsi Mobile environment.

## Before Phase 13A (gap)

| Area | Previous state | Risk |
|------|----------------|------|
| Order create | Single `POST /api/v1/wholesale/orders` with `serviceType` in body | Ambiguous validation; mobile/broadband field collision as features grow |
| Order status | Single `GET /api/v1/wholesale/orders/:id/status` | Cannot route correctly if order ID namespaces differ by family |
| Quotes | Single `POST /api/v1/wholesale/quotes` | Broadband postcode requirements mixed with mobile SIM fields |
| Availability | Generic `GET /api/v1/wholesale/availability` | Not broadband-specific; no clear product-family boundary |
| Products | Not implemented | Staff cannot browse upstream wholesale catalogue |
| Escalations | Missing `serviceType` in payload | Cannot route escalation to correct fulfilment queue |
| Types | Drift between `packages/types` and inline client types | Contract ambiguity |
| Tests | None | No automated contract guard |
| Legacy client | Unused `wholesale-client.ts` with different auth/paths | Confusion for implementers |

## After Phase 14W (Itsi Business side)

| Area | Current state |
|------|---------------|
| Client | `itsi-mobile-client.ts` routes to family-specific upstream paths only |
| Attribution | `sourceOrderId`, `sourceCustomerReference`, `sourceServiceReference`, `businessServiceReference` on all orders |
| Sanitization | Forbidden reseller/retail fields stripped before upstream POST |
| Status | By-source status preferred; order-id status fallback for legacy links |
| Staff API | Family routes + `GET /orders/:family/by-source/:sourceOrderId/status` |
| Deprecated aliases | Generic staff routes kept with `X-Deprecated`; map to 14W payloads internally |
| Payload schemas | Zod: `MobileOrderBodySchema`, `BroadbandOrderBodySchema` with `SourceAttributionSchema` |
| Escalations | `serviceType`, `businessServiceReference`, optional `sourceOrderId` |
| Contract tests | Family paths, by-source paths, sanitization, no generic `/orders` in forward contract |
| Docs | Phase 14W `WHOLESALE_API_CONTRACT.md`, dependency doc, 13B checklist |

## Remaining gaps (Itsi Mobile staging verification for 13B)

These must be verified or implemented in **Itsi Mobile** before Phase 13B:

| Endpoint | Status in Itsi Business client | Itsi Mobile verification needed |
|----------|-------------------------------|----------------------------------|
| `GET /api/v1/wholesale/products/mobile` | Client ready | **Unknown** |
| `GET /api/v1/wholesale/products/broadband` | Client ready | **Unknown** |
| `GET /api/v1/wholesale/availability/broadband` | Client ready | **Unknown** |
| `POST /api/v1/wholesale/quotes/mobile` | Client ready | **Unknown** |
| `POST /api/v1/wholesale/quotes/broadband` | Client ready | **Unknown** |
| `POST /api/v1/wholesale/orders/mobile` | Client ready | **Unknown** — likely still generic `/orders` today |
| `POST /api/v1/wholesale/orders/broadband` | Client ready | **Unknown** |
| `GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status` | Client ready | **Verify on staging** |
| `GET /api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status` | Client ready | **Verify on staging** |
| `POST /api/v1/wholesale/escalations` + `serviceType` + `businessServiceReference` | Client ready | **Verify on staging** |

## Recommended Phase 13B smoke test matrix

1. Health ping with valid API key
2. Mobile product list (or graceful 501 if not ready)
3. Broadband availability for known postcode
4. Mobile order create from staff service record → status poll
5. Broadband order create (postcode required) → status poll
6. Escalation with `serviceType: MOBILE` and `serviceType: BROADBAND`
7. Disabled API (`ITSI_MOBILE_WHOLESALE_ENABLED=false`) returns 503
8. Unauthorised API key returns 401/403 without provider leakage

## Decision

**Separate Mobile/Broadband endpoints now** — confirmed. Generic `/orders` with body `serviceType` is deprecated on the Itsi Business side and must not be the primary Itsi Mobile contract going forward.
