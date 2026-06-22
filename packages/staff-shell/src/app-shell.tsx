'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isExternalHref, WORKSPACE_URLS } from './workspace-urls';
import { useAuth } from './auth-context';

export interface NavItemDef {
  href: string;
  label: string;
  icon?: React.ReactNode;
  exactMatch?: boolean;
  external?: boolean;
}

export interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

export interface AppShellBrand {
  name: string;
  badge?: string;
  /** Two-letter monogram shown in the logo badge */
  monogram?: string;
}

export interface AppShellProps {
  navGroups: NavGroupDef[];
  brand: AppShellBrand;
  loginPath?: string;
  children: React.ReactNode;
  /** Current workspace key used to highlight the correct platform nav icon */
  workspace?: 'admin' | 'crm' | 'billing' | 'desk' | 'portal' | 'services';
  /** Initials for the bottom avatar */
  userInitials?: string;
}

/* ── Platform-level cross-app nav icons in the sidebar ─────────────────── */
const PLATFORM_NAV = [
  { key: 'admin',    icon: '⊞',  label: 'Admin',    href: WORKSPACE_URLS.admin    },
  { key: 'crm',      icon: '👥', label: 'Customers', href: WORKSPACE_URLS.crm      },
  { key: 'billing',  icon: '🧾', label: 'Billing',   href: WORKSPACE_URLS.billing  },
  { key: 'desk',     icon: '🎫', label: 'Desk',      href: WORKSPACE_URLS.desk     },
  { key: 'services', icon: '🌐', label: 'Services',  href: WORKSPACE_URLS.services },
  { key: 'portal',   icon: '💼', label: 'Portal',    href: WORKSPACE_URLS.portal   },
] as const;

const S = {
  shell: {
    display: 'flex',
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    background: 'rgb(3 3 3)',
    color: 'rgb(248 250 252)',
    fontFamily: 'var(--font-inter, system-ui, sans-serif)',
  } as React.CSSProperties,

  sidebar: {
    width: 56,
    minWidth: 56,
    height: '100dvh',
    background: 'rgb(12 12 14)',
    borderRight: '1px solid rgb(42 46 58 / 0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.75rem 0',
    gap: '0.25rem',
    flexShrink: 0,
    zIndex: 50,
  } as React.CSSProperties,

  logoBadge: {
    width: 34, height: 34, borderRadius: 10,
    background: 'rgb(255 221 74)',
    color: 'rgb(5 5 5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '0.7rem',
    marginBottom: '0.5rem', flexShrink: 0,
    userSelect: 'none',
  } as React.CSSProperties,

  divider: {
    width: 32, height: 1,
    background: 'rgb(42 46 58 / 0.7)',
    margin: '0.25rem 0',
    flexShrink: 0,
  } as React.CSSProperties,

  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgb(48 75 115)',
    color: 'rgb(248 250 252)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.6rem', fontWeight: 700,
  } as React.CSSProperties,

  main: {
    flex: 1,
    minWidth: 0,
    height: '100dvh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,

  topbar: {
    background: 'rgb(12 12 14 / 0.9)',
    borderBottom: '1px solid rgb(42 46 58 / 0.6)',
    backdropFilter: 'blur(20px) saturate(1.4)',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 1.25rem',
    height: 48,
    flexShrink: 0,
  } as React.CSSProperties,

  content: {
    flex: 1,
    padding: '1.25rem',
    overflowY: 'auto',
  } as React.CSSProperties,
};

function SidebarIcon({
  icon, label, href, active, external,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  external?: boolean;
}) {
  const btnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative',
    background: active ? 'rgb(255 221 74)' : 'transparent',
    color: active ? 'rgb(5 5 5)' : 'rgb(148 163 184)',
    transition: 'background 120ms, color 120ms',
    textDecoration: 'none',
    fontSize: '0.9rem',
    lineHeight: 1,
    border: 'none',
  };

  const tooltip = (
    <span style={{
      position: 'absolute',
      left: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgb(24 24 28)',
      border: '1px solid rgb(42 46 58)',
      color: 'rgb(248 250 252)',
      fontSize: '0.65rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      padding: '0.2rem 0.5rem',
      borderRadius: 6,
      pointerEvents: 'none',
      opacity: 0,
      zIndex: 100,
    }} className="shell-tooltip">{label}</span>
  );

  const inner = <>{icon}{tooltip}</>;

  if (external || isExternalHref(href)) {
    return <a href={href} style={btnStyle} title={label} className="shell-nav-icon">{inner}</a>;
  }
  return <Link href={href} style={btnStyle} title={label} className="shell-nav-icon">{inner}</Link>;
}

