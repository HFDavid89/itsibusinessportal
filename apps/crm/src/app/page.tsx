'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { crmApi, type BusinessAccount } from '../lib/api';

const NAV_GROUPS = [
  {
    label: 'CRM',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/accounts', label: 'Business Accounts' },
    ],
  },
];

const STATUS_COLOURS: Record<string, string> = {
  PROSPECT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  SUSPENDED: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  CLOSED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOURS[status] ?? 'bg-border text-muted border-border'}`}>
      {status}
    </span>
  );
}

export default function CrmDashboardPage() {
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    crmApi.accounts({ limit: 200 })
      .then((r) => setAccounts(r.data))
      .catch(() => setError('Unable to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  const total = accounts.length;
  const active = accounts.filter((a) => a.status === 'ACTIVE').length;
  const prospects = accounts.filter((a) => a.status === 'PROSPECT').length;
  const suspended = accounts.filter((a) => a.status === 'SUSPENDED').length;
  const recent = [...accounts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'CRM' }} workspace="crm">
      <div className="max-w-[1200px] mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">CRM Dashboard</h1>
            <p className="text-sm text-muted mt-0.5">Business account overview</p>
          </div>
          <Link
            href="/accounts/new"
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + New Account
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Accounts', value: loading ? '…' : String(total) },
            { label: 'Active', value: loading ? '…' : String(active), accent: true },
            { label: 'Prospects', value: loading ? '…' : String(prospects) },
            { label: 'Suspended', value: loading ? '…' : String(suspended), warn: suspended > 0 },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs text-muted font-medium uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.accent ? 'text-accent' : s.warn ? 'text-amber-600' : 'text-foreground'}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        {/* Recent accounts */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Accounts</h2>
            <Link href="/accounts" className="text-xs text-accent hover:underline">View all →</Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border/60">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4 animate-pulse">
                  <div className="h-4 w-48 bg-surface-raised rounded" />
                  <div className="h-4 w-16 bg-surface-raised rounded ml-auto" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No accounts yet</p>
              <p className="text-xs text-muted mt-1">Create your first business account to get started.</p>
              <Link href="/accounts/new" className="mt-4 inline-block text-xs font-semibold text-accent hover:underline">
                Create account →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recent.map((a) => {
                const primary = a.contacts?.[0];
                return (
                  <Link
                    key={a.id}
                    href={`/accounts/${a.id}`}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-surface-raised/40 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                        {a.companyName}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {a.accountNumber}
                        {primary && ` · ${primary.firstName} ${primary.lastName}`}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-muted whitespace-nowrap hidden sm:block">
                      {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent text-lg leading-none">→</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
