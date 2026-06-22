'use client';
import React from 'react';

export interface InsightCardProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function InsightCard({
  title,
  actionLabel,
  onAction,
  children,
  className = '',
}: InsightCardProps) {
  return (
    <div className={`insight-card ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span
            style={{ background: 'rgb(var(--brand-purple) / 0.18)', color: 'rgb(var(--brand-purple))' }}
            className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
          >
            Insight
          </span>
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
            {title}
          </h3>
        </div>
        {actionLabel && (
          <button
            onClick={onAction}
            className="text-xs font-semibold shrink-0"
            style={{ color: 'rgb(var(--accent))' }}
          >
            {actionLabel} →
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--muted))' }}>
        {children}
      </p>
    </div>
  );
}
