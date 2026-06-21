'use client';

export const UNAUTHORISED_SETTINGS_MESSAGE =
  'You are not authorised to view settings, please speak to an administrator.';

export const UNAUTHORISED_PAGE_MESSAGE =
  'You are not authorised to view this page, please speak to an administrator.';

export interface AccessRestrictedProps {
  title?: string;
  message?: string;
  className?: string;
}

export function AccessRestricted({
  title = 'Access Restricted',
  message = UNAUTHORISED_PAGE_MESSAGE,
  className = '',
}: AccessRestrictedProps) {
  return (
    <div className={`flex items-center justify-center min-h-[50vh] p-6 ${className}`}>
      <div
        className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 text-center animate-fade-in"
        style={{ boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(15,23,42,0.08))' }}
      >
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
