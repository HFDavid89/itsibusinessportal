'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid,
  ReportKpi,
  ReportSection,
  TrendTable,
  StatusDistributionTable,
  LoadErrorPanel,
  money,
} from '@itsi-business/ui';
import { ReportShell } from '../../components/ReportShell';
import { reportsApi, type OverviewReport } from '../../lib/reports-api';

export default function ReportsOverviewPage() {
  const [data, setData] = useState<OverviewReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.overview()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load management overview.'))
      .finally(() => setLoading(false));
  }, []);

  const trendRows = data
    ? Object.entries(data.trends.last30Days).map(([metric, value]) => ({
        period: 'Last 30 days',
        metric: metric.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        value,
      }))
    : [];

  return (
    <ReportShell title="Management Reports" description="Business control tower — real database aggregates, staff-only.">
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}

      {loading ? (
        <p className="text-sm text-muted">Loading reports…</p>
      ) : data && (
        <div className="space-y-6">
          <ReportKpiGrid>
            <ReportKpi label="Business accounts" value={String(data.accounts.total)} change={`${data.accounts.active} active`} tone="primary" />
            <ReportKpi label="Active services" value={String(data.services.active)} change={`${data.services.mobile}M · ${data.services.broadband}B · ${data.services.energy}E`} tone="accent" />
            <ReportKpi label="Open tickets" value={String(data.tickets.open)} tone="secondary" />
            <ReportKpi label="Outstanding" value={money(data.billing.outstandingPence)} change={data.billing.overdueCount > 0 ? `${money(data.billing.overduePence)} overdue` : 'None overdue'} changeType={data.billing.overdueCount > 0 ? 'negative' : 'positive'} />
            <ReportKpi label="Open work items" value={String(data.workItems.open)} change={`${data.workItems.breached} SLA breached`} changeType={data.workItems.breached > 0 ? 'negative' : 'neutral'} />
            <ReportKpi label="Product enquiries" value={String(data.productEnquiries.open)} />
            <ReportKpi label="Energy renewals due" value={String(data.energy.renewalsDue)} change={`${data.energy.checkInsDue} check-ins due`} />
            <ReportKpi label="Assigned to me" value={String(data.workItems.assignedToMe)} change={`${data.workItems.dueSoon} due soon`} tone="accent" />
          </ReportKpiGrid>

          <ReportSection title="Service mix" description="Active retail services by type">
            <StatusDistributionTable rows={data.services.mix.map((m) => ({ label: m.type, value: m.count }))} />
          </ReportSection>

          <ReportSection title="30-day activity" description={data.trends.note}>
            <TrendTable rows={trendRows} />
          </ReportSection>

          <ReportSection title="Drill-down">
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/reports/billing" className="text-accent font-semibold hover:underline">Billing report →</Link>
              <a href={WORKSPACE_URLS.services + '/work-queue?filter=breached'} className="text-accent font-semibold hover:underline">Breached work queue →</a>
              <a href={WORKSPACE_URLS.desk + '/tickets'} className="text-accent font-semibold hover:underline">Desk tickets →</a>
              <Link href="/reports/accounts" className="text-accent font-semibold hover:underline">Account health →</Link>
            </div>
          </ReportSection>
        </div>
      )}
    </ReportShell>
  );
}
