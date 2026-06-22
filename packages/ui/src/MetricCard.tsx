'use client';
import React from 'react';

export type MetricTone = 'primary' | 'secondary' | 'accent' | 'default';

export interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  tone?: MetricTone;
  icon?: React.ReactNode;
  className?: string;
}

const toneClass: Record<MetricTone, string> = {
  primary:   'metric-card-primary',
  secondary: 'metric-card-secondary',
  accent:    'metric-card-accent',
  default:   'metric-card',
};

export function MetricCard({
  label,
  value,
  change,
  changeType = 'neutral',
  tone = 'default',
  icon,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`${toneClass[tone]} ${className}`}>
      <div className="flex items-start justify-between">
        <span className="metric-label">{label}</span>
        {icon && <span className="text-muted opacity-70">{icon}</span>}
      </div>
      <span className="metric-value">{value}</span>
      {change && (
        <span
          className={
            changeType === 'positive'
              ? 'metric-change-positive'
              : changeType === 'negative'
              ? 'metric-change-negative'
              : 'text-xs text-muted'
          }
        >
          {change}
        </span>
      )}
    </div>
  );
}
