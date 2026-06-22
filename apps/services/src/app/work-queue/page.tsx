'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell, SERVICES_NAV_GROUPS } from '@itsi-business/staff-shell';
import { DataTable, FilterBar, StaffEmptyState } from '@itsi-business/ui';
import { workItemsApi, type WorkItem, type WorkQueueStats } from '../../lib/api';

const SLA_CLS: Record<string, string> = {
  ON_TRACK: 'text-success',
  DUE_SOON: 'text-warning',
  BREACHED: 'text-danger',
  COMPLETED: 'text-muted',
};

const PRIORITY_CLS: Record<string, string> = {
  URGENT: 'text-danger font-bold',
  HIGH: 'text-warning font-semibold',
  NORMAL: 'text-foreground',
  LOW: 'text-muted',
};

function StatCard({ label, value, href, accent }: { label: string; value: number; href?: string; accent?: boolean }) {
  const inner = (
    <div className={`rounded-2xl border px-4 py-3 ${accent ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const FILTER_CHIPS = [
  { key: '', label: 'All open' },
  { key: 'mine', label: 'Assigned to me' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'dueSoon', label: 'Due soon' },
  { key: 'breached', label: 'Breached' },
  { key: 'waiting', label: 'Waiting Itsi Mobile' },
];

export default function WorkQueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <WorkQueuePageInner />
    </Suspense>
  );
}

function WorkQueuePageInner() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') ?? '';
  const accountIdParam = searchParams.get('accountId') ?? '';

  const [stats, setStats] = useState<WorkQueueStats | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [accountId, setAccountId] = useState(accountIdParam);

  useEffect(() => {
    const params: Record<string, string> = { limit: '50' };
    if (filter === 'mine') params.assignedToMe = 'true';
    if (filter === 'unassigned') params.unassigned = 'true';
    if (filter === 'breached') params.breached = 'true';
    if (filter === 'dueSoon') params.dueSoon = 'true';
    if (filter === 'waiting') params.status = 'WAITING_ITSI_MOBILE';
    if (accountId) params.accountId = accountId;

    Promise.all([
      workItemsApi.stats(),
      workItemsApi.list(params),
    ]).then(([s, list]) => {
      setStats(s.data);
      setItems(list.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filter, accountId]);

  return (
    <AppShell navGroups={SERVICES_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-5 space-y-5 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Work Queue</h1>
          <p className="text-sm text-muted mt-1">Staff operational requests, SLA tracking, and wholesale follow-up.</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Open" value={stats.open} href="/work-queue" />
            <StatCard label="Assigned to me" value={stats.assignedToMe} href="/work-queue?filter=mine" accent />
            <StatCard label="Unassigned" value={stats.unassigned} href="/work-queue?filter=unassigned" />
            <StatCard label="Due soon" value={stats.dueSoon} href="/work-queue?filter=dueSoon" accent />
            <StatCard label="Breached" value={stats.breached} href="/work-queue?filter=breached" accent />
            <StatCard label="Waiting Itsi Mobile" value={stats.waitingItsiMobile} href="/work-queue?filter=waiting" />
            <StatCard label="Product enquiries" value={stats.productEnquiries} />
            <StatCard label="Energy reviews" value={stats.energyReviews} />
          </div>
        )}

        <FilterBar search={accountId} onSearchChange={setAccountId} searchPlaceholder="Filter by account ID…">
          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => { setLoading(true); setFilter(f.key); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === f.key ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </FilterBar>

        {loading ? (
          <div className="text-sm text-muted text-center py-12">Loading work items…</div>
        ) : items.length === 0 ? (
          <StaffEmptyState title="No work items" message="No items match the current filter." />
        ) : (
          <DataTable
            rows={items}
            rowKey={(item) => item.id}
            columns={[
              { key: 'priority', header: 'Priority', cell: (item) => <span className={`text-xs ${PRIORITY_CLS[item.priority] ?? ''}`}>{item.priority}</span> },
              { key: 'type', header: 'Type', cell: (item) => <span className="text-xs text-muted">{item.type.replace(/_/g, ' ')}</span> },
              { key: 'title', header: 'Title', cell: (item) => (
                <Link href={`/work-queue/${item.id}`} className="font-medium text-foreground hover:text-accent">{item.title}</Link>
              ) },
              { key: 'account', header: 'Account', cell: (item) => <span className="text-xs text-muted">{item.account?.companyName ?? '—'}</span> },
              { key: 'sla', header: 'SLA', cell: (item) => <span className={`text-xs font-semibold ${SLA_CLS[item.slaStatus ?? 'ON_TRACK']}`}>{item.slaStatus ?? 'ON_TRACK'}</span> },
              { key: 'due', header: 'Due', cell: (item) => (
                <span className="text-xs text-muted">
                  {item.dueAt ? new Date(item.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              ) },
              { key: 'status', header: 'Status', cell: (item) => <span className="text-xs">{item.status.replace(/_/g, ' ')}</span> },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
