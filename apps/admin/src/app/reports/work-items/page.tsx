'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid, ReportKpi, ReportSection, StatusDistributionTable, DrilldownLinkList, LoadErrorPanel,
} from '@itsi-business/ui';
import { ReportShell } from '../../../components/ReportShell';
import { reportsApi, type WorkItemsReport } from '../../../lib/reports-api';

export default function WorkItemsReportPage() {
  const [data, setData] = useState<WorkItemsReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.workItems()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load work queue report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Work Queue / SLA Report">
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}
      {loading ? <p className="text-sm text-muted">Loading…</p> : data && (
        <div className="space-y-6">
          <ReportKpiGrid>
            <ReportKpi label="Open" value={String(data.open)} tone="primary" />
            <ReportKpi label="Breached" value={String(data.breached)} changeType="negative" />
            <ReportKpi label="Due soon" value={String(data.dueSoon)} />
            <ReportKpi label="Completed (MTD)" value={String(data.completedThisMonth)} changeType="positive" />
            <ReportKpi label="Assigned to me" value={String(data.assignedToMe)} />
            <ReportKpi label="Unassigned" value={String(data.unassigned)} />
            <ReportKpi label="Avg open age (days)" value={String(data.averageOpenAgeDays)} />
          </ReportKpiGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportSection title="By type (open)">
              <StatusDistributionTable rows={data.byType.map((r) => ({ label: r.type.replace(/_/g, ' '), value: r.count }))} />
            </ReportSection>
            <ReportSection title="Breached by type">
              <StatusDistributionTable rows={data.breachedByType.map((r) => ({ label: r.type.replace(/_/g, ' '), value: r.count }))} />
            </ReportSection>
          </div>

          <ReportSection title="Oldest open items">
            <DrilldownLinkList
              links={data.oldestOpen.map((w) => ({
                label: w.title,
                meta: `${w.type.replace(/_/g, ' ')} · ${w.companyName ?? ''} · ${w.ageDays}d`,
                href: `${WORKSPACE_URLS.services}/work-queue/${w.id}`,
              }))}
            />
          </ReportSection>

          <div className="flex flex-wrap gap-3 text-sm">
            <a href={`${WORKSPACE_URLS.services}/work-queue?filter=breached`} className="text-accent font-semibold hover:underline">Breached queue →</a>
            <a href={`${WORKSPACE_URLS.services}/work-queue?filter=mine`} className="text-accent font-semibold hover:underline">Assigned to me →</a>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
