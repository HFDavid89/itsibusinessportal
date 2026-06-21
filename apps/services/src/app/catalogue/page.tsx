'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import { catalogueApi, money, type BusinessServiceCatalogueItem, type ServiceType, type CatalogueStatus } from '../../lib/api';

const NAV_GROUPS = [
  { label: 'Services', items: [
    { href: '/',          label: 'Dashboard',  exactMatch: true },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/records',   label: 'Service Records' },
  ]},
];

const TYPE_TABS: { label: string; value: ServiceType | '' }[] = [
  { label: 'All',       value: '' },
  { label: 'Mobile',    value: 'MOBILE' },
  { label: 'Broadband', value: 'BROADBAND' },
  { label: 'Energy',    value: 'ENERGY' },
  { label: 'Software',  value: 'SOFTWARE' },
  { label: 'Support',   value: 'SUPPORT' },
  { label: 'Other',     value: 'OTHER' },
];

const STATUS_CLS: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  INACTIVE: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  ARCHIVED: 'bg-border text-muted border-border',
};

const TYPE_CLS: Record<string, string> = {
  MOBILE:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  BROADBAND: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  ENERGY:    'bg-amber-500/10 text-amber-700 border-amber-500/20',
  SOFTWARE:  'bg-violet-500/10 text-violet-600 border-violet-500/20',
  SUPPORT:   'bg-teal-500/10 text-teal-700 border-teal-500/20',
  OTHER:     'bg-border/40 text-muted border-border',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_CLS[status] ?? STATUS_CLS.INACTIVE}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${TYPE_CLS[type] ?? TYPE_CLS.OTHER}`}>
      {type}
    </span>
  );
}

const INP = 'rounded-lg border border-border bg-background text-sm text-foreground px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30';

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <CataloguePageInner />
    </Suspense>
  );
}

function CataloguePageInner() {
  const searchParams  = useSearchParams();
  const typeParam     = (searchParams.get('serviceType') ?? '') as ServiceType | '';

  const [items,   setItems]   = useState<BusinessServiceCatalogueItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [type,    setType]    = useState<ServiceType | ''>(typeParam);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await catalogueApi.list({
        serviceType: type || undefined,
        status: 'ACTIVE' as CatalogueStatus,
        search:  search || undefined,
        page,
        limit: LIMIT,
      });
      setItems(res.data);
      setTotal(res.meta.total);
    } catch {
      setError('Failed to load catalogue');
    } finally {
      setLoading(false);
    }
  }, [type, search, page]);

  useEffect(() => { load(); }, [load]);

  async function archive(id: string) {
    if (!confirm('Archive this catalogue item? It will no longer appear in active lists.')) return;
    setBusy(id);
    setActionError('');
    try {
      await catalogueApi.archive(id);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Archive failed');
    } finally {
      setBusy(null);
    }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }}>
      <div className="p-5 max-w-6xl mx-auto space-y-4">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-foreground">Service Catalogue</h1>
            <p className="text-xs text-muted">{total} items · retail product catalogue</p>
          </div>
          <Link href="/catalogue/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90">
            + New Item
          </Link>
        </div>

        {/* Type tabs */}
        <div className="flex items-center gap-1 flex-wrap border-b border-border pb-2">
          {TYPE_TABS.map((tab) => (
            <button key={tab.value} type="button"
              onClick={() => { setType(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                type === tab.value ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground hover:bg-surface-raised'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, SKU, description…"
          className={`${INP} w-full max-w-sm`} />

        {error       && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</div>}
        {actionError && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{actionError}</div>}

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted bg-surface-raised">
            <span className="col-span-1">SKU</span>
            <span className="col-span-3">Name</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2 text-right">Retail Price</span>
            <span className="col-span-1 text-right">Term</span>
            <span className="col-span-2 text-right">Tax</span>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-muted text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-sm text-muted text-center">No catalogue items match this filter.</div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-raised/40 transition-colors gap-2">
                  <div className="col-span-1 min-w-0">
                    <span className="text-[11px] font-mono text-muted">{item.sku}</span>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <Link href={`/catalogue/${item.id}`} className="text-sm font-semibold text-accent hover:underline truncate block">
                      {item.name}
                    </Link>
                    {item.description && <p className="text-[11px] text-muted truncate">{item.description}</p>}
                  </div>
                  <div className="col-span-2"><TypeBadge type={item.serviceType} /></div>
                  <div className="col-span-1"><StatusBadge status={item.status} /></div>
                  <div className="col-span-2 text-right text-sm font-semibold text-foreground">{money(item.retailPricePence)}</div>
                  <div className="col-span-1 text-right text-xs text-muted">
                    {item.contractTermMonths ? `${item.contractTermMonths}m` : '—'}
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <span className="text-xs text-muted">{item.taxRate}%</span>
                    {item.status !== 'ARCHIVED' && (
                      <button onClick={() => archive(item.id)} disabled={busy === item.id}
                        className="text-[10px] px-2 py-0.5 rounded border border-border text-muted hover:text-danger hover:border-danger/30 disabled:opacity-40">
                        {busy === item.id ? '…' : 'Archive'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
