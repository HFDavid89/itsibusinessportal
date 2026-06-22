'use client';
import * as React from 'react';

export type CompactKpiChipProps = {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaDown?: boolean;
  className?: string;
};

export function CompactKpiChip({
  label,
  value,
  delta,
  deltaDown = false,
  className = '',
}: CompactKpiChipProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface px-3 py-2.5 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
      {delta ? (
        <p className={`text-[10px] mt-0.5 ${deltaDown ? 'text-danger' : 'text-success'}`}>{delta}</p>
      ) : null}
    </div>
  );
}
