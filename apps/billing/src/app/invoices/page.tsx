'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import { billingApi, money, balanceDue, type BusinessInvoice, type InvoiceStatus } from '../../lib/api';

const NAV_GROUPS = [
  { label: 'Billing', items: [
    { href: '/', label: 'Dashboard', exactMatch: true },
    { href: '/invoices', label: 'Invoices' },
  ]},
];

const STATUS_TABS: { label: string; value: InvoiceStatus | '' }[] = [
  { label: 'All',       value: '' },
  { label: 'Draft',     value: 'DRAFT' },
  { label: 'Issued',    value: 'ISSUED' },
  { label: 'Part Paid', value: 'PART_PAID' },
  { label: 'Paid',      value: 'PAID' },
  { label: 'Overdue',   value: 'OVERDUE' },
  { label: 'Void',      value: 'VOID' },
];

const STATUS_CLS: Record<string, string> = {
  DRAFT:     'bg-border/40 text-muted border-border',
  ISSUED:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PART_PAID: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  PAID:      'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  OVERDUE:   'bg-rose-500/10 text-rose-600 border-rose-500/20',
  VOID:      'bg-border text-muted border-border',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${STATUS_CLS[status] ?? 'bg-border text-muted border-border'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function fmt(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const INP = 'rounded-lg border border-border bg-background text-sm text-foreground px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30';

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <InvoicesPageInner />
    </Suspense>
  );
}

function InvoicesPageInner() {
  const searchParams  = useSearchParams();
  const statusParam   = (searchParams.get('status') ?? '') as InvoiceStatus | '';

  const [invoices, setInvoices] = useState<BusinessInvoice[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState<InvoiceStatus | ''>(statusParam);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await billingApi.invoices({
        status: status || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      setInvoices(res.data);
      setTotal(res.meta.total);
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setActionError('');
    try { await fn(); await load(); }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Action failed'); }
    finally { setBusy(null); }
  }

  const issue = (id: string) => run(`${id}-issue`, () => billingApi.issueInvoice(id));
  const voidInv = (id: string) => {
    if (!confirm('Void this invoice? This cannot be undone.')) return Promise.resolve();
    return run(`${id}-void`, () => billingApi.voidInvoice(id));
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Billing' }}>
      <div className="p-5 max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-foreground">Invoices</h1>
            <p className="text-xs text-muted">{total} total · manual invoice workflow</p>
          </div>
          <Link href="/invoices/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90">
            + New Invoice
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 flex-wrap border-b border-border pb-2">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} type="button"
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                status === tab.value ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground hover:bg-surface-raised'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search invoice number, account…"
            className={`${INP} flex-1 max-w-sm`} />
        </div>

        {error       && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</div>}
        {actionError && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{actionError}</div>}

        {/* Table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted bg-surface-raised">
            <span className="col-span-2">Number</span>
            <span className="col-span-3">Account</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2 text-right">Total</span>
            <span className="col-span-2 text-right">Balance Due</span>
            <span className="col-span-2 text-right">Due Date</span>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-muted text-center">Loading…</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-sm text-muted text-center">No invoices match this filter.</div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => (
                <div key={inv.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-raised/40 transition-colors gap-2">
                  <div className="col-span-2 min-w-0">
                    <Link href={`/invoices/${inv.id}`} className="text-sm font-mono font-semibold text-accent hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm text-foreground truncate">{inv.account?.companyName ?? inv.accountId}</p>
                    <p className="text-xs text-muted font-mono">{inv.account?.accountNumber}</p>
                  </div>
                  <div className="col-span-1">
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="col-span-2 text-right text-sm font-semibold text-foreground">{money(inv.totalPence)}</div>
                  <div className="col-span-2 text-right text-sm font-semibold text-foreground">
                    {balanceDue(inv) > 0 ? money(balanceDue(inv)) : <span className="text-emerald-600">£0.00</span>}
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-xs text-foreground">{fmt(inv.dueDate)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {inv.status === 'DRAFT' && (
                        <button onClick={() => issue(inv.id)} disabled={!!busy}
                          className="text-[11px] px-2 py-0.5 rounded border border-blue-500/30 text-blue-600 hover:bg-blue-500/10 disabled:opacity-40">
                          {busy === `${inv.id}-issue` ? '…' : 'Issue'}
                        </button>
                      )}
                      {(inv.status === 'ISSUED' || inv.status === 'PART_PAID' || inv.status === 'OVERDUE') && (
                        <button onClick={() => voidInv(inv.id)} disabled={!!busy}
                          className="text-[11px] px-2 py-0.5 rounded border border-border text-muted hover:text-danger hover:border-danger/30 disabled:opacity-40">
                          {busy === `${inv.id}-void` ? '…' : 'Void'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground disabled:opacity-40">← Prev</button>
            <span className="text-xs text-muted">Page {page} of {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
