'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { deskApi, type BusinessTicket } from '../lib/api';

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
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_CLS[status] ?? 'bg-border text-muted border-border'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function DeskDashboardPage() {
  const [tickets, setTickets] = useState<BusinessTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const [counts, setCounts] = useState({ open: 0, urgent: 0, escalated: 0, resolved: 0 });

  useEffect(() => {
    Promise.all([
      deskApi.tickets({ limit: 10 }),
      deskApi.tickets({ status: 'OPEN' }),
      deskApi.tickets({ priority: 'URGENT' }),
      deskApi.tickets({ status: 'WAITING_ITSI_MOBILE' }),
      deskApi.tickets({ status: 'RESOLVED' }),
    ])
      .then(([recent, open, urgent, escalated, resolved]) => {
        setTickets(recent.data);
        setCounts({
          open:      open.meta?.total ?? open.data.length,
          urgent:    urgent.meta?.total ?? urgent.data.length,
          escalated: escalated.meta?.total ?? escalated.data.length,
          resolved:  resolved.meta?.total ?? resolved.data.length,
        });
      })
      .catch(() => setError('Failed to load desk data'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Open', value: counts.open, href: '/tickets?status=OPEN' },
    { label: 'Urgent', value: counts.urgent, href: '/tickets?priority=URGENT' },
    { label: 'Awaiting Escalation', value: counts.escalated, href: '/tickets?status=WAITING_ITSI_MOBILE' },
    { label: 'Resolved', value: counts.resolved, href: '/tickets?status=RESOLVED' },
  ];

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Desk' }}>
      <div className="p-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold text-foreground">Support Desk</h1>
            <p className="text-xs text-muted">Business customer ticket management</p>
          </div>
          <Link href="/tickets/new" className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90">
            + New Ticket
          </Link>
        </div>

        {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-colors">
              <p className="text-xs text-muted">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{loading ? '—' : s.value}</p>
            </Link>
          ))}
        </div>

        {/* Recent tickets */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Tickets</h2>
            <Link href="/tickets" className="text-xs text-accent hover:underline">View all →</Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border/60">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="h-4 bg-surface-raised rounded animate-pulse flex-1" />
                  <div className="h-4 w-20 bg-surface-raised rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No tickets yet</p>
              <p className="text-xs text-muted mt-1">Create the first ticket to get started</p>
              <Link href="/tickets/new" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">Create ticket →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {tickets.map((t) => (
                <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                    <p className="text-xs text-muted">{t.ticketNumber} · {t.account?.companyName}</p>
                  </div>
                  <StatusBadge status={t.status} />
                  <span className={`text-xs shrink-0 ${PRIORITY_CLS[t.priority] ?? 'text-muted'}`}>{t.priority}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
