'use client';

export function StaffEmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted mt-1 max-w-md mx-auto">{message}</p>
      {action && (
        action.href ? (
          <a href={action.href} className="inline-block mt-4 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90">
            {action.label}
          </a>
        ) : (
          <button type="button" onClick={action.onClick} className="mt-4 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
