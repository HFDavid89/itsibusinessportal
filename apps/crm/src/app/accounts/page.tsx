'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { crmApi, type BusinessAccount } from '../../lib/api';

const NAV_GROUPS = [
  {
    label: 'CRM',
    items: [
      { href: '/', label: 'Dashboard' },
      { href: '/accounts', label: 'Business Accounts', exactMatch: false },
    ],
  },
];

const STATUS_COLOURS: Record<string, string> = {
  PROSPECT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  SUSPENDED: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  CLOSED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const STATUSES = ['', 'PROSPECT', 'ACTIVE', 'SUSPENDED', 'CLOSED'];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOURS[status] ?? 'bg-border text-muted border-border'}`}>
      {status}
    </span>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.accounts({ search: search || undefined, status: status || undefined, page, limit: LIMIT });
      setAccounts(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } catch {
      setError('Unable to load accounts. Check your connection and try again.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'CRM' }}>
      <div className="flex flex-col h-full min-h-0">

        {/* Toolbar */}
        <div className="shrink-0 border-b border-border bg-surface px-5 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">

          {/* Status tabs */}
          <div className="flex items-center gap-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  status === s ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          <span className="hidden sm:block w-px h-4 bg-border shrink-0" />

          <p className="text-xs text-muted shrink-0">
            {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> accounts</>}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts…"
                className="border border-border rounded-lg bg-background text-sm pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30 w-40 sm:w-52"
              />
            </div>
            <Link
              href="/accounts/new"
              className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 whitespace-nowrap"
            >
              + New Account
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger shrink-0">{error}</div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="sticky top-0 z-10 bg-surface border-b border-border">
              <tr>
                {['Account', 'Account No.', 'Primary Contact', 'Status', 'Contacts', 'Sites', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface-raised rounded animate-pulse" style={{ width: j === 0 ? '160px' : '80px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-sm font-medium text-foreground">No accounts found</p>
                    <p className="text-xs text-muted mt-1">
                      {search || status ? 'Try adjusting your filters.' : 'Create your first business account to get started.'}
                    </p>
                    {!search && !status && (
                      <Link href="/accounts/new" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
                        Create account →
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                accounts.map((a) => {
                  const primary = a.contacts?.[0];
                  return (
                    <tr key={a.id} className="hover:bg-surface-raised/40 transition-colors group">
                      <td className="px-4 py-2.5">
                        <Link href={`/accounts/${a.id}`} className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                          {a.companyName}
                          {a.tradingName && a.tradingName !== a.companyName && (
                            <span className="ml-1 font-normal text-muted text-xs">({a.tradingName})</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted font-mono">{a.accountNumber}</td>
                      <td className="px-4 py-2.5 text-xs text-foreground">
                        {primary ? `${primary.firstName} ${primary.lastName}` : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-2.5 text-xs text-muted">{a._count?.contacts ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{a._count?.sites ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/accounts/${a.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent text-lg leading-none">→</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="shrink-0 px-5 py-3 border-t border-border flex items-center justify-between gap-2 bg-surface">
            <p className="text-xs text-muted">Page {page} of {Math.ceil(total / LIMIT)}</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / LIMIT)}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
