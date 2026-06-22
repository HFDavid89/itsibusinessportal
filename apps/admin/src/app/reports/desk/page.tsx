'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid, ReportKpi, ReportSection, StatusDistributionTable, DrilldownLinkList, LoadErrorPanel,
} from '@itsi-business/ui';
import { ReportShell } from '../../../components/ReportShell';
import { reportsApi, type DeskReport } from '../../../lib/reports-api';

export default function DeskReportPage() {
  const [data, setData] = useState<DeskReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.desk()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load desk report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Desk / Support Report">
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}
      {loading ? <p className="text-sm text-muted">Loading…</p> : data && (
        <div className="space-y-6">
          <ReportKpiGrid>
            <ReportKpi label="Open tickets" value={String(data.open)} tone="primary" />
            <ReportKpi label="Unassigned" value={String(data.unassigned)} changeType={data.unassigned > 0 ? 'negative' : 'neutral'} />
            <ReportKpi label="With work items" value={String(data.withWorkItems)} />
            <ReportKpi label="Avg open age (days)" value={String(data.averageOpenAgeDays)} />
          </ReportKpiGrid>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ReportSection title="By priority (open)">
              <StatusDistributionTable rows={data.byPriority.map((r) => ({ label: r.priority, value: r.count }))} />
            </ReportSection>
            <ReportSection title="By category (open)">
              <StatusDistributionTable rows={data.byCategory.map((r) => ({ label: r.category, value: r.count }))} />
            </ReportSection>
            <ReportSection title="All statuses">
              <StatusDistributionTable rows={data.byStatus.map((r) => ({ label: r.status, value: r.count }))} />
            </ReportSection>
          </div>

          <ReportSection title="Oldest open tickets">
            <DrilldownLinkList
              links={data.oldestOpen.map((t) => ({
                label: `${t.ticketNumber} — ${t.subject}`,
                meta: `${t.companyName ?? 'Account'} · ${t.ageDays} days open`,
                href: `${WORKSPACE_URLS.desk}/tickets/${t.id}`,
              }))}
            />
          </ReportSection>
        </div>
      )}
    </ReportShell>
  );
}
