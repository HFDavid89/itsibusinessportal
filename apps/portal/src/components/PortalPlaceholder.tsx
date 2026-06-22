'use client';

import Link from 'next/link';
import { PortalShell } from './PortalShell';

export function PortalPlaceholder({
  title,
  description,
  phase = 'Phase 9B',
}: {
  title: string;
  description: string;
  phase?: string;
}) {
  return (
    <PortalShell title={title} subtitle="Coming in a future release">
      <div
        style={{
          maxWidth: 560, margin: '2rem auto',
          background: 'rgb(var(--surface-raised))',
          border: '1px solid rgb(var(--border))',
          borderRadius: 16, padding: '2rem', textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--muted))', marginBottom: '0.75rem' }}>
          Not available yet
        </p>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(var(--foreground))', marginBottom: '0.5rem' }}>{title}</h1>
        <p style={{ fontSize: '0.85rem', color: 'rgb(var(--muted))', lineHeight: 1.6, marginBottom: '1.25rem' }}>{description}</p>
        <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginBottom: '1.5rem' }}>
          Planned for <strong>{phase} — Business Customer Portal Foundation</strong>.
          This page is a deliberate placeholder; it does not show live or demo data.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block', padding: '0.5rem 1rem', borderRadius: 10,
            background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))',
            fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </PortalShell>
  );
}
