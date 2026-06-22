'use client';
import type { ReactNode } from 'react';

export function DetailHeader({
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
    <div className="rounded-2xl border border-border bg-surface-raised px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">{eyebrow}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
          {badges}
        </div>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
