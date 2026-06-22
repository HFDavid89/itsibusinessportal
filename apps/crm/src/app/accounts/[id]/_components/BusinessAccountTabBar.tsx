'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AccountTab } from './account-types';

export interface AccountTabDef {
  key: AccountTab;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface BusinessAccountTabBarProps {
  tabs: AccountTabDef[];
  moreTabs: AccountTabDef[];
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
}

const TAB_ICONS: Partial<Record<AccountTab, React.ReactNode>> = {
  overview: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  contacts: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  sites: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  invoices: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>,
  services: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  energy: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  timeline: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

export function BusinessAccountTabBar({ tabs, moreTabs, activeTab, onTabChange }: BusinessAccountTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const moreActive = moreTabs.some((t) => t.key === activeTab);

  const updateMenuPos = useCallback(() => {
    const btn = menuButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 220;
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
    });
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    updateMenuPos();
    window.addEventListener('resize', updateMenuPos);
    window.addEventListener('scroll', updateMenuPos, true);
    return () => {
      window.removeEventListener('resize', updateMenuPos);
      window.removeEventListener('scroll', updateMenuPos, true);
    };
  }, [moreOpen, updateMenuPos]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuButtonRef.current?.contains(target)) return;
      if (menuPanelRef.current?.contains(target)) return;
      setMoreOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="sticky top-0 z-20 border-b border-border/60 surface-sticky-bar shrink-0">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-0.5 overflow-x-auto items-end scrollbar-none">
        {tabs.map((t) => (
          <TabButton key={t.key} tab={t} icon={t.icon ?? TAB_ICONS[t.key]} active={activeTab === t.key} onClick={() => onTabChange(t.key)} />
        ))}
        {moreTabs.length > 0 && (
          <div className="relative shrink-0">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                setMoreOpen((o) => {
                  const next = !o;
                  if (next) updateMenuPos();
                  return next;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all rounded-t-lg border-x border-t ${
                moreActive ? 'account-tab-active' : 'border-transparent text-muted hover:text-foreground hover:bg-surface-raised/60'
              }`}
              aria-expanded={moreOpen}
            >
              More
              <svg className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {moreOpen && menuPos && typeof document !== 'undefined' && createPortal(
              <div
                ref={menuPanelRef}
                className="fixed w-[220px] rounded-xl shell-dropdown-panel z-[200] p-1.5"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                {moreTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { onTabChange(t.key); setMoreOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left ${
                      activeTab === t.key ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-surface-raised'
                    }`}
                  >
                    {t.label}
                    {t.count !== undefined && t.count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-muted font-semibold">{t.count}</span>
                    )}
                  </button>
                ))}
              </div>,
              document.body,
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ tab, icon, active, onClick }: { tab: AccountTabDef; icon?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all rounded-t-lg border-x border-t ${
        active ? 'account-tab-active' : 'border-transparent text-muted hover:text-foreground hover:bg-surface-raised/60'
      }`}
    >
      {icon && <span className={active ? 'text-accent' : 'opacity-60'}>{icon}</span>}
      {tab.label}
      {tab.count !== undefined && tab.count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
          active ? 'bg-accent/15 text-accent' : 'bg-surface-raised text-muted'
        }`}>{tab.count}</span>
      )}
    </button>
  );
}
