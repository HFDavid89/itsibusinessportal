'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from './auth-context';
import { UNAUTHORISED_SETTINGS_MESSAGE } from './access-restricted';

export interface SettingsCogProps {
  settingsPath: string;
  requirePermission?: string;
  moduleName: string;
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2';

const MENU_WIDTH = 288;

export function SettingsCog({ settingsPath, requirePermission, moduleName }: SettingsCogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updateMenuPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      left: Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPos();
    window.addEventListener('resize', updateMenuPos);
    window.addEventListener('scroll', updateMenuPos, true);
    return () => {
      window.removeEventListener('resize', updateMenuPos);
      window.removeEventListener('scroll', updateMenuPos, true);
    };
  }, [open, updateMenuPos]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const hasPermission = !requirePermission || user?.realm === 'platform' || user?.roles?.some((role) => {
    if (role === 'staff_admin' || role === 'platform_admin') return true;
    return role === requirePermission || role.endsWith('.settings');
  });

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) updateMenuPos();
            return next;
          });
        }}
        className={`p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition-colors ${FOCUS_RING}`}
        title="Settings"
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && menuPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="fixed w-72 bg-surface rounded-xl border border-border z-[200] overflow-hidden animate-scale-in"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            boxShadow: '0 12px 32px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.1)',
          }}
          role="menu"
        >
          {hasPermission ? (
            <>
              <div className="px-4 py-3 border-b border-border bg-surface">
                <p className="text-sm font-semibold text-foreground">{moduleName} Settings</p>
                <p className="text-xs text-muted">Configure {moduleName.toLowerCase()} preferences</p>
              </div>
              <div className="p-2 bg-surface">
                <Link
                  href={settingsPath as any}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-raised transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Open Settings</p>
                    <p className="text-xs text-muted">Manage {moduleName.toLowerCase()} configuration</p>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border bg-warning/10">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Access Restricted
                </p>
              </div>
              <div className="p-4 bg-surface">
                <p className="text-sm text-muted leading-relaxed">{UNAUTHORISED_SETTINGS_MESSAGE}</p>
              </div>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