function InPageNav({ items }: { items: NavItemDef[] }) {
  const pathname = usePathname();
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {items.map((item) => {
        const isActive = item.exactMatch
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        const isExt = item.external || isExternalHref(item.href);
        const style: React.CSSProperties = {
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.25rem 0.6rem', borderRadius: 8,
          fontSize: '0.75rem', fontWeight: 600,
          textDecoration: 'none',
          background: isActive ? 'rgb(255 221 74 / 0.15)' : 'transparent',
          color: isActive ? 'rgb(255 221 74)' : 'rgb(148 163 184)',
          border: isActive ? '1px solid rgb(255 221 74 / 0.3)' : '1px solid transparent',
          transition: 'all 120ms',
        };
        if (isExt) return <a key={item.href} href={item.href} style={style}>{item.icon}{item.label}</a>;
        return <Link key={item.href} href={item.href} style={style}>{item.icon}{item.label}</Link>;
      })}
    </nav>
  );
}

export function AppShell({
  navGroups,
  brand,
  children,
  workspace,
  loginPath = '/login',
}: AppShellProps) {
  const allItems = navGroups.flatMap((g) => g.items);
  const monogram = brand.monogram ?? (brand.badge ?? brand.name).slice(0, 2).toUpperCase();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      window.location.href = loginPath;
    }
  }, [user, loading, loginPath]);

  if (loading || !user) {
    return (
      <div style={{
        ...S.shell,
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgb(148 163 184)',
        fontSize: '0.875rem',
      }}
      >
        {loading ? 'Loading…' : 'Redirecting to sign in…'}
      </div>
    );
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?';

  return (
    <>
      <style>{`
        .shell-nav-icon:hover { background: rgb(24 24 28) !important; color: rgb(248 250 252) !important; }
        .shell-nav-icon:hover .shell-tooltip { opacity: 1 !important; }
        .shell-logout-btn:hover { background: rgb(255 77 79 / 0.12) !important; color: rgb(255 77 79) !important; }
      `}</style>
      <div style={S.shell}>

        {/* Icon sidebar */}
        <aside style={S.sidebar}>
          <div style={S.logoBadge}>{monogram}</div>
          <div style={S.divider} />

          {/* Platform cross-app nav */}
          {PLATFORM_NAV.map((n) => (
            <SidebarIcon
              key={n.key}
              icon={n.icon}
              label={n.label}
              href={n.href}
              active={workspace === n.key}
              external
            />
          ))}

          {/* Bottom avatar + logout */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => logout().then(() => { if (typeof window !== 'undefined') window.location.href = '/login'; })}
              title="Sign out"
              className="shell-logout-btn"
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgb(48 75 115)',
                color: 'rgb(248 250 252)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 700,
                border: 'none', cursor: 'pointer',
                transition: 'background 120ms, color 120ms',
              }}
            >
              {initials}
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div style={S.main}>

          {/* Topbar — brand + in-page nav */}
          <header style={S.topbar}>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'rgb(248 250 252)', marginRight: '0.5rem' }}>
              {brand.name}
              {brand.badge && (
                <span style={{
                  marginLeft: '0.4rem', fontSize: '0.6rem', fontWeight: 700,
                  background: 'rgb(255 221 74 / 0.18)', color: 'rgb(255 221 74)',
                  border: '1px solid rgb(255 221 74 / 0.3)',
                  padding: '0.1rem 0.45rem', borderRadius: 999,
                }}>{brand.badge}</span>
              )}
            </span>
            <InPageNav items={allItems} />
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user && (
                <span style={{ fontSize: '0.7rem', color: 'rgb(148 163 184)' }}>
                  {user.firstName} {user.lastName}
                </span>
              )}
            </div>
          </header>

          {/* Page content */}
          <div style={S.content}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
