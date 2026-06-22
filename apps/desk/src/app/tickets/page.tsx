'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { deskApi, type BusinessTicket } from '../../lib/api';

const NAV_GROUPS = [
  { label: 'Desk', items: [
    { href: '/', label: 'Dashboard', exactMatch: true },
    { href: '/tickets', label: 'Tickets' },
  ]},
];

const STATUS_CLS: Record<string, string> = {
  OPEN:                'bg-blue-500/10 text-blue-600 border-blue-500/20',
  WAITING_CUSTOMER:    'bg-amber-500/10 text-amber-700 border-amber-500/20',
  WAITING_INTERNAL:    'bg-purple-500/10 text-purple-600 border-purple-500/20',
  WAITING_ITSI_MOBILE: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  RESOLVED:            'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  CLOSED:              'bg-border text-muted border-border',
};

const PRIORITY_CLS: Record<string, string> = {
  URGENT: 'text-danger font-semibold',
  HIGH:   'text-warning font-semibold',
  NORMAL: 'text-muted',
  LOW:    'text-muted',
};

const ALL_STATUSES  = ['', 'OPEN', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'WAITING_ITSI_MOBILE', 'RESOLVED', 'CLOSED'];
const ALL_PRIORITIES = ['', 'URGENT', 'HIGH', 'NORMAL', 'LOW'];
const ALL_CATEGORIES = ['', 'GENERAL', 'BILLING', 'MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'ACCOUNT'];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_CLS[status] ?? 'bg-border text-muted border-border'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<BusinessTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage]       = useState(1);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deskApi.tickets({
        search:   search || undefined,
        status:   status || undefined,
        priority: priority || undefined,
        page,
        limit: LIMIT,
      });
      setTickets(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } catch {
      setError('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, page]);

  useEffect(() => { setPage(1); }, [search, status, priority]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Desk' }} workspace="desk">
      <div className="flex flex-col h-full min-h-0">

        {/* Toolbar */}
        <div className="shrink-0 border-b border-border bg-surface px-5 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">

          {/* Status tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {['', 'OPEN', 'WAITING_CUSTOMER', 'WAITING_ITSI_MOBILE', 'RESOLVED', 'CLOSED'].map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  status === s ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground hover:bg-surface-raised'
                }`}>
                {s ? s.replace(/_/g, ' ') : 'All'}
              </button>
            ))}
          </div>

          <span className="hidden sm:block w-px h-4 bg-border shrink-0" />

          {/* Priority filter */}
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            className="text-xs border border-border rounded-lg bg-background px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30">
            {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{p || 'Any priority'}</option>)}
          </select>

          <p className="text-xs text-muted shrink-0 ml-auto">
            {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> tickets</>}
          </p>

          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets…"
              className="border border-border rounded-lg bg-background text-sm pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30 w-40 sm:w-52" />
          </div>

          <Link href="/tickets/new" className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 whitespace-nowrap">
            + New Ticket
          </Link>
        </div>

        {error && <div className="mx-5 mt-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger shrink-0">{error}</div>}

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-surface border-b border-border">
              <tr>
                {['Ticket', 'Subject', 'Account', 'Category', 'Status', 'Priority', 'Updated'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap">{h}</th>
                ))}
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-surface-raised rounded animate-pulse" style={{ width: j === 1 ? '160px' : '80px' }} />
                    </td>
                  ))}</tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-sm font-medium text-foreground">No tickets found</p>
                    <p className="text-xs text-muted mt-1">{search || status || priority ? 'Try adjusting your filters.' : 'Create the first ticket to get started.'}</p>
                    {!search && !status && !priority && (
                      <Link href="/tickets/new" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">Create ticket →</Link>
                    )}
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-raised/40 transition-colors group">
                    <td className="px-4 py-2.5 text-xs text-muted font-mono">{t.ticketNumber}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/tickets/${t.id}`} className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {t.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{t.account?.companyName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{t.category}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                    <td className={`px-4 py-2.5 text-xs ${PRIORITY_CLS[t.priority] ?? 'text-muted'}`}>{t.priority}</td>
                    <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">
                      {new Date(t.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/tickets/${t.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent text-lg leading-none">→</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="shrink-0 px-5 py-3 border-t border-border flex items-center justify-between gap-2 bg-surface">
            <p className="text-xs text-muted">Page {page} of {Math.ceil(total / LIMIT)}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised transition-colors">← Prev</button>
              <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage((p) => p + 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-surface-raised transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
