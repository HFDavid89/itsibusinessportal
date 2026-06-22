'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import { DataTable, FilterBar, StaffEmptyState } from '@itsi-business/ui';
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_CLS[status] ?? 'bg-border text-muted border-border'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'WAITING_CUSTOMER', label: 'Waiting customer' },
  { value: 'WAITING_INTERNAL', label: 'Waiting internal' },
  { value: 'WAITING_ITSI_MOBILE', label: 'Waiting Itsi Mobile' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Any priority' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LOW', label: 'Low' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Any category' },
  { value: 'GENERAL', label: 'General' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'BROADBAND', label: 'Broadband' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'ACCOUNT', label: 'Account' },
];

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <TicketsPageInner />
    </Suspense>
  );
}

function TicketsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId') ?? '';

  const [tickets, setTickets] = useState<BusinessTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(searchParams.get('status') ?? '');
  const [priority, setPriority] = useState(searchParams.get('priority') ?? '');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(accountIdParam);
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
        category: category || undefined,
        accountId: accountId || undefined,
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
  }, [search, status, priority, category, accountId, page]);

  useEffect(() => { setPage(1); }, [search, status, priority, category, accountId]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Desk' }} workspace="desk">
      <div className="flex flex-col h-full min-h-0 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">Ticket queue</h1>
            <p className="text-sm text-muted">{loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> tickets</>}</p>
          </div>
          <Link href="/tickets/new" className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 whitespace-nowrap">
            + New Ticket
          </Link>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tickets…"
          filters={[
            { id: 'status', value: status, onChange: setStatus, label: 'Status', options: STATUS_OPTIONS },
            { id: 'priority', value: priority, onChange: setPriority, label: 'Priority', options: PRIORITY_OPTIONS },
            { id: 'category', value: category, onChange: setCategory, label: 'Category', options: CATEGORY_OPTIONS },
          ]}
        >
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Account ID filter"
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground min-w-[180px]"
          />
        </FilterBar>

        {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

        {loading ? (
          <div className="text-sm text-muted text-center py-12">Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <StaffEmptyState
            title="No tickets found"
            message={search || status || priority || category || accountId ? 'Try adjusting your filters.' : 'Create the first ticket to get started.'}
            action={!search && !status && !priority && !category && !accountId ? { label: 'Create ticket', href: '/tickets/new' } : undefined}
          />
        ) : (
          <DataTable
            rows={tickets}
            rowKey={(t) => t.id}
            onRowClick={(t) => router.push(`/tickets/${t.id}`)}
            columns={[
              { key: 'number', header: 'Ticket', cell: (t) => <span className="text-xs font-mono text-muted">{t.ticketNumber}</span> },
              { key: 'subject', header: 'Subject', cell: (t) => <span className="text-sm font-semibold text-foreground">{t.subject}</span> },
              { key: 'account', header: 'Account', cell: (t) => <span className="text-xs text-muted">{t.account?.companyName ?? '—'}</span> },
              { key: 'category', header: 'Category', cell: (t) => <span className="text-xs text-muted">{t.category}</span> },
              { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
              { key: 'priority', header: 'Priority', cell: (t) => <span className={`text-xs ${PRIORITY_CLS[t.priority] ?? 'text-muted'}`}>{t.priority}</span> },
              { key: 'work', header: 'Work', cell: (t) => (
                <span className="text-xs text-muted">{(t.workItems?.length ?? 0) > 0 ? `${t.workItems!.length} item(s)` : '—'}</span>
              ) },
              { key: 'updated', header: 'Updated', cell: (t) => (
                <span className="text-xs text-muted whitespace-nowrap">
                  {new Date(t.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              ) },
            ]}
          />
        )}

        {total > LIMIT && (
          <div className="flex items-center justify-between gap-2">
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
