import * as React from 'react';

export function PageSkeleton({ rows = 6, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 rounded-app bg-surface-raised animate-pulse border border-border/60" />
      ))}
    </div>
  );
}
