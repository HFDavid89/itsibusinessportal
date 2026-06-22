'use client';
import React from 'react';

export interface AccountRiskCardProps {
  score: number;
  label?: string;
  description?: string;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'rgb(var(--danger))';
  if (score >= 40) return 'rgb(var(--warning))';
  return 'rgb(var(--success))';
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'High risk';
  if (score >= 40) return 'Medium risk';
  return 'Low risk';
}

export function AccountRiskCard({
  score,
  label = 'Account risk score',
  description,
  className = '',
}: AccountRiskCardProps) {
  const color = scoreColor(score);
  const risk  = scoreLabel(score);

  return (
    <div className={`account-risk-card ${className}`}>
      <p className="metric-label mb-3">{label}</p>
      <div className="flex items-end gap-3 mb-3">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-xs font-semibold mb-1" style={{ color }}>
          {risk}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden mb-3"
        style={{ background: 'rgb(var(--border))' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, score)}%`, background: color }}
        />
      </div>
      {description && (
        <p className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
          {description}
        </p>
      )}
    </div>
  );
}
