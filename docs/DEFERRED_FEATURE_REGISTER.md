# Deferred Feature Register

> Itsi Business Platform — intentionally deferred capabilities  
> Last updated: Phase 16 closeout (post `5c738bb`)

This register documents features that are **not missing by accident**. Each item is blocked, out of scope, or awaiting an external dependency. UI must not present these as fake working controls.

---

## Live network / SIM controls (13B-2 blocked)

| Feature | Reason deferred | Dependency | Customer visibility | Staff visibility | Safe alternative | Unlock condition |
|---------|-----------------|------------|---------------------|------------------|------------------|----------------|
| SIM barring / unbarring | Live network API not validated in staging E2E | Itsi Mobile 13B-2 wholesale bridge | Disabled buttons with support-ticket CTA | Staff wholesale panel shows status only | Raise support ticket | 13B-2 real staging E2E pass |
| SIM swap | Same | 13B-2 | Portal: disabled + ticket CTA | Services wholesale panel | Support ticket / work item | 13B-2 E2E |
| Roaming toggle | Same | 13B-2 | Portal: disabled + ticket CTA | — | Support ticket | 13B-2 E2E |
| Spend cap change | Same | 13B-2 | Portal: disabled + ticket CTA | — | Support ticket | 13B-2 E2E |
| PAC / STAC execution | Same | 13B-2 | Portal: disabled + ticket CTA | — | Support ticket | 13B-2 E2E |
| Replacement SIM | Same | 13B-2 | Portal: disabled + ticket CTA | Wholesale order request (staff) | Support ticket | 13B-2 E2E |
| Tariff change | Same | 13B-2 | Portal: disabled + ticket CTA | — | Support ticket | 13B-2 E2E |
| Customer-triggered provider actions | Boundary rule — portal must not call provider APIs | Platform architecture | Never | Never | Ticket-based requests | 13B-2 + policy review |

---

## Payments and documents

| Feature | Reason deferred | Dependency | Customer visibility | Staff visibility | Safe alternative | Unlock condition |
|---------|-----------------|------------|---------------------|------------------|------------------|----------------|
| Online card payment | Payment processor not integrated | Stripe/GoCardless decision + PCI scope | Explicit defer message on invoice detail | Manual mark-paid workflow | Payment instructions panel (BACS/cheque) | Payment integration phase |
| Invoice PDF download | PDF template engine not built | Template design + generation service | No PDF button | No PDF button | View invoice in browser; staff email offline | PDF generation phase |
| Automated payment reminders | No payment gateway + email campaign tooling | Payment + comms integration | — | — | Staff follow-up via CRM/billing | Post-payment integration |

---

## Wholesale / provider integration

| Feature | Reason deferred | Dependency | Customer visibility | Staff visibility | Safe alternative | Unlock condition |
|---------|-----------------|------------|---------------------|------------------|------------------|----------------|
| Wholesale billing reconciliation | Itsi Mobile wholesale billing not production-real | Itsi Mobile 13B-2 billing E2E | Never | Billing dashboard "Deferred" panel | Manual retail invoicing | `ITSI_MOBILE_WHOLESALE_BILLING_ENABLED` + E2E |
| Live wholesale escalation API | Escalation route records locally only | `ITSI_MOBILE_WHOLESALE_ENABLED` + 13B-2 | Never | Desk escalation panel (Deferred badge) | Local escalation record + work item | 13B-2 E2E |
| Raw provider payload display | Security/boundary rule | — | Never | Never | Sanitized wholesale link status | N/A — permanently blocked in UI |
| Wholesale cost on invoice lines | Reconciliation deferred | Wholesale billing E2E | Never | Staff-only internal cost ref field (optional) | Retail line items only in portal | Wholesale billing phase |
| Auto retail cease on upstream warning | Policy — must not auto-cancel on provider warnings | Operational policy | Never | Staff review work items | Manual staff decision | Policy + 13B-2 |

---

## Energy (Fidelity)

| Feature | Reason deferred | Dependency | Customer visibility | Staff visibility | Safe alternative | Unlock condition |
|---------|-----------------|------------|---------------------|------------------|------------------|----------------|
| Fidelity Energy live API | Manual referral workflow in place | `FIDELITY_ENERGY_API_BASE_URL` + contract | Portal: status labels only | Energy tracking panel (manual actions) | Mark referred / check-in / lost (staff) | Fidelity API integration phase |
| Energy supplier billing | Energy is referral/commission model, not supply billing | Business model decision | Never | Never | Manual commission tracking if needed | Business decision |
| Automated energy renewal quotes | No live supplier API | Fidelity integration | Renewal due labels in portal | Energy review work items | Staff energy review workflow | Fidelity API phase |

---

## Admin / platform configuration

| Feature | Reason deferred | Dependency | Customer visibility | Staff visibility | Safe alternative | Unlock condition |
|---------|-----------------|------------|---------------------|------------------|------------------|----------------|
| Admin settings UI | Insufficient settings to justify full UI; many env-managed | Platform maturity | Never | `DeferredSettingsPanel` lists env vs UI-deferred | Environment variables + status pages | Settings UI phase |
| Staff role permission matrix editor | RBAC exists in DB; no editor UI | Admin UX phase | Never | Fixed roles via seed/migration | API-level RBAC | Admin settings phase |
| SLA policy configuration UI | SLA calculated in code | Work queue maturity | Never | Fixed SLA rules in `@itsi-business/core` | Default priority-based due times | SLA config phase |
| Multi-tenant branding | Single-tenant per deployment | Not applicable to Itsi Business | Never | Never | Static branding | N/A |

---

## Order tracking

| Feature | Reason deferred | Dependency | Customer visibility | Staff visibility | Safe alternative | Unlock condition |
|---------|-----------------|------------|---------------------|------------------|------------------|----------------|
| Dedicated order tracking page | Service detail covers lifecycle adequately | 13B-2 for richer status | — | Service detail wholesale panel | Integrated service record lifecycle | Optional post-13B-2 if needed |

---

## Portal-specific deferrals

| Feature | Reason deferred | Dependency | Customer visibility | Staff visibility | Safe alternative | Unlock condition |
|---------|-----------------|------------|---------------------|------------------|------------------|----------------|
| Company profile self-edit | Requires approval workflow design | Portal account management | Disabled in settings | CRM account edit | Contact details edit allowed | Portal account phase |
| Work items / SLA in portal | Staff-only operational data | Boundary rule | Never | Full work queue in Services app | Support tickets | N/A — permanent boundary |
| Wholesale/provider jargon in portal | Customer-safe copy required | Copy guidelines | Sanitized labels only | Full detail in staff apps | `labels.ts` + API sanitization | Ongoing copy review |

---

## References

- Phase 16 portal boundary audit: `docs/PHASE_16_PORTAL_BOUNDARY_AUDIT.md`
- Phase 16 UX audit: `docs/PHASE_16_UX_CONSISTENCY_AUDIT.md`
- Phase 15 completion: `docs/PHASE_15_ITSI_MOBILE_FEATURE_REUSE_COMPLETION.md`
