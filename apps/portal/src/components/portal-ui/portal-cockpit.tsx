'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

export function PortalHero({
  eyebrow,
  title,
  subtitle,
  badges,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="portal-hero-band rounded-2xl overflow-hidden border border-border bg-surface-raised">
      <div className="relative px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">{eyebrow}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {badges}
          </div>
          {subtitle && <p className="text-sm text-muted mt-1 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export function PortalPanel({
  title,
  actionLabel,
  actionHref,
  children,
  empty,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h2>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="text-[10px] font-semibold text-accent hover:underline">
            {actionLabel}
          </Link>
        )}
      </div>
      <div className={`p-4 ${empty ? 'text-sm text-muted text-center py-8' : ''}`}>{children}</div>
    </div>
  );
}
