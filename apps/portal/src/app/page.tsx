'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel } from '../components/PortalPage';
import { PortalQuickActions } from '../components/PortalQuickActions';
import { portalApi, fmtPence, fmtDate, TICKET_STATUS_LABELS, type PortalDashboard, type PortalMe } from '../lib/api';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel>
      <p style={{ fontSize: '0.6rem', color: 'rgb(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(var(--foreground))', marginTop: 4 }}>{value}</p>
      {hint && <p style={{ fontSize: '0.6rem', color: 'rgb(var(--muted))', marginTop: 2 }}>{hint}</p>}
    </Panel>
  );
}

export default function PortalDashboardPage() {
  const [me, setMe] = useState<PortalMe | null>(null);
  const [stats, setStats] = useState<PortalDashboard | null>(null);

  useEffect(() => {
    Promise.all([portalApi.me(), portalApi.dashboard()]).then(([meData, dashData]) => {
      setMe(meData);
      setStats(dashData);
    });
  }, []);

  const company = me?.account?.companyName ?? stats?.account?.companyName ?? 'Your account';
  const accountNumber = me?.account?.accountNumber ?? stats?.account?.accountNumber;

  return (
    <PortalPage title={company} subtitle={accountNumber ? `${accountNumber} · ${me?.account?.status ?? stats?.account?.status}` : undefined}>
      <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Account overview</h1>
            <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 2 }}>Your business account at a glance</p>
          </div>
          <StatusPill tone="success" dot>Live data</StatusPill>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <StatCard label="Active services" value={stats ? String(stats.services.active) : '—'} hint={stats ? `${stats.services.mobile} mobile · ${stats.services.broadband} broadband · ${stats.services.energy} energy` : undefined} />
          <StatCard label="Open tickets" value={stats ? String(stats.tickets.open) : '—'} />
          <StatCard label="Outstanding" value={stats ? fmtPence(stats.invoices.outstandingPence) : '—'} hint={stats ? `${stats.invoices.issuedCount} invoices` : undefined} />
          <StatCard label="Overdue" value={stats ? fmtPence(stats.invoices.overduePence) : '—'} hint={stats?.invoices.overduePence === 0 ? 'None overdue' : 'Please review billing'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'start' }}>
          <Panel>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Recent invoices</h2>
            {!stats?.invoices.recent.length ? (
              <p style={{ fontSize: '0.8rem', color: 'rgb(var(--muted))' }}>No invoices yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.invoices.recent.map((inv) => (
                  <Link key={inv.id} href={`/billing/${inv.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>{inv.invoiceNumber}</span>
                      <span style={{ fontWeight: 600 }}>{fmtPence(inv.balanceDuePence)}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))' }}>{inv.status} · due {fmtDate(inv.dueDate)}</div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/billing" style={{ fontSize: '0.7rem', color: 'rgb(var(--accent))', fontWeight: 600, marginTop: 8, display: 'inline-block' }}>View all invoices →</Link>
          </Panel>

          <Panel>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Recent tickets</h2>
            {!stats?.tickets.recent.length ? (
              <p style={{ fontSize: '0.8rem', color: 'rgb(var(--muted))' }}>No support tickets.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.tickets.recent.map((t) => (
                  <Link key={t.id} href={`/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.subject}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))' }}>{t.ticketNumber} · {TICKET_STATUS_LABELS[t.status] ?? t.status}</div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/tickets" style={{ fontSize: '0.7rem', color: 'rgb(var(--accent))', fontWeight: 600, marginTop: 8, display: 'inline-block' }}>View all tickets →</Link>
          </Panel>

          <PortalQuickActions />
        </div>

        <Panel>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>Service health</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgb(var(--muted))' }}>
            Live service status monitoring is not yet available. View your active services on the{' '}
            <Link href="/services" style={{ color: 'rgb(var(--accent))' }}>Services</Link> page.
          </p>
        </Panel>
      </div>
    </PortalPage>
  );
}
