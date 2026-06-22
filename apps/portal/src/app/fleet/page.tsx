'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, EmptyState, DisabledAction } from '../../components/PortalPage';
import { portalApi, fmtPence, type PortalFleetItem } from '../../lib/api';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'REQUESTED', 'SUSPENDED', 'CEASED'] as const;

export default function FleetPage() {
  const [sims, setSims] = useState<PortalFleetItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    portalApi.fleet().then(setSims);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sims.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!q) return true;
      return [s.displayName, s.mobileNumber, s.simLabel, s.costCentre, s.serviceReference]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [sims, statusFilter, search]);

  const counts = useMemo(() => ({
    active: sims.filter((s) => s.status === 'ACTIVE').length,
    requested: sims.filter((s) => s.status === 'REQUESTED').length,
    suspended: sims.filter((s) => s.status === 'SUSPENDED').length,
    ceased: sims.filter((s) => s.status === 'CEASED').length,
  }), [sims]);

  return (
    <PortalPage title="Mobile fleet & SIMs" subtitle={`${sims.length} lines`}>
      <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sims.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {(['active', 'requested', 'suspended', 'ceased'] as const).map((k) => (
              <Panel key={k}>
                <p style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))', textTransform: 'uppercase' }}>{k}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{counts[k]}</p>
              </Panel>
            ))}
          </div>
        )}

        {sims.length > 0 && (
          <Panel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="search"
                placeholder="Search number, label, cost centre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: '1 1 200px', padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }}
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f} value={f}>{f === 'ALL' ? 'All statuses' : f}</option>
                ))}
              </select>
            </div>
          </Panel>
        )}

        {!sims.length ? (
          <EmptyState message="No mobile lines on your account." />
        ) : !filtered.length ? (
          <EmptyState message="No SIMs match your filters." />
        ) : (
          <Panel>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'rgb(var(--muted))', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                  <th>Label</th><th>Number</th><th>SIM</th><th>Cost centre</th><th>Status</th><th>Price</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                    <td style={{ padding: '0.5rem 0' }}>
                      <Link href={`/fleet/${s.id}`} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>{s.displayName}</Link>
                    </td>
                    <td>{s.mobileNumber ?? '—'}</td>
                    <td>{s.simLabel ?? '—'}</td>
                    <td>{s.costCentre ?? '—'}</td>
                    <td><StatusPill tone={s.status === 'ACTIVE' ? 'success' : 'default'}>{s.statusLabel ?? s.status}</StatusPill></td>
                    <td>{fmtPence(s.retailPricePence)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Link href={`/fleet/${s.id}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>Details</Link>
                        <DisabledAction label="SIM swap" reason="Coming soon — contact support to request this change" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    </PortalPage>
  );
}
