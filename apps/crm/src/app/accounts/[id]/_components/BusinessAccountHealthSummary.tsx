'use client';

import type { AccountTab } from './account-types';
import type { HealthLabel } from './account-types';

export interface HealthMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
  status: 'healthy' | 'warning' | 'danger' | 'neutral';
  tab: AccountTab;
}

const statusTextClass = {
  healthy: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-muted',
};

interface BusinessAccountHealthSummaryProps {
  metrics: HealthMetric[];
  healthScore: number;
  healthLabel: HealthLabel;
  onTabChange: (tab: AccountTab) => void;
}

export function BusinessAccountHealthSummary({ metrics, healthScore, healthLabel, onTabChange }: BusinessAccountHealthSummaryProps) {
  const scoreRingClass = healthScore >= 80 ? 'text-success' : healthScore >= 50 ? 'text-warning' : 'text-danger';

  return (
    <div className="health-summary-strip shrink-0">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-1.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory scrollbar-none">
          <div className="health-score-card health-score-card--compact flex items-center gap-2 shrink-0 snap-start">
            <div className="relative w-8 h-8 shrink-0" aria-hidden>
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${healthScore * 0.94} 100`} className={scoreRingClass} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{healthScore}</span>
            </div>
            <div className="min-w-0">
              <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-bold border ${healthLabel.color}`}>{healthLabel.label}</span>
            </div>
          </div>

          <span className="w-px h-8 bg-border shrink-0 hidden sm:block" aria-hidden />

          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onTabChange(m.tab)}
              className={`health-metric-card health-metric-card--compact health-metric-card--${m.status} snap-start shrink-0`}
              aria-label={`${m.label}: ${m.value}. ${m.detail}.`}
              title={m.detail}
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted leading-none">{m.label}</p>
              <p className={`text-xs font-bold leading-tight mt-0.5 ${statusTextClass[m.status]}`}>{m.value}</p>
              <p className="text-[10px] text-muted mt-0.5 leading-none truncate max-w-[120px] hidden xl:block">{m.detail}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function buildBusinessHealthMetrics(input: {
  serviceCount: number;
  activeServiceCount: number;
  invoiceCount: number;
  overdueCount: number;
  openTickets: number;
  contactCount: number;
  siteCount: number;
  accountStatus: string;
}): HealthMetric[] {
  const serviceStatus: HealthMetric['status'] =
    input.activeServiceCount > 0 ? 'healthy' : input.serviceCount > 0 ? 'warning' : input.accountStatus === 'ACTIVE' ? 'warning' : 'neutral';
  const serviceLabel = input.activeServiceCount > 0 ? 'Active' : input.serviceCount > 0 ? 'Inactive' : 'None';

  const billingStatus: HealthMetric['status'] =
    input.overdueCount > 0 ? 'danger' : input.invoiceCount > 0 ? 'healthy' : 'neutral';
  const billingLabel = input.overdueCount > 0 ? `${input.overdueCount} overdue` : input.invoiceCount > 0 ? 'In good standing' : 'No invoices';

  const supportStatus: HealthMetric['status'] = input.openTickets > 0 ? 'warning' : 'healthy';
  const supportLabel = input.openTickets > 0 ? `${input.openTickets} open` : 'Clear';

  const profileStatus: HealthMetric['status'] =
    input.contactCount === 0 || input.siteCount === 0 ? 'warning' : 'healthy';
  const profileLabel = input.contactCount === 0 ? 'No contacts' : input.siteCount === 0 ? 'No sites' : 'Complete';

  return [
    {
      key: 'service',
      label: 'Services',
      value: serviceLabel,
      detail: `${input.activeServiceCount} active · ${input.serviceCount} total`,
      status: serviceStatus,
      tab: 'services',
    },
    {
      key: 'billing',
      label: 'Billing',
      value: billingLabel,
      detail: `${input.invoiceCount} invoice${input.invoiceCount !== 1 ? 's' : ''}`,
      status: billingStatus,
      tab: 'invoices',
    },
    {
      key: 'support',
      label: 'Support',
      value: supportLabel,
      detail: input.openTickets > 0 ? 'Review open tickets' : 'Queue clear',
      status: supportStatus,
      tab: 'timeline',
    },
    {
      key: 'profile',
      label: 'Profile',
      value: profileLabel,
      detail: `${input.contactCount} contacts · ${input.siteCount} sites`,
      status: profileStatus,
      tab: 'contacts',
    },
  ];
}
