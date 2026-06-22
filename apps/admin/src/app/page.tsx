'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell, ADMIN_NAV_GROUPS, StaffPageHeader, StaffPageContent, ADMIN_WORKSPACE_LINKS, WORKSPACE_URLS, apiFetch } from '@itsi-business/staff-shell';
import { MetricCard, StatusPill, LoadErrorPanel } from '@itsi-business/ui';

interface DashboardStats {
  accounts: { total: number; active: number };
  tickets: { open: number };
  services: { active: number; mobile: number; broadband: number; energy: number };
  invoices: {
    overduePence: number;
    outstandingPence: number;
    draftCount: number;
    issuedCount: number;
  };
  staff: { active: number };
}

interface WholesaleStatus {
  enabled: boolean;
  message?: string;
  version?: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wholesale, setWholesale] = useState<WholesaleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<{ success: true; data: DashboardStats }>('/api/v1/stats/dashboard'),
      apiFetch<{ success: true; data: WholesaleStatus }>('/api/v1/wholesale/status').catch(() => ({ success: true as const, data: { enabled: false, message: 'Status unavailable' } })),
    ])
      .then(([statsRes, wholesaleRes]) => {
        setStats(statsRes.data);
        setWholesale(wholesaleRes.data);
      })
      .catch(() => setError('Unable to load platform overview.'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (pence: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);

  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <StaffPageContent>
        <StaffPageHeader
          title="Platform Overview"
          description="Live operational snapshot across business accounts, services, billing, and support."
        />

        {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="metric-card animate-pulse h-24" />
            ))}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Business accounts" value={String(stats.accounts.total)} change={`${stats.accounts.active} active`} tone="primary" />
              <MetricCard label="Active services" value={String(stats.services.active)} change={`${stats.services.mobile}M · ${stats.services.broadband}B · ${stats.services.energy}E`} tone="accent" />
              <MetricCard label="Open tickets" value={String(stats.tickets.open)} tone="secondary" />
              <MetricCard label="Outstanding invoices" value={fmt(stats.invoices.outstandingPence)} change={stats.invoices.overduePence > 0 ? `${fmt(stats.invoices.overduePence)} overdue` : 'None overdue'} changeType={stats.invoices.overduePence > 0 ? 'negative' : 'positive'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="command-card">
                <h2 className="text-base font-semibold text-foreground mb-3">Wholesale bridge</h2>
                <div className="flex items-center gap-2 mb-2">
                  <StatusPill tone={wholesale?.enabled ? 'success' : 'warning'} dot>
                    {wholesale?.enabled ? 'Connected' : 'Disabled'}
                  </StatusPill>
                  {wholesale?.version && <span className="text-xs text-muted font-mono">{wholesale.version}</span>}
                </div>
                <p className="text-sm text-muted">
                  {wholesale?.message ?? (wholesale?.enabled ? 'Itsi Mobile wholesale API reachable.' : 'Set ITSI_MOBILE_WHOLESALE_ENABLED=true to activate.')}
                </p>
                <Link href="/wholesale" className="inline-block mt-3 text-xs font-semibold text-accent hover:underline">
                  Test connection →
                </Link>
              </div>

              <div className="command-card">
                <h2 className="text-base font-semibold text-foreground mb-3">Staff workspaces</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <a href={ADMIN_WORKSPACE_LINKS.crmAccounts} className="text-accent hover:underline">CRM accounts</a>
                  <a href={ADMIN_WORKSPACE_LINKS.billingInvoices} className="text-accent hover:underline">Billing invoices</a>
                  <a href={ADMIN_WORKSPACE_LINKS.deskTickets} className="text-accent hover:underline">Desk tickets</a>
                  <a href={ADMIN_WORKSPACE_LINKS.servicesRecords} className="text-accent hover:underline">Service records</a>
                  <a href={`${WORKSPACE_URLS.services}/work-queue`} className="text-accent hover:underline">Work queue</a>
                  <a href="/staff" className="text-accent hover:underline">Staff users ({stats.staff.active})</a>
                </div>
              </div>
            </div>

            <div className="command-card">
              <p className="text-xs text-muted font-mono">
                RULE: Itsi Business owns the business customer. Itsi Mobile owns wholesale/provider fulfilment.
                Live network controls remain blocked until 13B-2 staging E2E passes.
              </p>
            </div>
          </>
        )}
      </StaffPageContent>
    </AppShell>
  );
}
