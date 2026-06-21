'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-context';
import { WORKSPACE_URLS, type WorkspaceKey } from './workspace-urls';
import { useWorkspaceBadges } from './use-workspace-badges';

export type { WorkspaceKey };

interface WorkspaceDef {
  key: WorkspaceKey;
  name: string;
  description: string;
  url?: string;
  available: boolean;
  requireRealm?: 'staff' | 'platform';
  icon: React.ReactNode;
}

function icon(d: string) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

function buildWorkspaces(): WorkspaceDef[] {
  const { admin, billing, crm, desk, portal, services } = WORKSPACE_URLS;

  return [
    {
      key: 'admin',
      name: 'Admin',
      description: 'Home, settings, team & platform',
      url: admin,
      available: true,
      requireRealm: 'platform',
      icon: icon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'),
    },
    {
      key: 'crm',
      name: 'CRM',
      description: 'Business accounts, contacts & sites',
      url: crm,
      available: !!crm,
      icon: icon('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'),
    },
    {
      key: 'billing',
      name: 'Billing',
      description: 'Invoices, services & account charges',
      url: billing,
      available: true,
      icon: icon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'),
    },
    {
      key: 'desk',
      name: 'Support Desk',
      description: 'Tickets, escalations & messaging',
      url: desk,
      available: !!desk,
      icon: icon('M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'),
    },
    {
      key: 'services',
      name: 'Services',
      description: 'Retail service catalogue & service records',
      url: services,
      available: !!services,
      icon: icon('M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18'),
    },
    {
      key: 'portal',
      name: 'Customer Portal',
      description: 'Business customer self-service view',
      url: portal,
      available: !!portal,
      icon: icon('M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9'),
    },
  ];
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

function WorkspaceBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-white/25 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function renderRailItem(
  w: WorkspaceDef,
  current: WorkspaceKey,
  badge?: number,
  extraClass = '',
) {
  const isCurrent = w.key === current;
  const tooltip = w.available ? `${w.name} — ${w.description}` : `${w.name} — Coming soon`;

  const inner = (
    <>
      <span className="shrink-0">{w.icon}</span>
      <span className="truncate flex-1 text-left">{w.name}</span>
      {badge != null && badge > 0 && <WorkspaceBadge count={badge} />}
    </>
  );

  const base = `group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${FOCUS_RING} ${extraClass}`;

  if (isCurrent) {
    return (
      <span
        key={w.key}
        className={`${base} bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]`}
        aria-current="page"
        title={tooltip}
      >
        {inner}
      </span>
    );
  }

  if (!w.available || !w.url) {
    return (
      <span
        key={w.key}
        className={`${base} text-white/40 cursor-not-allowed`}
        title={`${w.name} — Coming soon`}
      >
        {inner}
      </span>
    );
  }

  return (
    <a
      key={w.key}
      href={w.url}
      className={`${base} text-white/80 hover:text-white hover:bg-white/10 hover:translate-x-0.5`}
      title={tooltip}
    >
      {inner}
    </a>
  );
}

export function WorkspaceRail({ current }: { current: WorkspaceKey }) {
  const { user } = useAuth();
  const badges = useWorkspaceBadges();
  const workspaces = buildWorkspaces().filter((w) => !w.requireRealm || user?.realm === w.requireRealm);

  const mainWorkspaces = workspaces.filter((w) => w.key !== 'admin');
  const adminWorkspace = workspaces.find((w) => w.key === 'admin');

  return (
    <nav className="flex flex-col gap-0.5 h-full" aria-label="Workspaces">
      <div className="flex flex-col gap-0.5">
        {mainWorkspaces.map((w) => renderRailItem(w, current, badges[w.key]))}
      </div>
      {adminWorkspace && (
        <div className="mt-auto pt-4 border-t border-white/10">
          {renderRailItem(adminWorkspace, current, badges[adminWorkspace.key])}
        </div>
      )}
    </nav>
  );
}

export function WorkspaceTabs({ current }: { current: WorkspaceKey }) {
  const { user } = useAuth();
  const badges = useWorkspaceBadges();
  const workspaces = buildWorkspaces().filter((w) => !w.requireRealm || user?.realm === w.requireRealm);

  const base = `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${FOCUS_RING}`;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Workspaces">
      {workspaces.map((w) => {
        const isCurrent = w.key === current;
        const tooltip = w.available ? `${w.name} — ${w.description}` : 'Coming soon';
        const inner = (
          <>
            <span className="shrink-0">{w.icon}</span>
            <span>{w.name}</span>
            {badges[w.key] != null && badges[w.key]! > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-white/25 text-[10px] font-bold flex items-center justify-center">
                {badges[w.key]! > 9 ? '9+' : badges[w.key]}
              </span>
            )}
          </>
        );

        if (isCurrent) {
          return (
            <span key={w.key} className={`${base} bg-white/20 text-white`} aria-current="page" title={tooltip}>
              {inner}
            </span>
          );
        }
        if (!w.available || !w.url) {
          return (
            <span key={w.key} className={`${base} text-white/40 cursor-not-allowed`} title={tooltip}>
              {inner}
            </span>
          );
        }
        return (
          <a key={w.key} href={w.url} className={`${base} text-white/75 hover:text-white hover:bg-white/10`} title={tooltip}>
            {inner}
          </a>
        );
      })}
    </nav>
  );
}

export function AppSwitcher({ current }: { current: WorkspaceKey }) {
  const { user } = useAuth();
  const badges = useWorkspaceBadges();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const workspaces = buildWorkspaces().filter((w) => !w.requireRealm || user?.realm === w.requireRealm);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Switch workspace"
        aria-label="Switch workspace"
        aria-expanded={open}
        className={`p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition-colors ${FOCUS_RING}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="5" cy="5" r="1.8" /><circle cx="12" cy="5" r="1.8" /><circle cx="19" cy="5" r="1.8" />
          <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          <circle cx="5" cy="19" r="1.8" /><circle cx="12" cy="19" r="1.8" /><circle cx="19" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-border bg-surface z-50 p-3 animate-scale-in"
          style={{ boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(15,23,42,0.18))' }}
        >
          <p className="px-2 pb-2 text-[10px] font-bold text-muted/60 uppercase tracking-[0.18em]">Workspaces</p>
          <div className="grid grid-cols-2 gap-2">
            {workspaces.map((w) => {
              const isCurrent = w.key === current;
              const badge = badges[w.key];
              const content = (
                <>
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}>
                    {w.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="block text-sm font-semibold truncate">{w.name}</span>
                      {badge != null && badge > 0 && (
                        <span className="min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </span>
                    <span className={`block text-[11px] truncate ${isCurrent ? 'text-white/70' : 'text-muted'}`}>
                      {w.available ? w.description : 'Coming soon'}
                    </span>
                  </span>
                </>
              );

              if (isCurrent) {
                return (
                  <div
                    key={w.key}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-white col-span-2"
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 55%, #6366f1 100%)' }}
                  >
                    {content}
                  </div>
                );
              }

              if (!w.available || !w.url) {
                return (
                  <div key={w.key} className="flex items-center gap-2.5 p-2.5 rounded-xl opacity-50 cursor-not-allowed">
                    {content}
                  </div>
                );
              }

              return (
                <a
                  key={w.key}
                  href={w.url}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-raised transition-colors text-foreground"
                >
                  {content}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
