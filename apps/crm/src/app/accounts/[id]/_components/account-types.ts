import type { BusinessAccount, BusinessInvoice, BusinessService } from '../../../../lib/api';

export type AccountTab = 'overview' | 'contacts' | 'sites' | 'invoices' | 'services' | 'energy' | 'timeline';

export interface AccountOverviewData {
  invoices: BusinessInvoice[];
  services: BusinessService[];
  timelineCount: number;
  recentTimeline: Array<{ id: string; type: string; occurredAt: string }>;
}

export interface HealthLabel {
  label: string;
  color: string;
}

const HEALTH_BADGES = {
  healthy: 'bg-success/15 text-success border-success/30',
  good: 'bg-accent/15 text-accent border-accent/30',
  attention: 'bg-warning/15 text-warning border-warning/30',
  critical: 'bg-danger/15 text-danger border-danger/30',
  neutral: 'bg-muted/15 text-muted border-border',
} as const;

export function computeAccountHealth(
  account: BusinessAccount,
  overview: AccountOverviewData | null,
): { score: number; label: HealthLabel } {
  let score = 100;

  if (account.status === 'SUSPENDED') score -= 35;
  else if (account.status === 'CLOSED') score -= 50;
  else if (account.status === 'PROSPECT') score -= 8;

  const contactCount = account._count?.contacts ?? account.contacts?.length ?? 0;
  const siteCount = account._count?.sites ?? account.sites?.length ?? 0;
  if (contactCount === 0) score -= 12;
  if (siteCount === 0) score -= 8;

  const openTickets = account._count?.tickets ?? 0;
  if (openTickets > 0) score -= Math.min(20, openTickets * 8);

  const overdueCount = overview?.invoices.filter((i) => i.status === 'OVERDUE').length ?? 0;
  if (overdueCount > 0) score -= Math.min(30, overdueCount * 15);

  const serviceCount = overview?.services.length ?? (account._count?.mobileServices ?? 0) + (account._count?.broadbandServices ?? 0);
  const activeServices = overview?.services.filter((s) => s.status === 'ACTIVE').length ?? 0;
  if (account.status === 'ACTIVE' && serviceCount === 0) score -= 15;
  else if (serviceCount > 0 && activeServices === 0) score -= 10;

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) return { score, label: { label: 'Healthy', color: HEALTH_BADGES.healthy } };
  if (score >= 60) return { score, label: { label: 'Good', color: HEALTH_BADGES.good } };
  if (score >= 40) return { score, label: { label: 'Needs attention', color: HEALTH_BADGES.attention } };
  return { score, label: { label: 'At risk', color: HEALTH_BADGES.critical } };
}

export function primaryContact(account: BusinessAccount) {
  return account.contacts?.find((c) => c.isPrimary) ?? account.contacts?.[0] ?? null;
}

export function primarySite(account: BusinessAccount) {
  return account.sites?.find((s) => s.isPrimary) ?? account.sites?.[0] ?? null;
}
