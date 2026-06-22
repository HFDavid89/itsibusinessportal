'use client';

import { PortalAuthGuard } from './PortalAuthGuard';
import { PortalShell } from './PortalShell';

export function PortalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <PortalAuthGuard>
      <PortalShell title={title} subtitle={subtitle}>
        {children}
      </PortalShell>
    </PortalAuthGuard>
  );
}

export function DisabledAction({
  label,
  reason,
}: {
  label: string;
  reason: string;
}) {
  return (
    <button
      type="button"
      disabled
      title={reason}
      style={{
        padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
        border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-raised))',
        color: 'rgb(var(--muted))', cursor: 'not-allowed', opacity: 0.75,
      }}
    >
      {label}
    </button>
  );
}

export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))',
      borderRadius: 12, padding: '1rem',
    }}>
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p style={{ fontSize: '0.85rem', color: 'rgb(var(--muted))', textAlign: 'center', padding: '2rem 0' }}>
      {message}
    </p>
  );
}
