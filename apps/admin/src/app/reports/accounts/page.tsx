'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid, ReportKpi, ReportSection, DrilldownLinkList, LoadErrorPanel,
} from '@itsi-business/ui';
import { ReportShell } from '../../../components/ReportShell';
import { reportsApi, type AccountsReport } from '../../../lib/reports-api';

export default function AccountsReportPage() {
  const [data, setData] = useState<AccountsReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.accounts()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load account health report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Account Health Report">
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}
      {loading ? <p className="text-sm text-muted">Loading…</p> : data && (
        <div className="space-y-6">
          <ReportKpiGrid>
            <ReportKpi label="Healthy" value={String(data.summary.healthy)} changeType="positive" />
            <ReportKpi label="Watch" value={String(data.summary.watch)} />
            <ReportKpi label="At risk" value={String(data.summary.atRisk)} changeType="negative" />
            <ReportKpi label="Needs attention" value={String(data.summary.needsAttention)} changeType="negative" />
          </ReportKpiGrid>

          <ReportSection title="Accounts at risk or needing attention">
            <DrilldownLinkList
              links={data.accountsAtRisk.map((a) => ({
                label: a.companyName,
                meta: `${a.health.label} (score ${a.health.score}) · ${a.openTickets} ticket(s) · ${a.overdueInvoices} overdue`,
                href: `${WORKSPACE_URLS.crm}/accounts/${a.accountId}`,
              }))}
            />
          </ReportSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportSection title="Overdue debt + open tickets">
              <DrilldownLinkList
                links={data.overdueDebtWithOpenTickets.map((a) => ({
                  label: a.companyName,
                  meta: `${a.openTickets} ticket(s) · ${a.overdueInvoices} overdue invoice(s)`,
                  href: `${WORKSPACE_URLS.crm}/accounts/${a.accountId}`,
                }))}
              />
            </ReportSection>
            <ReportSection title="Accounts without contacts">
              <DrilldownLinkList
                links={data.accountsWithoutContacts.map((a) => ({
                  label: a.companyName,
                  meta: a.accountNumber,
                  href: `${WORKSPACE_URLS.crm}/accounts/${a.accountId}`,
                }))}
              />
            </ReportSection>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
