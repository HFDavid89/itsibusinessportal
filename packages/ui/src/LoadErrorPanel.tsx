import * as React from 'react';

export function LoadErrorPanel({
  title = 'Unable to load data',
  message = 'Something went wrong while fetching this page. Check your connection and try again.',
  onRetry,
  className = '',
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={[
        'rounded-app border border-danger/30 bg-danger/5 px-4 py-6 text-center',
        className,
      ].join(' ')}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted mt-1 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-xs font-bold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
        >
          Try again
        </button>
      )}
    </div>
  );
}
