'use client';
import React from 'react';

export interface RevenueFlowItem {
  label: string;
  value: string;
  percent: number;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}

export interface RevenueFlowCardProps {
  title?: string;
  total?: string;
  items: RevenueFlowItem[];
  className?: string;
}

const toneColor: Record<string, string> = {
  success: 'rgb(var(--success))',
  warning: 'rgb(var(--warning))',
  danger:  'rgb(var(--danger))',
  info:    'rgb(var(--info))',
};

export function RevenueFlowCard({
  title = 'Revenue Flow',
  total,
  items,
  className = '',
}: RevenueFlowCardProps) {
  return (
    <div className={`revenue-panel ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--muted))' }}>
            {title}
          </h3>
          {total && (
            <p className="text-3xl font-bold mt-1" style={{ color: 'rgb(var(--foreground))' }}>
              {total}
            </p>
          )}
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ background: 'rgb(var(--success) / 0.14)', color: 'rgb(var(--success))' }}
        >
          Live
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs" style={{ color: 'rgb(var(--muted))' }}>{item.label}</span>
              <span className="text-xs font-semibold" style={{ color: 'rgb(var(--foreground))' }}>{item.value}</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgb(var(--border))' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, item.percent)}%`,
                  background: item.tone ? toneColor[item.tone] : 'rgb(var(--brand-navy))',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
