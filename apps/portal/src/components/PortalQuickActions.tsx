'use client';

import Link from 'next/link';
import { PORTAL_WIRING } from '@itsi-business/staff-shell';

export function PortalQuickActions() {
  const actions = PORTAL_WIRING.quickActions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgb(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        Quick Actions
      </p>
      {actions.map((action) => {
        if (action.enabled && action.href) {
          return (
            <Link
              key={action.label}
              href={action.href}
              title={action.comingSoonReason}
              style={{
                background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))',
                borderRadius: 8, padding: '0.35rem 0.6rem',
                fontSize: '0.65rem', color: 'rgb(var(--foreground))', textDecoration: 'none', textAlign: 'left',
              }}
            >
              {action.label}
              {action.comingSoonReason && (
                <span style={{ display: 'block', fontSize: '0.55rem', color: 'rgb(var(--muted))', marginTop: 2 }}>
                  {action.comingSoonReason}
                </span>
              )}
            </Link>
          );
        }

        return (
          <button
            key={action.label}
            type="button"
            disabled
            title={action.comingSoonReason ?? 'Not available yet'}
            style={{
              background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))',
              borderRadius: 8, padding: '0.35rem 0.6rem',
              fontSize: '0.65rem', color: 'rgb(var(--muted))', cursor: 'not-allowed', textAlign: 'left', opacity: 0.7,
            }}
          >
            {action.label}
            <span style={{ display: 'block', fontSize: '0.55rem', marginTop: 2 }}>
              {action.comingSoonReason ?? 'Coming soon'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
