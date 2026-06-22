'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CompactKpiChip, MetricCard, StatusPill, ActionListPanel, PageSkeleton, LoadErrorPanel } from '@itsi-business/ui';
import { PortalPage } from '../components/PortalPage';
import { PortalHero, PortalPanel } from '../components/portal-ui/portal-cockpit';
import { InvoiceStatusBadge } from '../components/portal-ui/StatusBadges';
import { portalApi, fmtPence, fmtDate, TICKET_STATUS_LABELS, type PortalDashboard, type PortalMe } from '../lib/api';

function accountHealthScore(stats: PortalDashboard): number {
  let score = 92;
  if (stats.invoices.outstandingPence > 0) score -= 12;
  if (stats.invoices.overduePence > 0) score -= 28;
  if (stats.tickets.open > 0) score -= 8 * Math.min(stats.tickets.open, 3);
  if (stats.energy.renewalsDue > 0) score -= 10;
  return Math.max(18, Math.min(100, score));
}

function healthTone(score: number): 'healthy' | 'warning' | 'danger' {
  if (score >= 75) return 'healthy';
  if (score >= 50) return 'warning';
  return 'danger';
}

export default function PortalDashboardPage() {
  const [me, setMe] = useState<PortalMe | null>(null);
  const [stats, setStats] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([portalApi.me(), portalApi.dashboard()])
      .then(([meData, dashData]) => {
        setMe(meData);
        setStats(dashData);
      })
      .catch(() => setError('Unable to load your account dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const company = me?.account?.companyName ?? stats?.account?.companyName ?? 'Your account';
  const accountNumber = me?.account?.accountNumber ?? stats?.account?.accountNumber;
  const healthScore = stats ? accountHealthScore(stats) : null;
  const tone = healthScore != null ? healthTone(healthScore) : 'neutral';

  const quickActions = useMemo(() => [
    { id: 'ticket', label: 'Raise support ticket', href: '/tickets?new=1' },
    { id: 'services', label: 'View services', href: '/services' },
    { id: 'invoices', label: 'View invoices', href: '/billing' },
    { id: 'products', label: 'Request product information', href: '/products' },
    { id: 'energy', label: 'Request energy review', href: '/tickets?new=1&category=ENERGY' },
    { id: 'fleet', label: 'Update SIM label / cost centre', href: '/fleet' },
  ], []);

  if (loading) {
    return (
      <PortalPage title="Dashboard">
        <PageSkeleton rows={6} />
      </PortalPage>
    );
  }

  if (error || !stats) {
    return (
      <PortalPage title="Dashboard">
        <LoadErrorPanel message={error || 'Dashboard unavailable'} onRetry={() => window.location.reload()} />
      </PortalPage>
    );
  }

  return (
    <PortalPage title={company} subtitle={accountNumber ? `${accountNumber} · ${me?.account?.status ?? stats.account?.status}` : undefined}>
      <div className="max-w-6xl mx-auto space-y-5 p-1">

        <PortalHero
          eyebrow="Business account"
          title={company}
          subtitle={accountNumber ? `${accountNumber} · ${stats.account?.status ?? 'ACTIVE'}` : 'Your services, billing, and support at a glance'}
          badges={
            <StatusPill tone={tone === 'healthy' ? 'success' : tone === 'warning' ? 'warning' : 'danger'} dot>
              {healthScore != null ? `Health ${healthScore}` : 'Loading'}
            </StatusPill>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <CompactKpiChip label="Active services" value={stats.services.active} delta={`${stats.services.mobile}M · ${stats.services.broadband}B · ${stats.services.energy}E`} />
          <CompactKpiChip label="Open tickets" value={stats.tickets.open} />
          <CompactKpiChip label="Outstanding" value={fmtPence(stats.invoices.outstandingPence)} />
          <CompactKpiChip label="Overdue" value={fmtPence(stats.invoices.overduePence)} deltaDown={stats.invoices.overduePence > 0} />
          <CompactKpiChip label="Product enquiries" value={stats.productEnquiries.open} />
          <CompactKpiChip label="Energy renewals" value={stats.energy.renewalsDue} delta={stats.energy.renewalsDue > 0 ? 'Review due' : undefined} deltaDown={stats.energy.renewalsDue > 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <PortalPanel title="Recent invoices" actionLabel="View all →" actionHref="/billing" empty={!stats.invoices.recent.length}>
              {!stats.invoices.recent.length ? (
                <p>No invoices yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.invoices.recent.map((inv) => (
                    <Link key={inv.id} href={`/billing/${inv.id}`} className="block hover:opacity-90">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{inv.invoiceNumber}</span>
                        <span className="text-sm font-bold text-foreground">{fmtPence(inv.balanceDuePence)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <InvoiceStatusBadge status={inv.status} />
                        <span className="text-[11px] text-muted">Due {fmtDate(inv.dueDate)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PortalPanel>

            <PortalPanel title="Recent tickets" actionLabel="View all →" actionHref="/tickets" empty={!stats.tickets.recent.length}>
              {!stats.tickets.recent.length ? (
                <p>No support tickets.</p>
              ) : (
                <div className="space-y-3">
                  {stats.tickets.recent.map((t) => (
                    <Link key={t.id} href={`/tickets/${t.id}`} className="block hover:opacity-90">
                      <p className="text-sm font-semibold text-foreground truncate">{t.subject}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {t.ticketNumber} · {TICKET_STATUS_LABELS[t.status] ?? t.status}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </PortalPanel>

            <PortalPanel
              title="Energy check-ins & renewals"
              actionLabel="View services →"
              actionHref="/services"
              empty={!stats.energy.upcomingCheckIns.length && stats.energy.renewalsDue === 0}
            >
              {stats.energy.renewalsDue > 0 && (
                <p className="text-sm text-amber-400 mb-3">
                  {stats.energy.renewalsDue} energy contract{stats.energy.renewalsDue === 1 ? '' : 's'} in renewal window.
                </p>
              )}
              {stats.energy.upcomingCheckIns.length === 0 ? (
                <p>No upcoming check-ins in the next 30 days.</p>
              ) : (
                <div className="space-y-2">
                  {stats.energy.upcomingCheckIns.map((e) => (
                    <Link key={e.id} href={`/services/${e.id}`} className="block text-sm hover:opacity-90">
                      <span className="font-semibold text-foreground">{e.displayName}</span>
                      <span className="text-muted text-[11px] block">
                        {e.statusLabel} · check-in {fmtDate(e.nextCheckInDate)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </PortalPanel>

            <PortalPanel title="Recent activity" empty={!stats.recentActivity.length}>
              {!stats.recentActivity.length ? (
                <p>No recent account activity.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.map((a) => (
                    <div key={a.id} className="text-sm">
                      <p className="text-foreground">{a.label}</p>
                      <p className="text-[11px] text-muted">{fmtDate(a.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </PortalPanel>
          </div>

          <div className="space-y-4">
            <ActionListPanel title="Quick actions" items={quickActions} />
            <div className="grid grid-cols-1 gap-3">
              <MetricCard
                label="Services overview"
                value={`${stats.services.mobile} mobile`}
                change={`${stats.services.broadband} broadband · ${stats.services.energy} energy`}
                tone="accent"
              />
            </div>
          </div>
        </div>
      </div>
    </PortalPage>
  );
}
