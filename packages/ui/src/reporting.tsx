'use client';
import type { ReactNode } from 'react';
import { MetricCard } from './MetricCard';

export function ReportKpiGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {children}
    </div>
  );
}

export function ReportKpi({
  label,
  value,
  change,
  changeType,
  tone,
}: {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  tone?: 'primary' | 'secondary' | 'accent' | 'default';
}) {
  return <MetricCard label={label} value={value} change={change} changeType={changeType} tone={tone} />;
}

export function ReportSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="command-card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted mt-1">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AgeingBucketBar({
  buckets,
  formatMoney,
}: {
  buckets: Array<{ label: string; count: number; balancePence: number }>;
  formatMoney: (pence: number) => string;
}) {
  const max = Math.max(...buckets.map((b) => b.balancePence), 1);
  return (
    <div className="space-y-3">
      {buckets.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-foreground">{b.label}</span>
            <span className="text-muted">{b.count} · {formatMoney(b.balancePence)}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
            <div
              className="h-full bg-accent/70 rounded-full transition-all"
              style={{ width: `${Math.max(4, (b.balancePence / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatusDistributionTable({
  rows,
  valueLabel = 'Count',
}: {
  rows: Array<{ label: string; value: string | number }>;
  valueLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No data.</p>;
  }
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-raised text-left text-[10px] font-bold uppercase tracking-wider text-muted">
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.label)} className="border-t border-border/60">
              <td className="px-3 py-2 text-foreground">{r.label}</td>
              <td className="px-3 py-2 text-right font-semibold">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DrilldownLinkList({
  links,
}: {
  links: Array<{ label: string; href: string; meta?: string }>;
}) {
  if (links.length === 0) return <p className="text-sm text-muted">None</p>;
  return (
    <ul className="space-y-2">
      {links.map((l) => (
        <li key={l.href + l.label}>
          <a href={l.href} className="block rounded-lg border border-border px-3 py-2 hover:border-accent/30 transition-colors">
            <span className="text-sm font-semibold text-accent">{l.label}</span>
            {l.meta && <span className="block text-xs text-muted mt-0.5">{l.meta}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

const RISK_CLS = {
  healthy: 'bg-success/15 text-success border-success/30',
  watch: 'bg-accent/15 text-accent border-accent/30',
  at_risk: 'bg-warning/15 text-warning border-warning/30',
  needs_attention: 'bg-danger/15 text-danger border-danger/30',
} as const;

export function RiskBadge({ tier, label }: { tier: keyof typeof RISK_CLS; label: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${RISK_CLS[tier]}`}>
      {label}
    </span>
  );
}

export function TrendTable({
  rows,
}: {
  rows: Array<{ period: string; metric: string; value: number }>;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted">No trend data.</p>;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-raised text-left text-[10px] font-bold uppercase tracking-wider text-muted">
            <th className="px-3 py-2">Period</th>
            <th className="px-3 py-2">Metric</th>
            <th className="px-3 py-2 text-right">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.period}-${r.metric}-${i}`} className="border-t border-border/60">
              <td className="px-3 py-2 text-muted">{r.period}</td>
              <td className="px-3 py-2 text-foreground">{r.metric}</td>
              <td className="px-3 py-2 text-right font-semibold">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
