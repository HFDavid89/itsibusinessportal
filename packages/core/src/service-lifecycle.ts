/**
 * Shared service lifecycle rules, status labels, and transition guards.
 * Used by API (staff + portal) and frontend workspaces.
 */

export const RETAIL_STATUSES_MOBILE_BB = [
  'DRAFT', 'REQUESTED', 'ACTIVE', 'SUSPENDED', 'CEASED', 'CANCELLED',
] as const;

export const RETAIL_STATUSES_ENERGY = [
  'DRAFT', 'ACTIVE', 'SUSPENDED', 'CEASED',
] as const;

export const WHOLESALE_LINK_STATUSES = [
  'PLACEHOLDER', 'PENDING', 'ACTIVE', 'CEASED',
] as const;

export type RetailStatusMobileBb = typeof RETAIL_STATUSES_MOBILE_BB[number];
export type RetailStatusEnergy = typeof RETAIL_STATUSES_ENERGY[number];
export type WholesaleLinkStatus = typeof WHOLESALE_LINK_STATUSES[number];

export type LifecycleEventSource = 'STAFF' | 'ITSI_MOBILE' | 'SYSTEM' | 'FIDELITY_ENERGY';

/** Customer-safe labels — never expose wholesale diagnostics or raw upstream status. */
export const PORTAL_RETAIL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Preparing',
  REQUESTED: 'Order in progress',
  ACTIVE: 'Active',
  SUSPENDED: 'Temporarily suspended',
  CEASED: 'Ceased',
  CANCELLED: 'Cancelled',
};

/** Staff-facing retail status labels (internal enum preserved in data). */
export const STAFF_RETAIL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  REQUESTED: 'Requested',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CEASED: 'Ceased',
  CANCELLED: 'Cancelled',
};

export const STAFF_WHOLESALE_LINK_STATUS_LABELS: Record<string, string> = {
  PLACEHOLDER: 'Placeholder',
  PENDING: 'Pending fulfilment',
  ACTIVE: 'Fulfilled',
  CEASED: 'Ceased',
};

const UPSTREAM_FAILURE = new Set(['CANCELLED', 'REJECTED', 'FAILED']);

/** Retail statuses that block wholesale order requests. */
export const BLOCKED_WHOLESALE_ORDER_STATUSES = new Set(['CEASED', 'CANCELLED', 'SUSPENDED']);

/** Retail statuses eligible for wholesale order request. */
export const ORDERABLE_WHOLESALE_STATUSES = new Set(['DRAFT', 'REQUESTED']);

/** Upstream statuses that explicitly allow retail ACTIVE promotion. */
export const SAFE_ACTIVE_UPSTREAM = new Set(['ACTIVE', 'COMPLETED', 'LIVE', 'PROVISIONED']);

/** Staff-initiated transitions allowed (manual edit). All others blocked for automation. */
const STAFF_ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
  DRAFT: new Set(['DRAFT', 'REQUESTED', 'ACTIVE', 'CANCELLED']),
  REQUESTED: new Set(['REQUESTED', 'ACTIVE', 'SUSPENDED', 'CANCELLED']),
  ACTIVE: new Set(['ACTIVE', 'SUSPENDED', 'CEASED']),
  SUSPENDED: new Set(['SUSPENDED', 'ACTIVE', 'CEASED', 'CANCELLED']),
  CEASED: new Set(['CEASED']),
  CANCELLED: new Set(['CANCELLED']),
};

export function toPortalStatusLabel(status: string): string {
  return PORTAL_RETAIL_STATUS_LABELS[status] ?? 'In progress';
}

export function toStaffRetailStatusLabel(status: string): string {
  return STAFF_RETAIL_STATUS_LABELS[status] ?? status;
}

export function toStaffWholesaleLinkStatusLabel(status: string): string {
  return STAFF_WHOLESALE_LINK_STATUS_LABELS[status] ?? status;
}

export function isStaffRetailTransitionAllowed(from: string, to: string): boolean {
  return STAFF_ALLOWED_TRANSITIONS[from]?.has(to) ?? false;
}

/** Automated transitions must never cease/cancel retail from upstream without staff action. */
export function canAutomateRetailTransition(_from: string, to: string): boolean {
  if (to === 'CEASED' || to === 'CANCELLED') return false;
  if (to === 'SUSPENDED') return false;
  return to === 'REQUESTED' || to === 'ACTIVE';
}

export function isUpstreamFailureStatus(upstreamStatus: string): boolean {
  return UPSTREAM_FAILURE.has(upstreamStatus.toUpperCase());
}

export function getStaffWarningForUpstream(upstreamStatus: string): string | null {
  const s = upstreamStatus.toUpperCase();
  if (s === 'FAILED') return 'Wholesale fulfilment reported a failure. Review the order with Itsi Mobile before changing the retail service.';
  if (s === 'REJECTED') return 'Wholesale order was rejected upstream. Staff review required — retail service has not been cancelled automatically.';
  if (s === 'CANCELLED') return 'Wholesale order was cancelled upstream. Retail service remains unchanged until staff confirms next steps.';
  return null;
}

export function getSuggestedActionForUpstream(
  upstreamStatus: string,
  options: { hasWholesaleLink: boolean; retailStatus: string },
): string | null {
  const s = upstreamStatus.toUpperCase();
  if (isUpstreamFailureStatus(s)) {
    return 'Contact Itsi Mobile support or raise an escalation. Do not cancel the retail record automatically.';
  }
  if (SAFE_ACTIVE_UPSTREAM.has(s) && options.retailStatus !== 'ACTIVE') {
    return 'Refresh status again or confirm activation criteria before promoting retail to Active.';
  }
  if (['PENDING', 'REQUESTED', 'SUBMITTED', 'IN_PROGRESS', 'PROCESSING'].includes(s)) {
    return options.hasWholesaleLink ? 'Wait for provisioning or refresh status later.' : 'Submit a wholesale order request when ready.';
  }
  return null;
}

export interface ServiceLifecycleEventMeta {
  serviceId?: string;
  serviceReference?: string;
  businessServiceType?: string;
  previousStatus?: string;
  newStatus?: string;
  source: LifecycleEventSource;
  safeExternalReference?: string;
  reason?: string;
  upstreamStatus?: string;
  staffWarning?: string;
  orderId?: string;
  linkId?: string;
}
