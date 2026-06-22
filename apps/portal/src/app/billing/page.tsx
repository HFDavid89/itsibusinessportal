'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompactKpiChip, DataTable, FilterBar, LoadErrorPanel, LoadingList, StatusPill } from '@itsi-business/ui';
import { PortalPage } from '../../components/PortalPage';
import { PortalHero } from '../../components/portal-ui/portal-cockpit';
import { InvoiceStatusBadge } from '../../components/portal-ui/StatusBadges';
import { portalApi, fmtPence, fmtDate, type PortalInvoiceSummary } from '../../lib/api';
import { INVOICE_STATUS_LABELS } from '../../lib/labels';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PART_PAID', label: 'Part paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
] as const;

export default function BillingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PortalInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    portalApi.invoices(statusFilter ? { status: statusFilter } : undefined)
      .then((r) => setInvoices(r.data))
      .catch(() => setError('Unable to load invoices.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => inv.invoiceNumber.toLowerCase().includes(q));
  }, [invoices, search]);

  const summary = useMemo(() => ({
    outstanding: invoices.filter((i) => ['ISSUED', 'PART_PAID'].includes(i.status)).reduce((s, i) => s + i.balanceDuePence, 0),
    overdue: invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.balanceDuePence, 0),
    paid: invoices.filter((i) => i.status === 'PAID').length,
  }), [invoices]);

  return (
    <PortalPage title="Billing & invoices" subtitle={`${invoices.length} invoices`}>
      <div className="max-w-6xl mx-auto space-y-5">
        <PortalHero
          eyebrow="Billing"
          title="Invoices"
          subtitle="View invoice status, line items, and payment instructions for your business account."
          badges={summary.overdue > 0 ? <StatusPill tone="danger" dot>Overdue balance</StatusPill> : undefined}
        />

        {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}

        {!loading && invoices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CompactKpiChip label="Outstanding" value={fmtPence(summary.outstanding)} />
            <CompactKpiChip label="Overdue" value={fmtPence(summary.overdue)} deltaDown={summary.overdue > 0} />
            <CompactKpiChip label="Paid invoices" value={summary.paid} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === tab.value
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-surface-raised text-muted border-border hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search invoice number…"
        />

        {loading ? (
          <LoadingList rows={5} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-raised px-6 py-14 text-center">
            <p className="text-sm font-semibold text-foreground">No invoices</p>
            <p className="text-xs text-muted mt-1">
              {statusFilter ? 'No invoices match this filter.' : 'No invoices are available for your account yet.'}
            </p>
          </div>
        ) : (
          <DataTable
            rows={filtered}
            rowKey={(inv) => inv.id}
            onRowClick={(inv) => router.push(`/billing/${inv.id}`)}
            columns={[
              {
                key: 'number',
                header: 'Invoice',
                cell: (inv) => (
                  <Link href={`/billing/${inv.id}`} className="font-mono font-semibold text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
                    {inv.invoiceNumber}
                  </Link>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (inv) => <InvoiceStatusBadge status={inv.status} />,
              },
              { key: 'issued', header: 'Issued', cell: (inv) => fmtDate(inv.issueDate) },
              { key: 'due', header: 'Due', cell: (inv) => fmtDate(inv.dueDate) },
              { key: 'total', header: 'Total', cell: (inv) => fmtPence(inv.totalPence) },
              {
                key: 'balance',
                header: 'Balance',
                cell: (inv) => (
                  <span className={inv.status === 'OVERDUE' ? 'font-bold text-danger' : 'font-semibold'}>
                    {fmtPence(inv.balanceDuePence)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </div>
    </PortalPage>
  );
}
