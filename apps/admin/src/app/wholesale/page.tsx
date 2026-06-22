'use client';

import { useState } from 'react';
import { AppShell, WORKSPACE_URLS } from '@itsi-business/staff-shell';
import { PageHeader, Card, Badge } from '@itsi-business/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:17001';

const navGroups = [
  {
    label: 'Admin',
    items: [
      { href: '/', label: 'Overview', exactMatch: true },
      { href: '/settings', label: 'Settings' },
      { href: '/staff', label: 'Staff' },
      { href: '/wholesale', label: 'Wholesale Connection' },
    ],
  },
  {
    label: 'Workspaces',
    items: [
      { href: WORKSPACE_URLS.crm, label: 'CRM', external: true },
      { href: WORKSPACE_URLS.billing, label: 'Billing', external: true },
      { href: WORKSPACE_URLS.desk, label: 'Desk', external: true },
    ],
  },
];

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
    <AppShell navGroups={navGroups} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <div className="p-8 max-w-2xl">
        <PageHeader
          title="Wholesale Connection"
          subtitle="Test connectivity to the Itsi Mobile wholesale API bridge"
        />

        <Card className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Itsi Mobile Wholesale API</h2>
          <p className="text-sm text-gray-500 mb-4">
            Itsi Business connects to Itsi Mobile for availability checks, quotes, and service orders.
            Itsi Mobile handles all provider interactions (Gamma, KCOM, MS3, OTS Hero).
            Itsi Business never calls provider APIs directly.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={runTest}
              disabled={status === 'loading'}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'loading' ? 'Testing…' : 'Test Connection'}
            </button>

            {status !== 'idle' && status !== 'loading' && (
              <StatusBadge status={status} />
            )}
          </div>
        </Card>

        {result && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Result</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Enabled">
                <Badge variant={result.enabled ? 'success' : 'default'}>
                  {result.enabled ? 'Yes' : 'No'}
                </Badge>
              </Row>
              {result.enabled && (
                <>
                  <Row label="Reachable">
                    <Badge variant={result.ok ? 'success' : 'error'}>
                      {result.ok ? 'Yes' : 'No'}
                    </Badge>
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
          </Card>
        )}

        {errorMsg && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-700 mb-1">Connection failed</p>
            <p className="text-sm text-red-600 font-mono">{errorMsg}</p>
            <p className="text-xs text-red-400 mt-2">
              Check ITSI_MOBILE_WHOLESALE_ENABLED, ITSI_MOBILE_API_BASE_URL and ITSI_MOBILE_WHOLESALE_API_KEY in your .env.
            </p>
          </Card>
        )}

        <div className="mt-8 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-500 font-mono">
            RULE: Itsi Business may call Itsi Mobile wholesale APIs.
            Itsi Business must NOT call Gamma, KCOM, MS3, OTS Hero, or provider APIs directly.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === 'ok')       return <Badge variant="success">Connected</Badge>;
  if (status === 'disabled') return <Badge variant="default">Disabled</Badge>;
  if (status === 'error')    return <Badge variant="error">Failed</Badge>;
  return null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}
