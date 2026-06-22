'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PORTAL_WIRING } from '@itsi-business/staff-shell';

export function PortalShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const nav = PORTAL_WIRING.navLinks;

  return (
    <div className="command-shell">
      <aside className="command-sidebar">
        <div
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.75rem',
          }}
        >
          IB
        </div>

        {nav.map((item) => {
          const active = item.exactMatch
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.enabled ? item.href : '#'}
              aria-disabled={!item.enabled}
              title={item.comingSoonReason ?? item.label}
              style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgb(var(--accent))' : 'transparent',
                color: active ? 'rgb(var(--accent-foreground))' : 'rgb(var(--muted))',
                textDecoration: 'none', fontSize: '0.9rem', lineHeight: 1,
                opacity: item.enabled ? 1 : 0.5,
                flexShrink: 0,
              }}
              className="nav-item"
            >
              <span>{item.icon}</span>
              <span className="nav-tooltip">{item.label}</span>
            </Link>
          );
        })}
      </aside>

      <div className="command-main">
        <header className="command-topbar">
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'rgb(var(--foreground))' }}>
              {title ?? 'Itsi Business Portal'}
            </span>
            {subtitle && (
              <p style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))', marginTop: 2 }}>{subtitle}</p>
            )}
          </div>
          <span style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))' }}>Customer self-service</span>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>{children}</main>
      </div>
    </div>
  );
}
