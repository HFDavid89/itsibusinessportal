'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { toStaffEnergyStatusLabel } from '@itsi-business/core';
import { energyApi, fmt, type BusinessEnergyService, type EnergyDashboardStats } from '../../lib/api';

const NAV_GROUPS = [
  { label: 'Services', items: [
    { href: '/', exactMatch: true, label: 'Dashboard' },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/records', label: 'Service Records' },
    { href: '/energy', label: 'Energy Tracking' },
  ]},
];

const STATUS_CLS: Record<string, string> = {
  PROSPECT: 'bg-border/40 text-muted border-border',
  REFERRED_TO_FIDELITY: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  QUOTE_IN_PROGRESS: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  CONTRACTED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  RENEWAL_DUE: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  LOST: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  CEASED: 'bg-border text-muted border-border',
};

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

export default function EnergyDashboardPage() {
  const [stats, setStats] = useState<EnergyDashboardStats | null>(null);
  const [records, setRecords] = useState<BusinessEnergyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [filter, setFilter] = useState({ status: '', renewalDue: '', checkInDue: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, list] = await Promise.all([
        energyApi.dashboard(),
        energyApi.list({
          status: filter.status || undefined,
          renewalDue: filter.renewalDue || undefined,
          checkInDue: filter.checkInDue || undefined,
          limit: 100,
        }),
      ]);
      setStats(dash.data);
      setRecords(list.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function runAction(id: string, action: 'referred' | 'lost' | 'checkin') {
    setActionId(id);
    try {
      if (action === 'referred') await energyApi.markReferred(id);
      if (action === 'lost') await energyApi.markLost(id);
      if (action === 'checkin') await energyApi.completeCheckIn(id);
      await load();
    } finally {
      setActionId('');
    }
  }

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-5 max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Energy Account Tracking</h1>
          <p className="text-sm text-muted mt-1">
            Track referrals, renewals, and check-ins. Sales and contracts are completed manually in the Fidelity portal — not from Itsi Business.
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Energy customers" value={stats.total} />
            <StatCard label="Renewal due" value={stats.renewalDue} hint="Status RENEWAL_DUE" />
            <StatCard label="Check-ins due" value={stats.checkInsDue} />
            <StatCard label="Referrals in progress" value={stats.referralsInProgress} />
            <StatCard label="Ending in 30d" value={stats.contractsEnding.days30} />
            <StatCard label="Ending in 90d" value={stats.contractsEnding.days90} />
            <StatCard label="Contracted" value={stats.contracted} />
            <StatCard label="Lost" value={stats.lost} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
            className="text-xs rounded-lg border border-border bg-background px-3 py-2">
            <option value="">All statuses</option>
            {['PROSPECT','REFERRED_TO_FIDELITY','QUOTE_IN_PROGRESS','CONTRACTED','RENEWAL_DUE','LOST','CEASED'].map((s) => (
              <option key={s} value={s}>{toStaffEnergyStatusLabel(s)}</option>
            ))}
          </select>
          <select value={filter.renewalDue} onChange={(e) => setFilter((f) => ({ ...f, renewalDue: e.target.value, checkInDue: '' }))}
            className="text-xs rounded-lg border border-border bg-background px-3 py-2">
            <option value="">Renewal window</option>
            <option value="30">Ending in 30 days</option>
            <option value="60">Ending in 60 days</option>
            <option value="90">Ending in 90 days</option>
            <option value="180">Ending in 180 days</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input type="checkbox" checked={filter.checkInDue === 'true'}
              onChange={(e) => setFilter((f) => ({ ...f, checkInDue: e.target.checked ? 'true' : '', renewalDue: '' }))} />
            Check-ins due
          </label>
          <Link href="/records/new?type=ENERGY" className="ml-auto px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90">
            Add Energy Record
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-muted">Loading…</p>
          ) : records.length === 0 ? (
            <p className="p-6 text-sm text-muted">No energy records match the current filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted uppercase tracking-wider border-b border-border">
                    <th className="p-3">Account</th>
                    <th className="p-3">Site</th>
                    <th className="p-3">Fuel</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Contract end</th>
                    <th className="p-3">Next check-in</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="p-3">
                        <Link href={`/records/${r.id}`} className="font-semibold text-foreground hover:underline">{r.account?.companyName ?? r.accountId}</Link>
                      </td>
                      <td className="p-3 text-muted">{r.site?.name ?? '—'}</td>
                      <td className="p-3">{r.fuelType}</td>
                      <td className="p-3">{r.supplierName ?? '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_CLS[r.status] ?? STATUS_CLS.PROSPECT}`}>
                          {toStaffEnergyStatusLabel(r.status)}
                        </span>
                      </td>
                      <td className="p-3">{fmt(r.contractEndDate)}</td>
                      <td className="p-3">{fmt(r.nextCheckInDate)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {r.status === 'PROSPECT' && (
                            <button type="button" disabled={actionId === r.id} onClick={() => runAction(r.id, 'referred')}
                              className="px-2 py-1 rounded border border-border hover:bg-surface-raised disabled:opacity-50">Mark Referred</button>
                          )}
                          <button type="button" disabled={actionId === r.id} onClick={() => runAction(r.id, 'checkin')}
                            className="px-2 py-1 rounded border border-border hover:bg-surface-raised disabled:opacity-50">Check-in</button>
                          {!['LOST','CEASED'].includes(r.status) && (
                            <button type="button" disabled={actionId === r.id} onClick={() => runAction(r.id, 'lost')}
                              className="px-2 py-1 rounded border border-border hover:bg-surface-raised disabled:opacity-50">Mark Lost</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
