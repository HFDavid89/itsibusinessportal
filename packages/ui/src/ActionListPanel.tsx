'use client';
import * as React from 'react';

export type ActionListItem = {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  meta?: string;
};

export type ActionListPanelProps = {
  title?: string;
  actionLabel?: string;
  actionHref?: string;
  items: ActionListItem[];
  className?: string;
};

export function ActionListPanel({
  title = 'Quick actions',
  actionLabel,
  actionHref,
  items,
  className = '',
}: ActionListPanelProps) {
  return (
    <div className={`rounded-2xl border border-border bg-surface-raised overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
        {actionLabel && actionHref ? (
          <a href={actionHref} className="text-[10px] font-semibold text-accent hover:underline">
            {actionLabel}
          </a>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-surface transition-colors"
          >
            {item.icon ? <span className="shrink-0 text-muted">{item.icon}</span> : null}
            <span className="flex-1 min-w-0 truncate">{item.label}</span>
            {item.meta ? <span className="text-xs text-muted shrink-0">{item.meta}</span> : null}
          </a>
        ))}
      </div>
    </div>
  );
}
