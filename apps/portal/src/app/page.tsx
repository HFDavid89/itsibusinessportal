'use client';

import { useEffect, useState } from 'react';
import { StatusPill } from '@itsi-business/ui';
import { PortalShell } from '../components/PortalShell';
import { PortalQuickActions } from '../components/PortalQuickActions';
import { portalApi, fmtPence, type PortalDashboard, type PortalMe } from '../lib/api';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      style={{
        background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))',
        borderRadius: 12, padding: '0.75rem 1rem',
      }}
    >
      <p style={{ fontSize: '0.6rem', color: 'rgb(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(var(--foreground))', marginTop: 4 }}>{value}</p>
      {hint && <p style={{ fontSize: '0.6rem', color: 'rgb(var(--muted))', marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

export default function PortalDashboardPage() {
  const [me, setMe] = useState<PortalMe | null>(null);
  const [stats, setStats] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([portalApi.me(), portalApi.dashboard()]).then(([meData, dashData]) => {
      setMe(meData);
      setStats(dashData);
      setLoading(false);
    });
  }, []);

  const company = me?.account?.companyName ?? 'Your account';
  const subtitle = me?.account
    ? `${me.account.accountNumber} · ${me.account.status}`
    : 'Sign in to view your account overview';

  return (
    <PortalShell title={company} subtitle={subtitle}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgb(var(--foreground))' }}>Account overview</h1>
            <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 2 }}>
              Customer-scoped data only — no staff or platform totals.
            </p>
          </div>
          {me ? (
            <StatusPill tone="success" dot>Authenticated</StatusPill>
          ) : (
            <StatusPill tone="warning" dot>{loading ? 'Loading…' : 'Not signed in'}</StatusPill>
          )}
        </div>

        {!loading && !me && (
          <div
            style={{
              background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))',
              borderRadius: 12, padding: '1rem',
            }}
          >
            <p style={{ fontSize: '0.85rem', color: 'rgb(var(--foreground))' }}>
              Portal login is required to load your account data.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 4 }}>
              Use a portal-realm contact account. Staff credentials cannot access this dashboard.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <StatCard
            label="Active services"
            value={stats ? String(stats.services.active) : '—'}
            hint={stats ? `Mobile ${stats.services.mobile} · Broadband ${stats.services.broadband}` : undefined}
          />
          <StatCard
            label="Open tickets"
            value={stats ? String(stats.tickets.open) : '—'}
          />
          <StatCard
            label="Outstanding"
            value={stats ? fmtPence(stats.invoices.outstandingPence) : '—'}
            hint={stats ? `${stats.invoices.issuedCount} invoices` : undefined}
          />
          <StatCard
            label="Overdue"
            value={stats ? fmtPence(stats.invoices.overduePence) : '—'}
            hint={stats?.invoices.overduePence === 0 ? 'None overdue' : 'Action may be required'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
          <div
            style={{
              background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))',
              borderRadius: 12, padding: '1rem',
            }}
          >
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgb(var(--foreground))', marginBottom: '0.5rem' }}>What you can do here</p>
            <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', lineHeight: 1.6 }}>
              This is your business customer portal. Use the sidebar to navigate account areas.
              Detailed self-service features (invoices, tickets, fleet, users) are placeholder pages until Phase 9B.
            </p>
          </div>
          <PortalQuickActions />
        </div>
      </div>
    </PortalShell>
  );
}
