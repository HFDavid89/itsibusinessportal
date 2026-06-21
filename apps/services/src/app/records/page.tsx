'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import { servicesApi, fmt, money, type AnyService } from '../../lib/api';

const NAV_GROUPS = [
  { label: 'Services', items: [
    { href: '/',          label: 'Dashboard',  exactMatch: true },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/records',   label: 'Service Records' },
  ]},
];

const TYPE_TABS = [
  { label: 'All',       value: '' },
  { label: 'Mobile',    value: 'MOBILE' },
  { label: 'Broadband', value: 'BROADBAND' },
  { label: 'Energy',    value: 'ENERGY' },
] as const;

const STATUS_CLS: Record<string, string> = {
  DRAFT:      'bg-border/40 text-muted border-border',
  REQUESTED:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACTIVE:     'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  SUSPENDED:  'bg-amber-500/10 text-amber-700 border-amber-500/20',
  CEASED:     'bg-rose-500/10 text-rose-600 border-rose-500/20',
  CANCELLED:  'bg-border text-muted border-border',
};

const TYPE_CLS: Record<string, string> = {
  MOBILE:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  BROADBAND: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  ENERGY:    'bg-amber-500/10 text-amber-700 border-amber-500/20',
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_CLS[status] ?? STATUS_CLS.DRAFT}`}>{status}</span>;
}

function TypeBadge({ type }: { type: string }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${TYPE_CLS[type] ?? 'bg-border/40 text-muted border-border'}`}>{type}</span>;
}

const INP = 'rounded-lg border border-border bg-background text-sm text-foreground px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30';

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <RecordsPageInner />
    </Suspense>
  );
}

function RecordsPageInner() {
  const searchParams = useSearchParams();
  const typeParam    = (searchParams.get('type') ?? '') as '' | 'MOBILE' | 'BROADBAND' | 'ENERGY';

  const [services, setServices] = useState<AnyService[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [type,     setType]     = useState<'' | 'MOBILE' | 'BROADBAND' | 'ENERGY'>(typeParam);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await servicesApi.list({ type: type || undefined, page, limit: LIMIT });
      const filtered = search
        ? res.data.filter((s) =>
            s.displayName.toLowerCase().includes(search.toLowerCase()) ||
            s.serviceReference.toLowerCase().includes(search.toLowerCase())
          )
        : res.data;
      setServices(filtered);
      setTotal(res.meta.total);
    } catch {
      setError('Failed to load service records');
    } finally {
      setLoading(false);
    }
  }, [type, search, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }}>
      <div className="p-5 max-w-6xl mx-auto space-y-4">

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-foreground">Service Records</h1>
            <p className="text-xs text-muted">{total} total · retail service records</p>
          </div>
          <Link href="/records/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90">
            + New Service
          </Link>
        </div>

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
          placeholder="Search name, reference…"
          className={`${INP} w-full max-w-sm`} />

        {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</div>}

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted bg-surface-raised">
            <span className="col-span-3">Service</span>
            <span className="col-span-3">Account</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1 text-right">Price</span>
            <span className="col-span-1 text-right">Created</span>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-muted text-center">Loading…</div>
          ) : services.length === 0 ? (
            <div className="p-8 text-sm text-muted text-center">No service records match this filter.</div>
          ) : (
            <div className="divide-y divide-border">
              {services.map((svc) => (
                <div key={svc.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-raised/40 transition-colors gap-2">
                  <div className="col-span-3 min-w-0">
                    <Link href={`/records/${svc.id}`} className="text-sm font-semibold text-accent hover:underline truncate block">
                      {svc.displayName}
                    </Link>
                    <p className="text-[11px] text-muted font-mono">{svc.serviceReference}</p>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm text-foreground truncate">{svc.account?.companyName ?? svc.accountId}</p>
                    <p className="text-[11px] text-muted font-mono">{svc.account?.accountNumber}</p>
                  </div>
                  <div className="col-span-2"><TypeBadge type={svc._serviceType} /></div>
                  <div className="col-span-2"><StatusBadge status={svc.status} /></div>
                  <div className="col-span-1 text-right text-sm font-semibold text-foreground">
                    {'retailPricePence' in svc ? money((svc as any).retailPricePence) : '—'}
                  </div>
                  <div className="col-span-1 text-right text-xs text-muted">{fmt(svc.createdAt)}</div>
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
