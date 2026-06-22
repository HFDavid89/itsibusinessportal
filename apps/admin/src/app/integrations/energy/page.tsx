'use client';

import { useState } from 'react';
import { AppShell, ADMIN_NAV_GROUPS } from '@itsi-business/staff-shell';
import { PageHeader, Card, Badge } from '@itsi-business/ui';

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
      <div className="p-8 max-w-2xl">
        <PageHeader
          title="Energy Integration"
          subtitle="Fidelity Energy integration readiness — separate from Itsi Mobile wholesale"
        />

        <Card className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Fidelity Energy</h2>
          <p className="text-sm text-gray-500 mb-4">
            Mobile and broadband fulfilment uses the Itsi Mobile wholesale bridge.
            Energy fulfilment will use a dedicated Fidelity Energy integration boundary.
            Live API calls are disabled until Fidelity confirms documentation and credentials.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={loadStatus}
              disabled={state === 'loading'}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state === 'loading' ? 'Loading…' : 'Check Integration Status'}
            </button>
            {status && (
              <Badge variant={status.enabled && status.configured ? 'default' : 'default'}>
                {status.statusLabel}
              </Badge>
            )}
          </div>
        </Card>

        {status && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Status</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Provider">{status.provider}</Row>
              <Row label="Enabled">
                <Badge variant={status.enabled ? 'success' : 'default'}>{status.enabled ? 'Yes' : 'No'}</Badge>
              </Row>
              <Row label="Configured">
                <Badge variant={status.configured ? 'success' : 'default'}>{status.configured ? 'Yes' : 'No'}</Badge>
              </Row>
              <Row label="Readiness">{status.readiness}</Row>
              <Row label="Live integration">
                <Badge variant="default">{status.liveIntegrationAvailable ? 'Available' : 'Not available'}</Badge>
              </Row>
              <Row label="Message">{status.message}</Row>
            </dl>
          </Card>
        )}

        {errorMsg && (
          <Card className="border-red-200 bg-red-50 mt-4">
            <p className="text-sm font-semibold text-red-700 mb-1">Failed to load status</p>
            <p className="text-sm text-red-600 font-mono">{errorMsg}</p>
          </Card>
        )}

        <div className="mt-8 p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
          <p className="text-xs text-gray-500 font-mono">
            RULE: Fidelity Energy must NOT be placed inside the Itsi Mobile wholesale client.
          </p>
          <p className="text-xs text-gray-500">
            Environment placeholders: FIDELITY_ENERGY_ENABLED, FIDELITY_ENERGY_API_BASE_URL, FIDELITY_ENERGY_API_KEY.
            See docs/FIDELITY_ENERGY_INTEGRATION_DISCOVERY.md for what to request from Fidelity.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}
