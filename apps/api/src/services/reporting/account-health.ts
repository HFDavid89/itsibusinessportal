export type AccountHealthTier = 'healthy' | 'watch' | 'at_risk' | 'needs_attention';

export interface AccountHealthSignals {
  accountStatus: string;
  openTickets: number;
  overdueInvoiceCount: number;
  overdueBalancePence: number;
  breachedWorkItems: number;
  dueSoonWorkItems: number;
  activeServices: number;
  energyRenewalsDue: number;
  openProductEnquiries: number;
  contactCount: number;
  siteCount: number;
}

export interface AccountHealthResult {
  tier: AccountHealthTier;
  score: number;
  label: string;
}

export function classifyAccountHealth(signals: AccountHealthSignals): AccountHealthResult {
  let score = 100;

  if (signals.accountStatus === 'SUSPENDED') score -= 35;
  else if (signals.accountStatus === 'CLOSED') score -= 50;
  else if (signals.accountStatus === 'PROSPECT') score -= 8;

  if (signals.contactCount === 0) score -= 12;
  if (signals.siteCount === 0) score -= 8;

  if (signals.openTickets > 0) score -= Math.min(20, signals.openTickets * 6);
  if (signals.overdueInvoiceCount > 0) score -= Math.min(30, signals.overdueInvoiceCount * 12);
  if (signals.overdueBalancePence > 0) score -= Math.min(15, Math.floor(signals.overdueBalancePence / 10000));
  if (signals.breachedWorkItems > 0) score -= Math.min(25, signals.breachedWorkItems * 10);
  if (signals.dueSoonWorkItems > 0) score -= Math.min(10, signals.dueSoonWorkItems * 3);
  if (signals.openProductEnquiries > 0) score -= Math.min(10, signals.openProductEnquiries * 5);
  if (signals.energyRenewalsDue > 0) score -= Math.min(12, signals.energyRenewalsDue * 6);

  if (signals.accountStatus === 'ACTIVE' && signals.activeServices === 0) score -= 10;

  score = Math.max(0, Math.min(100, score));

  if (score >= 75) return { tier: 'healthy', score, label: 'Healthy' };
  if (score >= 55) return { tier: 'watch', score, label: 'Watch' };
  if (score >= 35) return { tier: 'at_risk', score, label: 'At risk' };
  return { tier: 'needs_attention', score, label: 'Needs attention' };
}
