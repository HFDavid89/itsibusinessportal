'use client';
import * as React from 'react';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterBarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    label?: string;
  }>;
  children?: React.ReactNode;
  className?: string;
};

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  children,
  className = '',
}: FilterBarProps) {
  return (
    <div className={`rounded-2xl border border-border bg-surface-raised p-4 flex flex-wrap items-center gap-3 ${className}`}>
      {onSearchChange != null && (
        <input
          type="search"
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      )}
      {filters.map((f) => (
        <label key={f.id} className="flex items-center gap-2 text-xs text-muted">
          {f.label && <span className="font-semibold uppercase tracking-wider">{f.label}</span>}
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      ))}
      {children}
    </div>
  );
}
