/**
 * Energy account tracking statuses and customer-safe labels.
 * Energy is CRM-managed referral/renewal tracking — not supplier fulfilment.
 */

export const ENERGY_TRACKING_STATUSES = [
  'PROSPECT',
  'REFERRED_TO_FIDELITY',
  'QUOTE_IN_PROGRESS',
  'CONTRACTED',
  'RENEWAL_DUE',
  'LOST',
  'CEASED',
] as const;

export type EnergyTrackingStatus = typeof ENERGY_TRACKING_STATUSES[number];

export const ENERGY_FUEL_TYPES = ['ELECTRICITY', 'GAS', 'DUAL_FUEL'] as const;

export const STAFF_ENERGY_STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  REFERRED_TO_FIDELITY: 'Referred to Fidelity',
  QUOTE_IN_PROGRESS: 'Quote in progress',
  CONTRACTED: 'Contracted',
  RENEWAL_DUE: 'Renewal due',
  LOST: 'Lost',
  CEASED: 'Ceased',
};

/** Customer-safe labels — no internal referral diagnostics. */
export const PORTAL_ENERGY_STATUS_LABELS: Record<string, string> = {
  PROSPECT: 'Under review',
  REFERRED_TO_FIDELITY: 'Referral in progress',
  QUOTE_IN_PROGRESS: 'Quote in progress',
  CONTRACTED: 'Active contract',
  RENEWAL_DUE: 'Renewal review due',
  LOST: 'No longer active',
  CEASED: 'Ceased',
};

export const RENEWAL_WINDOW_DAYS_DEFAULT = 180;

export const ENERGY_REFERRAL_IN_PROGRESS = new Set([
  'REFERRED_TO_FIDELITY',
  'QUOTE_IN_PROGRESS',
]);

export const ENERGY_ACTIVE_STATUSES = new Set(['CONTRACTED', 'RENEWAL_DUE']);

export function toPortalEnergyStatusLabel(status: string): string {
  return PORTAL_ENERGY_STATUS_LABELS[status] ?? 'Under review';
}

export function toStaffEnergyStatusLabel(status: string): string {
  return STAFF_ENERGY_STATUS_LABELS[status] ?? status;
}

export function computeRenewalWindowStart(contractEndDate: Date): Date {
  const d = new Date(contractEndDate);
  d.setDate(d.getDate() - RENEWAL_WINDOW_DAYS_DEFAULT);
  return d;
}

export function computeNextCheckInDate(from: Date, cadenceDays: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + cadenceDays);
  return d;
}

export function isRenewalDue(contractEndDate: Date | null | undefined, withinDays: number): boolean {
  if (!contractEndDate) return false;
  const now = new Date();
  const end = new Date(contractEndDate);
  const limit = new Date();
  limit.setDate(limit.getDate() + withinDays);
  return end >= now && end <= limit;
}

export function isCheckInDue(nextCheckInDate: Date | null | undefined): boolean {
  if (!nextCheckInDate) return false;
  return new Date(nextCheckInDate) <= new Date();
}
