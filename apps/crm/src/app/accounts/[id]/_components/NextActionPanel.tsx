'use client';

import type { AccountTab } from './account-types';

export interface NextActionPanelProps {
  accountStatus: string;
  overdueInvoices: { totalPence: number; count: number };
  openTickets: number;
  contactCount: number;
  siteCount: number;
  serviceCount: number;
  activeServiceCount: number;
  onTabChange: (tab: AccountTab) => void;
}

type Severity = 'urgent' | 'warning' | 'info' | 'healthy';

type ActionItem = {
  priority: number;
  severity: Severity;
  title: string;
  reason: string;
  cta?: { label: string; onClick: () => void };
};

const severityConfig: Record<Severity, { label: string; badge: string; panelClass: string; iconBg: string }> = {
  urgent: { label: 'Urgent', badge: 'bg-danger/15 text-danger border-danger/30', panelClass: 'next-action-primary--urgent', iconBg: 'bg-danger/15 text-danger ring-2 ring-danger/20' },
  warning: { label: 'Attention needed', badge: 'bg-warning/15 text-warning border-warning/30', panelClass: 'next-action-primary--warning', iconBg: 'bg-warning/15 text-warning ring-2 ring-warning/20' },
  info: { label: 'Recommended', badge: 'bg-accent/15 text-accent border-accent/30', panelClass: 'next-action-primary--info', iconBg: 'bg-accent/15 text-accent ring-2 ring-accent/20' },
  healthy: { label: 'Healthy', badge: 'bg-success/15 text-success border-success/30', panelClass: 'next-action-primary--healthy', iconBg: 'bg-success/15 text-success ring-2 ring-success/20' },
};

function buildActionItems(props: NextActionPanelProps): ActionItem[] {
  const items: ActionItem[] = [];

  if (props.accountStatus === 'SUSPENDED') {
    items.push({
      priority: 0, severity: 'urgent',
      title: 'Account suspended',
      reason: 'Services may be blocked until the account is reactivated.',
      cta: { label: 'View services', onClick: () => props.onTabChange('services') },
    });
  }

  if (props.overdueInvoices.count > 0) {
    items.push({
      priority: 1, severity: 'urgent',
      title: `${props.overdueInvoices.count} overdue invoice${props.overdueInvoices.count > 1 ? 's' : ''}`,
      reason: `£${(props.overdueInvoices.totalPence / 100).toFixed(2)} outstanding — payment is past due.`,
      cta: { label: 'View invoices', onClick: () => props.onTabChange('invoices') },
    });
  }

  if (props.openTickets > 0) {
    items.push({
      priority: 2, severity: 'info',
      title: `${props.openTickets} open support ticket${props.openTickets > 1 ? 's' : ''}`,
      reason: 'Review customer support activity in the timeline.',
      cta: { label: 'View timeline', onClick: () => props.onTabChange('timeline') },
    });
  }

  if (props.contactCount === 0) {
    items.push({
      priority: 3, severity: 'warning',
      title: 'No contacts on file',
      reason: 'Add a primary contact before provisioning services or sending invoices.',
      cta: { label: 'Add contact', onClick: () => props.onTabChange('contacts') },
    });
  } else if (props.siteCount === 0) {
    items.push({
      priority: 4, severity: 'warning',
      title: 'No sites on file',
      reason: 'Business accounts need at least one site for service delivery.',
      cta: { label: 'Add site', onClick: () => props.onTabChange('sites') },
    });
  }

  if (props.accountStatus === 'PROSPECT') {
    items.push({
      priority: 5, severity: 'info',
      title: 'Prospect account',
      reason: 'Complete company profile, add contacts and sites, then activate when ready.',
      cta: { label: 'View company', onClick: () => props.onTabChange('overview') },
    });
  }

  if (props.serviceCount === 0 && props.accountStatus === 'ACTIVE') {
    items.push({
      priority: 6, severity: 'warning',
      title: 'No services provisioned',
      reason: 'This active account has no mobile, broadband, or energy services yet.',
      cta: { label: 'View services', onClick: () => props.onTabChange('services') },
    });
  } else if (props.serviceCount > 0 && props.activeServiceCount === 0) {
    items.push({
      priority: 7, severity: 'info',
      title: 'No active services',
      reason: 'All services are suspended, ceased, or pending activation.',
      cta: { label: 'Review services', onClick: () => props.onTabChange('services') },
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

export function NextActionPanel(props: NextActionPanelProps) {
  const items = buildActionItems(props);

  if (items.length === 0) {
    return (
      <div className="next-action-primary next-action-primary--healthy p-5 flex items-center gap-4" role="status">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${severityConfig.healthy.iconBg}`}>
          <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-foreground">All clear</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${severityConfig.healthy.badge}`}>Healthy</span>
          </div>
          <p className="text-sm text-muted">No outstanding actions — this account is in good standing.</p>
        </div>
      </div>
    );
  }

  const [primary, ...secondary] = items;
  const visibleSecondary = secondary.slice(0, 3);
  const hiddenCount = Math.max(0, secondary.length - 3);
  const sev = severityConfig[primary.severity];

  return (
    <div className="space-y-3">
      <div className={`next-action-primary ${sev.panelClass} px-4 py-3`} role="region" aria-label="Primary recommended action">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${sev.iconBg}`} aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-foreground">Next action</h3>
              <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-px rounded-full border ${sev.badge}`}>{sev.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground leading-snug">{primary.title}</p>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">{primary.reason}</p>
          </div>
          {primary.cta && (
            <button type="button" onClick={primary.cta.onClick} className="btn-aurora shrink-0 self-start sm:self-center text-xs font-bold px-3.5 py-1.5 rounded-md">
              {primary.cta.label}
            </button>
          )}
        </div>
      </div>

      {visibleSecondary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {visibleSecondary.map((item) => {
            const s = severityConfig[item.severity];
            return (
              <button
                key={item.title}
                type="button"
                onClick={item.cta?.onClick}
                className={`text-left rounded-lg border border-border bg-surface px-3 py-2.5 hover:border-accent/30 hover:bg-surface-raised transition-colors ${item.cta ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <p className={`text-[9px] font-bold uppercase tracking-wide ${s.badge.split(' ')[1]}`}>{s.label}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{item.title}</p>
              </button>
            );
          })}
          {hiddenCount > 0 && (
            <p className="text-xs text-muted self-center px-1">+{hiddenCount} more item{hiddenCount > 1 ? 's' : ''}</p>
          )}
        </div>
      )}
    </div>
  );
}
