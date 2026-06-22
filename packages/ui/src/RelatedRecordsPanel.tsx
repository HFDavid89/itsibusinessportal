'use client';
import type { ReactNode } from 'react';

export type RelatedRecordItem = {
  id: string;
  title: string;
  meta?: string;
  href?: string;
  badge?: ReactNode;
};

export function RelatedRecordsPanel({
  title,
  actionLabel,
  actionHref,
  items,
  emptyMessage = 'No related records.',
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  items: RelatedRecordItem[];
  emptyMessage?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h2>
        {actionLabel && actionHref && (
          <a href={actionHref} className="text-[10px] font-semibold text-accent hover:underline">{actionLabel}</a>
        )}
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const inner = (
                <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 hover:border-accent/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    {item.meta && <p className="text-[11px] text-muted mt-0.5">{item.meta}</p>}
                  </div>
                  {item.badge}
                </div>
              );
              return item.href ? (
                <a key={item.id} href={item.href} className="block no-underline text-inherit">{inner}</a>
              ) : (
                <div key={item.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
