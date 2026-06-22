'use client';
import React from 'react';

export type StatusPillTone = 'success' | 'warning' | 'danger' | 'info' | 'default';

export interface StatusPillProps {
  tone?: StatusPillTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const toneClass: Record<StatusPillTone, string> = {
  success: 'status-pill status-pill-success',
  warning: 'status-pill status-pill-warning',
  danger:  'status-pill status-pill-danger',
  info:    'status-pill status-pill-info',
  default: 'status-pill',
};

export function StatusPill({ tone = 'default', children, dot = true, className = '' }: StatusPillProps) {
  return (
    <span className={`${toneClass[tone]} ${className}`}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: 'currentColor' }}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
