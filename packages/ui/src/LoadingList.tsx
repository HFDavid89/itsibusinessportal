'use client';

export function LoadingList({ rows = 4, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl border border-border bg-surface-raised animate-pulse" />
      ))}
    </div>
  );
}
