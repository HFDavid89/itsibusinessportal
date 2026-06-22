'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid, ReportKpi, ReportSection, StatusDistributionTable, LoadErrorPanel, money,
} from '@itsi-business/ui';
import { ReportShell } from '../../../components/ReportShell';
import { reportsApi, type EnergyReport } from '../../../lib/reports-api';

export default function EnergyReportPage() {
  const [data, setData] = useState<EnergyReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.energy()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load energy report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Energy Report" description={data?.label}>
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}
      {loading ? <p className="text-sm text-muted">Loading…</p> : data && (
        <div className="space-y-6">
          <p className="text-xs text-muted border border-border rounded-lg px-3 py-2 bg-surface-raised">{data.label}</p>

          <ReportKpiGrid>
            <ReportKpi label="Referred" value={String(data.pipeline.referred)} />
            <ReportKpi label="Quote in progress" value={String(data.pipeline.quoteInProgress)} />
            <ReportKpi label="Contracted" value={String(data.pipeline.contracted)} changeType="positive" />
            <ReportKpi label="Renewals (30d)" value={String(data.renewalsDue.days30)} changeType="negative" />
            <ReportKpi label="Renewals (90d)" value={String(data.renewalsDue.days90)} />
            <ReportKpi label="Check-ins due (30d)" value={String(data.checkInsDueNext30Days)} />
            <ReportKpi label="Missing supplier/meter" value={String(data.missingSupplierOrMeterData)} />
            <ReportKpi label="Est. annual spend entered" value={money(data.estimatedAnnualSpendPence)} change={`${data.recordsWithSpendEntered} records`} />
          </ReportKpiGrid>

          <ReportSection title="Energy records by status">
            <StatusDistributionTable rows={data.byStatus.map((r) => ({ label: r.status.replace(/_/g, ' '), value: r.count }))} />
          </ReportSection>

          <a href={`${WORKSPACE_URLS.services}/energy`} className="text-sm font-semibold text-accent hover:underline">Open energy tracking →</a>
        </div>
      )}
    </ReportShell>
  );
}
