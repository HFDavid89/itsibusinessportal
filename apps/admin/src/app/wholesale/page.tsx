'use client';

import { useState } from 'react';
import { AppShell, ADMIN_NAV_GROUPS, StaffPageHeader, StaffPageContent } from '@itsi-business/staff-shell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:17001';

type TestStatus = 'idle' | 'loading' | 'ok' | 'disabled' | 'error';

interface StatusResult {
  enabled: boolean;
  ok?: boolean;
  latencyMs?: number;
  version?: string;
  message?: string;
}

export default function WholesaleConnectionPage() {
  const [status, setStatus]     = useState<TestStatus>('idle');
  const [result, setResult]     = useState<StatusResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function runTest() {
    setStatus('loading');
    setResult(null);
    setErrorMsg(null);
    try {
      const res  = await fetch(`${API_BASE}/api/v1/wholesale/status`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json?.error?.message ?? `HTTP ${res.status}`);
        return;
      }
      const data: StatusResult = json.data;
      if (!data.enabled) {
        setStatus('disabled');
        setResult(data);
      } else if (data.ok) {
        setStatus('ok');
        setResult(data);
      } else {
        setStatus('error');
        setResult(data);
        setErrorMsg(data.message ?? 'Ping failed');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message);
    }
  }

  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <StaffPageContent className="max-w-2xl">
        <StaffPageHeader
          title="Wholesale Connection"
          description="Test connectivity to the Itsi Mobile wholesale API bridge"
        />

        <div className="command-card mb-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Itsi Mobile Wholesale API</h2>
          <p className="text-sm text-muted mb-4">
            Itsi Business connects to Itsi Mobile for availability checks, quotes, and service orders.
            Itsi Mobile handles all provider interactions (Gamma, KCOM, MS3, OTS Hero).
            Itsi Business never calls provider APIs directly.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={runTest}
              disabled={status === 'loading'}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {status === 'loading' ? 'Testing…' : 'Test Connection'}
            </button>

            {status !== 'idle' && status !== 'loading' && (
              <StatusBadge status={status} />
            )}
          </div>
        </div>

        {result && (
          <div className="command-card mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Result</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Enabled">
                <StatusPill variant={result.enabled ? 'success' : 'info'}>
                  {result.enabled ? 'Yes' : 'No'}
                </StatusPill>
              </Row>
              {result.enabled && (
                <>
                  <Row label="Reachable">
                    <StatusPill variant={result.ok ? 'success' : 'danger'}>
                      {result.ok ? 'Yes' : 'No'}
                    </StatusPill>
                  </Row>
                  {result.latencyMs !== undefined && (
                    <Row label="Latency">{result.latencyMs} ms</Row>
                  )}
                  {result.version && (
                    <Row label="API Version">{result.version}</Row>
                  )}
                  {result.message && (
                    <Row label="Message">{result.message}</Row>
                  )}
                </>
              )}
            </dl>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 mb-6">
            <p className="text-sm font-semibold text-danger mb-1">Connection failed</p>
            <p className="text-sm text-danger/90 font-mono">{errorMsg}</p>
            <p className="text-xs text-muted mt-2">
              Check ITSI_MOBILE_WHOLESALE_ENABLED, ITSI_MOBILE_API_BASE_URL and ITSI_MOBILE_WHOLESALE_API_KEY in your .env.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
          <p className="text-xs text-muted font-mono">
            RULE: Itsi Business may call Itsi Mobile wholesale APIs.
            Itsi Business must NOT call Gamma, KCOM, MS3, OTS Hero, or provider APIs directly.
          </p>
        </div>
      </StaffPageContent>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === 'ok')       return <StatusPill variant="success">Connected</StatusPill>;
  if (status === 'disabled') return <StatusPill variant="info">Disabled</StatusPill>;
  if (status === 'error')    return <StatusPill variant="danger">Failed</StatusPill>;
  return null;
}

function StatusPill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'success' | 'info' | 'danger' | 'warning';
}) {
  const classes = {
    success: 'status-pill-success',
    info: 'status-pill-info',
    danger: 'status-pill-danger',
    warning: 'status-pill-warning',
  }[variant];
  return <span className={`status-pill ${classes}`}>{children}</span>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 text-muted shrink-0">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
