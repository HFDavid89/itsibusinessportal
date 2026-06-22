'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import {
  ReportKpiGrid, ReportKpi, ReportSection, StatusDistributionTable, DrilldownLinkList, LoadErrorPanel,
} from '@itsi-business/ui';
import { ReportShell } from '../../../components/ReportShell';
import { reportsApi, type ProductsReport } from '../../../lib/reports-api';

export default function ProductsReportPage() {
  const [data, setData] = useState<ProductsReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.products()
      .then((r) => setData(r.data))
      .catch(() => setError('Unable to load products report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Product Enquiry / Growth Report">
      {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}
      {loading ? <p className="text-sm text-muted">Loading…</p> : data && (
        <div className="space-y-6">
          <ReportKpiGrid>
            <ReportKpi label="Catalogue (customer-visible)" value={String(data.catalogue.customerVisibleActive)} tone="primary" />
            <ReportKpi label="Open enquiries" value={String(data.productEnquiries.open)} />
            <ReportKpi label="Incomplete catalogue items" value={String(data.catalogue.incompleteCustomerVisible)} changeType={data.catalogue.incompleteCustomerVisible > 0 ? 'negative' : 'neutral'} />
          </ReportKpiGrid>

          <ReportSection title="Enquiries by service type (open)">
            <StatusDistributionTable rows={data.productEnquiries.byServiceType.map((r) => ({ label: r.serviceType.replace(/_/g, ' '), value: r.count }))} />
          </ReportSection>

          <ReportSection title="Recent product enquiries">
            <DrilldownLinkList
              links={data.productEnquiries.recent.map((e) => ({
                label: e.title,
                meta: `${e.account?.companyName ?? 'Account'} · ${new Date(e.createdAt).toLocaleDateString('en-GB')}`,
                href: `${WORKSPACE_URLS.crm}/accounts/${e.accountId}`,
              }))}
            />
          </ReportSection>

          <p className="text-xs text-muted">No wholesale order creation from reports — wholesale execution remains deferred until 13B-2.</p>
        </div>
      )}
    </ReportShell>
  );
}
