'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid, ReportKpi, ReportSection, AgeingBucketBar,
  StatusDistributionTable, DrilldownLinkList, LoadErrorPanel, money,
} from '@itsi-business/ui';
import { ReportShell } from '../../../components/ReportShell';
import { reportsApi, type BillingReport } from '../../../lib/reports-api';

export default function BillingReportPage() {
  const [data, setData] = useState<BillingReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.billing()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load billing report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Billing Report">
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}
      {loading ? <p className="text-sm text-muted">Loading…</p> : data && (
        <div className="space-y-6">
          <ReportKpiGrid>
            <ReportKpi label="Outstanding" value={money(data.outstandingPence)} tone="primary" />
            <ReportKpi label="Overdue" value={money(data.overduePence)} change={`${data.overdueAccountsCount} accounts`} changeType="negative" />
            <ReportKpi label="Due in 7 days" value={String(data.dueSoon.days7)} />
            <ReportKpi label="Due in 30 days" value={String(data.dueSoon.days30)} />
          </ReportKpiGrid>

          <ReportSection title="Invoice status counts">
            <StatusDistributionTable rows={Object.entries(data.statusCounts).map(([label, value]) => ({ label, value: value as number }))} />
          </ReportSection>

          <ReportSection title="Ageing buckets">
            <AgeingBucketBar buckets={data.ageingBuckets} formatMoney={money} />
          </ReportSection>

          <ReportSection title="Billing by service type (line totals)">
            <StatusDistributionTable
              rows={data.billingByServiceType.map((r) => ({ label: r.serviceType, value: money(r.totalPence) }))}
              valueLabel="Amount"
            />
          </ReportSection>

          <ReportSection title="Top overdue accounts">
            <DrilldownLinkList
              links={data.topOverdueAccounts.map((a) => ({
                label: a.companyName,
                meta: `${a.count} invoice(s) · ${money(a.balancePence)} overdue`,
                href: `${WORKSPACE_URLS.billing}/invoices?accountId=${a.accountId}&status=OVERDUE`,
              }))}
            />
          </ReportSection>

          <p className="text-xs text-muted">Online payment and PDF metrics are deferred — see deferred feature register.</p>
        </div>
      )}
    </ReportShell>
  );
}
