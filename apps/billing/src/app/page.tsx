'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { billingApi, money, type BusinessInvoice } from '../lib/api';

const NAV_GROUPS = [
  { label: 'Billing', items: [
    { href: '/', label: 'Dashboard', exactMatch: true },
    { href: '/invoices', label: 'Invoices' },
  ]},
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

interface Stats { draft: number; issued: number; overdue: number; paidMtd: number; totalPendingPence: number; }

export default function BillingDashboardPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [recent, setRecent]   = useState<BusinessInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      billingApi.invoices({ limit: 200 }),
    ]).then(([res]) => {
      const all = res.data;
      const now = new Date();
      const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats({
        draft:             all.filter((i) => i.status === 'DRAFT').length,
        issued:            all.filter((i) => i.status === 'ISSUED').length,
        overdue:           all.filter((i) => i.status === 'OVERDUE').length,
        paidMtd:           all.filter((i) => i.status === 'PAID' && new Date(i.updatedAt) >= mtdStart).length,
        totalPendingPence: all.filter((i) => ['ISSUED', 'PART_PAID', 'OVERDUE'].includes(i.status))
          .reduce((s, i) => s + Math.max(0, i.totalPence - i.amountPaidPence), 0),
      });
      setRecent(all.filter((i) => i.status !== 'VOID').slice(0, 8));
    }).catch(() => setError('Failed to load billing data'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Draft',           value: stats ? String(stats.draft)   : '—', href: '/invoices?status=DRAFT',   cls: 'text-muted' },
    { label: 'Issued',          value: stats ? String(stats.issued)  : '—', href: '/invoices?status=ISSUED',  cls: 'text-blue-600' },
    { label: 'Overdue',         value: stats ? String(stats.overdue) : '—', href: '/invoices?status=OVERDUE', cls: 'text-rose-600' },
    { label: 'Balance Pending', value: stats ? money(stats.totalPendingPence) : '—', href: '/invoices', cls: 'text-amber-700' },
  ];

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Billing' }} workspace="billing">
      <div className="p-5 space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">Billing</h1>
            <p className="text-sm text-muted">Retail invoices — manual, offline-safe workflow.</p>
          </div>
          <Link href="/invoices/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90">
            + New Invoice
          </Link>
        </div>

        {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((c) => (
            <Link key={c.label} href={c.href}
              className="bg-surface border border-border rounded-2xl p-4 hover:bg-surface-raised transition-colors block">
              <p className="text-xs text-muted mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.cls}`}>{loading ? '—' : c.value}</p>
            </Link>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted text-center">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-sm text-muted text-center">No invoices yet. Create the first one.</div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-semibold text-foreground">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted truncate">{inv.account?.companyName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">{money(inv.totalPence)}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Wholesale reconciliation — deferred until wholesale billing E2E (13B-2+) */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-foreground">Wholesale Reconciliation</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-border/50 text-muted border border-border font-semibold">Deferred</span>
          </div>
          <p className="text-xs text-muted">
            Reconcile Itsi Business retail invoices against Itsi Mobile wholesale billing once{' '}
            <code className="text-[10px] bg-surface-raised px-1 rounded">ITSI_MOBILE_WHOLESALE_BILLING_ENABLED</code>{' '}
            and 13B-2 staging E2E pass. No wholesale billing calls are made in this phase.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
