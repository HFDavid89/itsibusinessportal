'use client';

import { useState } from 'react';
import { AppShell, ADMIN_NAV_GROUPS, StaffPageHeader, StaffPageContent } from '@itsi-business/staff-shell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:17001';

interface FidelityStatus {
  provider: string;
  enabled: boolean;
  configured: boolean;
  readiness: string;
  statusLabel: string;
  message: string;
  liveIntegrationAvailable: boolean;
}

type LoadState = 'idle' | 'loading' | 'ok' | 'error';

export default function EnergyIntegrationPage() {
  const [state, setState] = useState<LoadState>('idle');
  const [status, setStatus] = useState<FidelityStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadStatus() {
    setState('loading');
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/energy-integrations/status`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        setState('error');
        setErrorMsg(json?.error?.message ?? `HTTP ${res.status}`);
        return;
      }
      setStatus(json.data);
      setState('ok');
    } catch (err) {
      setState('error');
      setErrorMsg((err as Error).message);
    }
  }

  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <StaffPageContent className="max-w-2xl">
        <StaffPageHeader
          title="Energy Integration"
          description="Fidelity Energy integration readiness — separate from Itsi Mobile wholesale"
        />

        <div className="command-card mb-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Fidelity Energy</h2>
          <p className="text-sm text-muted mb-4">
            Mobile and broadband fulfilment uses the Itsi Mobile wholesale bridge.
            Energy sales and contracts are completed manually in the Fidelity portal.
            Itsi Business tracks energy customer relationships, renewals, and check-ins only.
            Live API integration is not currently used.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={loadStatus}
              disabled={state === 'loading'}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {state === 'loading' ? 'Loading…' : 'Check Integration Status'}
            </button>
            {status && (
              <span className="status-pill status-pill-info">{status.statusLabel}</span>
            )}
          </div>
        </div>

        {status && (
          <div className="command-card mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Status</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Provider">{status.provider}</Row>
              <Row label="Enabled">
                <StatusPill variant={status.enabled ? 'success' : 'info'}>{status.enabled ? 'Yes' : 'No'}</StatusPill>
              </Row>
              <Row label="Configured">
                <StatusPill variant={status.configured ? 'success' : 'info'}>{status.configured ? 'Yes' : 'No'}</StatusPill>
              </Row>
              <Row label="Readiness">{status.readiness}</Row>
              <Row label="Live integration">
                <StatusPill variant="info">{status.liveIntegrationAvailable ? 'Available' : 'Not available'}</StatusPill>
              </Row>
              <Row label="Message">{status.message}</Row>
            </dl>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 mb-6">
            <p className="text-sm font-semibold text-danger mb-1">Failed to load status</p>
            <p className="text-sm text-danger/90 font-mono">{errorMsg}</p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
          <p className="text-xs text-muted font-mono">
            RULE: Fidelity Energy must NOT be placed inside the Itsi Mobile wholesale client.
          </p>
          <p className="text-xs text-muted">
            Environment placeholders: FIDELITY_ENERGY_ENABLED, FIDELITY_ENERGY_API_BASE_URL, FIDELITY_ENERGY_API_KEY.
            See docs/FIDELITY_ENERGY_INTEGRATION_DISCOVERY.md for what to request from Fidelity.
          </p>
        </div>
      </StaffPageContent>
    </AppShell>
  );
}

function StatusPill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'success' | 'info';
}) {
  const classes = variant === 'success' ? 'status-pill-success' : 'status-pill-info';
  return <span className={`status-pill ${classes}`}>{children}</span>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 text-muted shrink-0">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
