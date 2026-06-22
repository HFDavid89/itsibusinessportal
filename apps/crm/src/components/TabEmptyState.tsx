'use client';

export function TabEmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="cockpit-empty-panel text-center py-12">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted mt-1 max-w-sm mx-auto">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 btn-aurora text-xs font-bold px-4 py-2 rounded-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
