'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid, ReportKpi, ReportSection, StatusDistributionTable, LoadErrorPanel,
} from '@itsi-business/ui';
import { ReportShell } from '../../../components/ReportShell';
import { reportsApi, type ServicesReport } from '../../../lib/reports-api';

export default function ServicesReportPage() {
  const [data, setData] = useState<ServicesReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.services()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load services report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Services Report">
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}
      {loading ? <p className="text-sm text-muted">Loading…</p> : data && (
        <div className="space-y-6">
          <ReportKpiGrid>
            <ReportKpi label="Mobile active" value={String(data.mobile.active)} tone="primary" />
            <ReportKpi label="Broadband active" value={String(data.broadband.active)} tone="accent" />
            <ReportKpi label="Energy active" value={String(data.energy.active)} />
            <ReportKpi label="Open work on services" value={String(data.dataQuality.servicesWithOpenWorkItems)} />
          </ReportKpiGrid>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ReportSection title="Mobile by status">
              <StatusDistributionTable rows={data.mobile.byStatus.map((r) => ({ label: r.status, value: r.count }))} />
            </ReportSection>
            <ReportSection title="Broadband by status">
              <StatusDistributionTable rows={data.broadband.byStatus.map((r) => ({ label: r.status, value: r.count }))} />
            </ReportSection>
            <ReportSection title="Energy by status">
              <StatusDistributionTable rows={data.energy.byStatus.map((r) => ({ label: r.status, value: r.count }))} />
            </ReportSection>
          </div>

          <ReportSection title="Broadband access technology (active)">
            <StatusDistributionTable rows={data.broadband.byAccessTechnology.map((r) => ({ label: r.accessTechnology, value: r.count }))} />
          </ReportSection>

          <ReportSection title="Wholesale links (local only)" description={data.wholesale.label}>
            <StatusDistributionTable rows={data.wholesale.byStatus.map((r) => ({ label: r.status, value: r.count }))} />
          </ReportSection>

          <a href={`${WORKSPACE_URLS.services}/records`} className="text-sm font-semibold text-accent hover:underline">Open service records →</a>
        </div>
      )}
    </ReportShell>
  );
}
