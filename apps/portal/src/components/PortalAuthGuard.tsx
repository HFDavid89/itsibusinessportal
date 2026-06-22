'use client';

import { useRequireAuth } from '@itsi-business/staff-shell';

export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth('/login');

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: 'rgb(var(--muted))' }}>
        Loading…
      </div>
    );
  }

  if (user.realm !== 'portal') {
    return (
      <div style={{ maxWidth: 480, margin: '4rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgb(var(--foreground))' }}>Staff access not permitted</h1>
        <p style={{ fontSize: '0.85rem', color: 'rgb(var(--muted))', marginTop: '0.5rem' }}>
          This portal is for business customer accounts only. Please use a portal login.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
