'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@itsi-business/staff-shell';

interface FidelityIntegrationStatus {
  provider: string;
  enabled: boolean;
  configured: boolean;
  readiness: string;
  statusLabel: string;
  message: string;
  liveIntegrationAvailable: boolean;
}

function DisabledBtn({ label, reason }: { label: string; reason: string }) {
  return (
    <button type="button" disabled title={reason}
      className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted cursor-not-allowed opacity-70">
      {label}
    </button>
  );
}

export function EnergyFulfilmentPanel() {
  const [status, setStatus] = useState<FidelityIntegrationStatus | null>(null);

  useEffect(() => {
    apiFetch<{ success: true; data: FidelityIntegrationStatus }>('/api/v1/energy-integrations/status')
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null));
  }, []);

  const disabledReason = status?.message
    ?? 'Fidelity Energy integration is not configured. Awaiting API documentation from Fidelity Energy.';

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">Energy Fulfilment</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-border/20 text-muted font-semibold">
          {status?.statusLabel ?? 'Not configured'}
        </span>
      </div>

      <p className="text-sm text-foreground">
        Provider: <strong>Fidelity Energy</strong>
      </p>
      <p className="text-xs text-muted leading-relaxed">
        Energy fulfilment uses a separate Fidelity Energy integration — not the Itsi Mobile wholesale bridge.
        Live quote and order submission will be enabled once Fidelity confirms API documentation and credentials.
      </p>

      {status && (
        <p className="text-xs text-muted">{status.message}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <DisabledBtn label="Request Energy Quote" reason={disabledReason} />
        <DisabledBtn label="Submit Energy Order" reason={disabledReason} />
      </div>
    </div>
  );
}

export function EnergyIntegrationAdminHint() {
  return (
    <p className="text-xs text-muted mt-2">
      See Admin → Energy Integration for Fidelity readiness status.
    </p>
  );
}
