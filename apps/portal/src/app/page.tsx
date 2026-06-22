/**
 * Itsi Business Portal — Customer-facing Command Centre dashboard
 *
 * RULE: This is the business customer's self-service portal.
 *       No consumer signup flow. No provider portal UI.
 *       Authentication is portal-realm only (not staff-realm).
 */
'use client';
import React, { useEffect, useState } from 'react';
import { StatusPill } from '@itsi-business/ui';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

interface DashboardStats {
  accounts:  { total: number; active: number };
  tickets:   { open: number };
  services:  { active: number; mobile: number; broadband: number; energy: number };
  invoices:  { totalPence: number; overduePence: number; outstandingPence: number; collectedPence: number; draftCount: number; issuedCount: number; paidCount: number };
  staff:     { active: number };
}

function fmt(pence: number) {
  if (pence >= 100_000_00) return `£${(pence / 100_000_00).toFixed(1)}m`;
  if (pence >= 1_000_00)   return `£${(pence / 1_000_00).toFixed(1)}k`;
  return `£${(pence / 100).toFixed(0)}`;
}

async function fetchStats(): Promise<DashboardStats | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stats/dashboard`, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch { return null; }
}

/* ── Sidebar nav items — link to real app URLs ─────────────────────────── */
const NAV_ITEMS = [
  { icon: '💼', label: 'Portal',    href: WORKSPACE_URLS.portal,   active: true  },
  { icon: '⊞',  label: 'Admin',     href: WORKSPACE_URLS.admin,    active: false },
  { icon: '�', label: 'Customers', href: WORKSPACE_URLS.crm,      active: false },
  { icon: '🧾', label: 'Billing',   href: WORKSPACE_URLS.billing,  active: false },
  { icon: '🎫', label: 'Desk',      href: WORKSPACE_URLS.desk,     active: false },
  { icon: '🌐', label: 'Services',  href: WORKSPACE_URLS.services, active: false },
];

/* ── Inline SVG helpers (no extra deps) ───────────────────────────────── */
function Dot({ color }: { color: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'rgb(var(--border))', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
    </div>
  );
}

function DonutRing({ pct, size = 80, stroke = 10, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--border))" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
    </svg>
  );
}

/* ── Shared card container ─────────────────────────────────────────────── */
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`command-card flex flex-col ${className}`} style={{ gap: 0 }}>
      {children}
    </div>
  );
}

function PanelHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div style={{ borderBottom: '1px solid rgb(var(--border) / 0.5)', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
        <span style={{
          width: 20, height: 20, borderRadius: 6, background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
        }}>{number}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--foreground))' }}>
          {title}
        </span>
      </div>
      <p style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))', paddingLeft: '1.625rem' }}>{subtitle}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--muted))', marginBottom: '0.4rem' }}>{children}</p>;
}

function KpiChip({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: '0.6rem', color: 'rgb(var(--muted))', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgb(var(--foreground))', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.6rem', color: up ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>{change}</span>
    </div>
  );
}

export default function PortalHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  const c = {
    fg:      'rgb(var(--foreground))',
    muted:   'rgb(var(--muted))',
    accent:  'rgb(var(--accent))',
    accentFg:'rgb(var(--accent-foreground))',
    border:  'rgb(var(--border))',
    surface: 'rgb(var(--surface-raised))',
    success: 'rgb(var(--success))',
    warning: 'rgb(var(--warning))',
    danger:  'rgb(var(--danger))',
    info:    'rgb(var(--info))',
    navy:    'rgb(var(--brand-navy))',
    purple:  'rgb(var(--brand-purple))',
  };

  return (
    <div className="command-shell">

      {/* ── Icon sidebar ─────────────────────────────────────────────── */}
      <aside className="command-sidebar">
        {/* Logo */}
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: c.accent, color: c.accentFg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.75rem',
        }}>IB</div>

        {/* Nav icons */}
        {NAV_ITEMS.map((n) => (
          <a
            key={n.label}
            href={n.href}
            style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: n.active ? c.accent : 'transparent',
              color: n.active ? c.accentFg : c.muted,
              textDecoration: 'none', position: 'relative',
              fontSize: '0.9rem', lineHeight: 1,
              transition: 'background 120ms, color 120ms',
              flexShrink: 0,
            }}
            className="nav-item"
            title={n.label}
          >
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{n.icon}</span>
            <span className="nav-tooltip">{n.label}</span>
          </a>
        ))}

        {/* Bottom — avatar */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: c.navy, color: c.fg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 700,
          }}>DM</div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="command-main">

        {/* Topbar */}
        <header className="command-topbar">
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: c.fg, flex: 1 }}>
            Itsi Business — Command Centre
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: c.muted }}>AI-First</span>
            <span style={{ fontSize: '0.65rem', color: c.muted }}>Real-time</span>
            <span style={{ fontSize: '0.65rem', color: c.muted }}>Intelligent</span>
            <StatusPill tone="success" dot>Live</StatusPill>
          </div>
        </header>

        {/* Dashboard — 2×2 grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '0.75rem',
          padding: '0.75rem',
          minHeight: 0,
        }}>

          {/* ═══════════════════════════════════════════════════════════
              PANEL 1 — Mission Control Command Centre (top-left)
          ═══════════════════════════════════════════════════════════ */}
          <Panel>
            <PanelHeader number={1} title="Mission Control Command Centre" subtitle="Executive cockpit for real-time performance, insights and action." />

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <KpiChip label="Active Accounts"      value={stats ? String(stats.accounts.active) : '—'}  change={stats ? `${stats.accounts.total} total` : '…'} up={true}  />
              <KpiChip label="Active Services"      value={stats ? String(stats.services.active) : '—'}  change={stats ? `📱 ${stats.services.mobile} · 🌐 ${stats.services.broadband}` : '…'} up={true}  />
              <KpiChip label="Invoices Outstanding" value={stats ? fmt(stats.invoices.outstandingPence) : '—'} change={stats ? `${stats.invoices.issuedCount} invoices` : '…'} up={false} />
              <KpiChip label="Overdue"              value={stats ? fmt(stats.invoices.overduePence) : '—'}     change={stats ? (stats.invoices.overduePence === 0 ? 'None overdue ✓' : 'Action needed') : '…'} up={stats?.invoices.overduePence === 0} />
            </div>

            {/* AI insight chip */}
            <div style={{
              background: `linear-gradient(135deg, rgb(var(--brand-purple) / 0.18), rgb(var(--brand-navy) / 0.22))`,
              border: `1px solid rgb(var(--brand-purple) / 0.3)`,
              borderRadius: 10, padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1rem' }}>🤖</span>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: c.purple, marginBottom: 2 }}>AI INSIGHTS</p>
                <p style={{ fontSize: '0.65rem', color: c.muted, lineHeight: 1.4 }}>
                  Revenue predicted to increase 16% by end of May based on current trends.
                </p>
                <button style={{ fontSize: '0.6rem', color: c.accent, fontWeight: 700, marginTop: 4 }}>View full insight →</button>
              </div>
            </div>

            {/* MRR hero + quick actions side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', flex: 1, minHeight: 0 }}>

              {/* Left: MRR + mini panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{
                  background: `linear-gradient(135deg, rgb(var(--brand-navy) / 0.4), rgb(var(--surface-raised) / 0.6))`,
                  border: `1px solid rgb(var(--brand-navy) / 0.5)`,
                  borderRadius: 12, padding: '0.75rem',
                }}>
                  <p style={{ fontSize: '0.6rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total MRR</p>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, color: c.fg, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>£4,820</p>
                  <p style={{ fontSize: '0.6rem', color: c.success }}>↑ 18.5% vs last month</p>
                  <p style={{ fontSize: '0.6rem', color: c.muted, marginTop: 2 }}>Live business pulse</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'Predicted Revenue', value: '£5,230', change: '↑ 16%', color: c.success },
                    { label: 'Live Alerts',        value: '3',      change: 'Active', color: c.warning },
                    { label: 'Service Health',     value: '98.6%',  change: 'Uptime', color: c.success },
                  ].map((s) => (
                    <div key={s.label} style={{
                      background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)',
                      borderRadius: 10, padding: '0.5rem',
                    }}>
                      <p style={{ fontSize: '0.55rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                      <p style={{ fontSize: '0.55rem', color: c.muted }}>{s.change}</p>
                    </div>
                  ))}
                </div>

                {/* Billing status mini */}
                <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.5rem' }}>
                  <p style={{ fontSize: '0.55rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Billing Status</p>
                  {[
                    { label: 'Paid',    pct: 66, color: c.success },
                    { label: 'Pending', pct: 22, color: c.warning },
                    { label: 'Overdue', pct: 12, color: c.danger  },
                  ].map((b) => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.6rem', color: c.muted, width: 42 }}>{b.label}</span>
                      <MiniBar pct={b.pct} color={b.color} />
                      <span style={{ fontSize: '0.6rem', color: c.fg, fontVariantNumeric: 'tabular-nums', width: 22, textAlign: 'right' }}>{b.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Quick actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 120 }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Quick Actions</p>
                {['Create Invoice', 'Add Payment', 'New Customer', 'Raise Ticket', 'Run Dunning'].map((a) => (
                  <button key={a} style={{
                    background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))',
                    borderRadius: 8, padding: '0.35rem 0.6rem',
                    fontSize: '0.65rem', color: c.fg, cursor: 'pointer', textAlign: 'left',
                    transition: 'background 120ms',
                  }}>{a}</button>
                ))}
              </div>
            </div>
          </Panel>

          {/* ═══════════════════════════════════════════════════════════
              PANEL 2 — Customer 360 Journey Canvas (top-right)
          ═══════════════════════════════════════════════════════════ */}
          <Panel>
            <PanelHeader number={2} title="Customer 360 Journey Canvas" subtitle="A customer-centric workspace to understand, engage and delight." />

            {/* Customer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: c.navy,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: c.fg,
                }}>AC</div>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: c.fg }}>Acme Corporation</p>
                  <p style={{ fontSize: '0.6rem', color: c.muted }}>Account ID: AC-00124 · Segment: Enterprise · Owner: Sarah Johnson</p>
                </div>
                <StatusPill tone="success" dot>Active Customer</StatusPill>
              </div>
            </div>

            {/* Journey stage pills */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {['ONBOARD', 'ADOPT', 'EXPAND', 'RETAIN', 'ADVOCATE'].map((s, i) => (
                <span key={s} style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 999,
                  background: i === 1 ? c.accent : 'rgb(var(--surface-raised))',
                  color: i === 1 ? c.accentFg : c.muted,
                  border: `1px solid ${i === 1 ? c.accent : c.border}`,
                }}>{s}</span>
              ))}
            </div>

            {/* Main grid: billing + services + tickets + health */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', flex: 1, minHeight: 0 }}>

              {/* Billing summary */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Billing Summary</SectionLabel>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: c.fg }}>£24,560</p>
                <p style={{ fontSize: '0.6rem', color: c.muted }}>Total Spend (YTD)</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: c.fg }}>£4,280</p>
                    <p style={{ fontSize: '0.55rem', color: c.muted }}>Invoiced</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: c.danger }}>£0</p>
                    <p style={{ fontSize: '0.55rem', color: c.muted }}>Outstanding <span style={{ color: c.danger }}>Overdue</span></p>
                  </div>
                </div>
              </div>

              {/* Account health donut */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <SectionLabel>Account Health</SectionLabel>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DonutRing pct={82} size={70} stroke={8} color={c.success} />
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 800, color: c.success, lineHeight: 1 }}>82</p>
                    <p style={{ fontSize: '0.5rem', color: c.muted }}>Good</p>
                  </div>
                </div>
                <div style={{ fontSize: '0.55rem', color: c.muted, marginTop: 4, textAlign: 'center' }}>
                  {[['Payments','Good',c.success],['Service Usage','Good',c.success],['Engagement','At Risk',c.warning],['Support','Good',c.success]].map(([k,v,col]) => (
                    <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span>{k}</span><span style={{ color: String(col) }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Services (4)</SectionLabel>
                {[
                  { name: 'Business Fibre 300', status: 'Active', amt: '£85', tone: 'success' as const },
                  { name: 'Static IP',           status: 'Active', amt: '£35', tone: 'success' as const },
                  { name: 'Hosted VoIP',         status: 'Active', amt: '£30', tone: 'success' as const },
                  { name: 'WiFi Protect',        status: 'Trial',  amt: '£30', tone: 'info'    as const },
                ].map((s) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.6rem', color: c.fg }}>{s.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <StatusPill tone={s.tone}>{s.status}</StatusPill>
                      <span style={{ fontSize: '0.6rem', color: c.muted }}>{s.amt}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Open tickets + AI next best action */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Open Tickets (2)</SectionLabel>
                {[
                  { id: '#TK-5482', title: 'Slow speeds in office',     priority: 'High',   tone: 'danger'  as const },
                  { id: '#TK-5471', title: 'VoIP call quality issues',  priority: 'Medium', tone: 'warning' as const },
                ].map((t) => (
                  <div key={t.id} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6rem', color: c.fg }}>{t.title}</span>
                      <StatusPill tone={t.tone}>{t.priority}</StatusPill>
                    </div>
                    <span style={{ fontSize: '0.55rem', color: c.muted }}>{t.id}</span>
                  </div>
                ))}
                {/* AI next best action */}
                <div style={{ marginTop: 6, background: `rgb(var(--brand-purple) / 0.15)`, borderRadius: 8, padding: '0.4rem 0.5rem' }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 700, color: c.purple, marginBottom: 2 }}>🤖 AI Next Best Action</p>
                  <p style={{ fontSize: '0.6rem', color: c.muted, lineHeight: 1.4 }}>Acme is approaching renewal. Recommend proactive outreach with upgrade offer.</p>
                  <button style={{ fontSize: '0.6rem', color: c.accent, fontWeight: 700, marginTop: 4 }}>Create Outreach Task →</button>
                </div>
              </div>
            </div>
          </Panel>

          {/* ═══════════════════════════════════════════════════════════
              PANEL 3 — Revenue Flow Studio (bottom-left)
          ═══════════════════════════════════════════════════════════ */}
          <Panel>
            <PanelHeader number={3} title="Revenue Flow Studio" subtitle="Finance and billing at a glance with dynamic flow, forecast and recovery." />

            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[
                { label: 'Cash Collected', value: '£198,450', change: '↑ 12% last month', up: true  },
                { label: 'Outstanding',    value: '£41,230',  change: '↓ 8% last month',  up: true  },
                { label: 'Overdue',        value: '£5,920',   change: '↑ 12% last month',  up: false },
              ].map((k) => (
                <KpiChip key={k.label} {...k} />
              ))}
            </div>

            {/* Middle — revenue flow + invoice pipeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', flex: 1, minHeight: 0 }}>

              {/* Revenue flow */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Revenue Flow</SectionLabel>
                {[
                  { label: 'Subscriptions', value: '£245,600' },
                  { label: 'One-time',      value: '£56,300'  },
                  { label: 'Add-ons',       value: '£32,550'  },
                  { label: 'Other',         value: '£18,200'  },
                ].map((r) => (
                  <div key={r.label} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.6rem', color: c.muted }}>{r.label}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, color: c.fg }}>{r.value}</span>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid rgb(var(--border) / 0.5)`, paddingTop: 6, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: c.fg }}>Total Invoiced</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: c.fg }}>£352,650</span>
                  </div>
                  {[
                    { label: 'Collected',   value: '£198,450 (56%)', color: c.success },
                    { label: 'Outstanding', value: '£41,230 (12%)',  color: c.warning },
                    { label: 'Overdue',     value: '£5,920 (2%)',    color: c.danger  },
                    { label: 'Write-off',   value: '£1,850 (1%)',    color: c.muted   },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ fontSize: '0.55rem', color: c.muted }}>{r.label}</span>
                      <span style={{ fontSize: '0.55rem', color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice pipeline */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Invoice Pipeline</SectionLabel>
                {[
                  { label: 'Draft',  count: 24,  value: '£36,520',  color: c.muted   },
                  { label: 'Sent',   count: 128, value: '£156,740', color: c.info    },
                  { label: 'Viewed', count: 64,  value: '£84,230',  color: c.warning },
                  { label: 'Paid',   count: 312, value: '£198,450', color: c.success },
                ].map((p) => (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 6 }}>
                    <Dot color={p.color} />
                    <span style={{ fontSize: '0.6rem', color: c.muted, width: 40 }}>{p.label}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: c.fg, width: 22, textAlign: 'right' }}>{p.count}</span>
                    <MiniBar pct={Math.round(p.count / 4)} color={p.color} />
                    <span style={{ fontSize: '0.6rem', color: c.muted, whiteSpace: 'nowrap' }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dunning status + aging summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              {/* Dunning */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Dunning Status</SectionLabel>
                {[
                  { label: 'Stage 1', value: '£18,250', color: c.warning },
                  { label: 'Stage 2', value: '£13,300', color: c.warning },
                  { label: 'Stage 3', value: '£8,920',  color: c.danger  },
                  { label: 'Final Notice', value: '£4,560', color: c.danger },
                  { label: 'Legal',   value: '£450',    color: c.muted   },
                ].map((d) => (
                  <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.6rem', color: c.muted }}>{d.label}</span>
                    <span style={{ fontSize: '0.6rem', color: d.color, fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, borderTop: `1px solid rgb(var(--border) / 0.4)`, paddingTop: 4 }}>
                  <p style={{ fontSize: '0.6rem', color: c.muted }}>Total in Dunning</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: c.warning }}>£47,150</p>
                </div>
              </div>

              {/* Aging summary */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Aging Summary</SectionLabel>
                {[
                  { label: '0–30 Days',  value: '£41,230', pct: 100, color: c.success },
                  { label: '31–60 Days', value: '£13,120', pct: 32,  color: c.warning },
                  { label: '61–90 Days', value: '£7,850',  pct: 19,  color: c.warning },
                  { label: '90+ Days',   value: '£11,180', pct: 27,  color: c.danger  },
                ].map((a) => (
                  <div key={a.label} style={{ marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.6rem', color: c.muted }}>{a.label}</span>
                      <span style={{ fontSize: '0.6rem', color: c.fg }}>{a.value}</span>
                    </div>
                    <MiniBar pct={a.pct} color={a.color} />
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* ═══════════════════════════════════════════════════════════
              PANEL 4 — Network + CRM Intelligence Hub (bottom-right)
          ═══════════════════════════════════════════════════════════ */}
          <Panel>
            <PanelHeader number={4} title="Network + CRM Intelligence Hub" subtitle="Unify customer, network and service insights in one intelligent workspace." />

            {/* Top KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <KpiChip label="Active Accounts"    value={stats ? String(stats.accounts.active)    : '—'} change={stats ? `${stats.accounts.total} total` : '…'} up={true} />
              <KpiChip label="Active Services"    value={stats ? String(stats.services.active)    : '—'} change={stats ? `${stats.services.mobile}m · ${stats.services.broadband}bb` : '…'} up={true} />
              <KpiChip label="Staff Active"       value={stats ? String(stats.staff.active)       : '—'} change="Platform users" up={true} />
              <KpiChip label="Open Tickets"       value={stats ? String(stats.tickets.open)       : '—'} change={stats?.tickets.open === 0 ? 'All clear ✓' : 'Needs attention'} up={stats?.tickets.open === 0} />
              <KpiChip label="Invoices Collected" value={stats ? fmt(stats.invoices.collectedPence) : '—'} change={stats ? `${stats.invoices.paidCount} paid` : '…'} up={true} />
            </div>

            {/* Middle grid: network status map placeholder + top incidents */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', flex: 1, minHeight: 0 }}>

              {/* Network status placeholder */}
              <div style={{
                background: `linear-gradient(135deg, rgb(var(--brand-navy) / 0.3), rgb(var(--surface-raised) / 0.5))`,
                border: '1px solid rgb(var(--brand-navy) / 0.4)',
                borderRadius: 10, padding: '0.6rem', display: 'flex', flexDirection: 'column',
              }}>
                <SectionLabel>Network Status</SectionLabel>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 80 }}>
                  {/* Simplified network node map */}
                  {[
                    { label: 'Hull Core',     x: 50, y: 45 },
                    { label: 'East Hull',     x: 78, y: 30 },
                    { label: 'West Hull',     x: 22, y: 30 },
                    { label: 'Beverley',      x: 78, y: 15 },
                    { label: 'Cottingham',    x: 50, y: 15 },
                  ].map((node) => (
                    <div key={node.label} style={{
                      position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
                      transform: 'translate(-50%,-50%)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.success, boxShadow: `0 0 8px ${c.success}` }} />
                      <span style={{ fontSize: '0.45rem', color: c.muted, whiteSpace: 'nowrap' }}>{node.label}</span>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  {[['Healthy', c.success],['Planning', c.warning],['Critical', c.danger]].map(([l,col]) => (
                    <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Dot color={String(col)} />
                      <span style={{ fontSize: '0.5rem', color: c.muted }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top incidents */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Top Incidents</SectionLabel>
                {[
                  { title: 'Outage – East Hull',         sev: 'Major', time: 'Since 09:12 AM', tone: 'danger'  as const },
                  { title: 'Packet Loss – West Hull',    sev: 'Minor', time: 'Since 11:02 AM', tone: 'warning' as const },
                  { title: 'Latency – Cottingham',       sev: 'Warning',time: 'Since 13:33',   tone: 'warning' as const },
                ].map((inc) => (
                  <div key={inc.title} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid rgb(var(--border) / 0.4)` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                      <p style={{ fontSize: '0.6rem', color: c.fg, lineHeight: 1.3 }}>{inc.title}</p>
                      <StatusPill tone={inc.tone}>{inc.sev}</StatusPill>
                    </div>
                    <p style={{ fontSize: '0.55rem', color: c.muted, marginTop: 1 }}>{inc.time}</p>
                  </div>
                ))}
              </div>

              {/* Account risk */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Account Risk</SectionLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 8 }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DonutRing pct={46} size={66} stroke={8} color={c.warning} />
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: c.warning, lineHeight: 1 }}>46</p>
                      <p style={{ fontSize: '0.45rem', color: c.muted }}>At Risk</p>
                    </div>
                  </div>
                  <div>
                    {[['High', 12, c.danger],['Medium', 20, c.warning],['Low', 14, c.success]].map(([l,v,col]) => (
                      <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        <Dot color={String(col)} />
                        <span style={{ fontSize: '0.6rem', color: c.muted, width: 40 }}>{l}</span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: String(col) }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: at-risk accounts + cross-sell + uptime */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>

              {/* At-risk accounts */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>At Risk Accounts</SectionLabel>
                {[
                  { name: 'Umbrella Corp',    score: 72, reason: 'High ticket volume', owner: 'Marc T.' },
                  { name: 'Cyberdyne Systems',score: 65, reason: 'Low engagement',     owner: 'Lisa R.' },
                ].map((a) => (
                  <div key={a.name} style={{ marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.6rem', fontWeight: 600, color: c.fg }}>{a.name}</p>
                      <p style={{ fontSize: '0.55rem', color: c.muted }}>{a.reason} · {a.owner}</p>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: a.score >= 70 ? c.danger : c.warning }}>{a.score}</span>
                  </div>
                ))}
              </div>

              {/* Cross-sell opportunities */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Cross-sell Opportunities</SectionLabel>
                {[
                  { name: 'Acme Corporation',  opp: 'Add VoIP Service',      value: '£240/mo' },
                  { name: 'Wayne Enterprise',  opp: 'Upgrade to 500Mbps',    value: '£120/mo' },
                  { name: 'Stark Industries',  opp: 'Add Static IP',         value: '£15/mo'  },
                ].map((o) => (
                  <div key={o.name} style={{ marginBottom: 5 }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 600, color: c.fg }}>{o.name}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '0.55rem', color: c.muted }}>{o.opp}</p>
                      <span style={{ fontSize: '0.55rem', color: c.success }}>{o.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Service uptime 24h */}
              <div style={{ background: 'rgb(var(--glass) / 0.08)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 10, padding: '0.6rem' }}>
                <SectionLabel>Service Uptime (24h)</SectionLabel>
                {[
                  { name: 'Business Fibre', uptime: '99.2%', tone: 'success' as const },
                  { name: 'Hosted VoIP',    uptime: '98.7%', tone: 'success' as const },
                  { name: 'WiFi Protect',   uptime: '99.1%', tone: 'success' as const },
                  { name: 'Email Security', uptime: '99.0%', tone: 'success' as const },
                ].map((s) => (
                  <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.6rem', color: c.muted }}>{s.name}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: c.success }}>{s.uptime}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}
