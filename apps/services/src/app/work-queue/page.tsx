'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell, SERVICES_NAV_GROUPS } from '@itsi-business/staff-shell';
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

export default function WorkQueuePage() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') ?? '';
  const [stats, setStats] = useState<WorkQueueStats | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    const params: Record<string, string> = { limit: '50' };
    if (filter === 'mine') params.assignedToMe = 'true';
    if (filter === 'unassigned') params.unassigned = 'true';
    if (filter === 'breached') params.breached = 'true';
    if (filter === 'dueSoon') params.dueSoon = 'true';
    if (filter === 'waiting') params.status = 'WAITING_ITSI_MOBILE';

    Promise.all([
      workItemsApi.stats(),
      workItemsApi.list(params),
    ]).then(([s, list]) => {
      setStats(s.data);
      setItems(list.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

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

        <div className="flex flex-wrap gap-2">
          {[
            { key: '', label: 'All open' },
            { key: 'mine', label: 'Assigned to me' },
            { key: 'unassigned', label: 'Unassigned' },
            { key: 'dueSoon', label: 'Due soon' },
            { key: 'breached', label: 'Breached' },
            { key: 'waiting', label: 'Waiting Itsi Mobile' },
          ].map((f) => (
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

        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left px-4 py-2">Priority</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Account</th>
                <th className="text-left px-4 py-2">SLA</th>
                <th className="text-left px-4 py-2">Due</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No work items match this filter.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="hover:bg-surface-raised/50">
                  <td className={`px-4 py-3 text-xs ${PRIORITY_CLS[item.priority] ?? ''}`}>{item.priority}</td>
                  <td className="px-4 py-3 text-xs text-muted">{item.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/work-queue/${item.id}`} className="font-medium text-foreground hover:text-accent">{item.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{item.account?.companyName ?? '—'}</td>
                  <td className={`px-4 py-3 text-xs font-semibold ${SLA_CLS[item.slaStatus ?? 'ON_TRACK']}`}>{item.slaStatus ?? 'ON_TRACK'}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {item.dueAt ? new Date(item.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">{item.status.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
