'use client';

import { StaffPageContent, StaffPageHeader } from './staff-page-chrome';

const ENV_MANAGED = [
  { key: 'ITSI_MOBILE_WHOLESALE_ENABLED', purpose: 'Enable Itsi Mobile wholesale bridge for staff fulfilment' },
  { key: 'ITSI_MOBILE_WHOLESALE_API_BASE_URL', purpose: 'Itsi Mobile wholesale API base URL' },
  { key: 'ITSI_MOBILE_WHOLESALE_API_KEY', purpose: 'Itsi Mobile wholesale API key' },
  { key: 'FIDELITY_ENERGY_ENABLED', purpose: 'Fidelity Energy integration gate (manual workflow until live API)' },
  { key: 'JWT_SECRET', purpose: 'Staff and portal session signing' },
  { key: 'DATABASE_URL', purpose: 'PostgreSQL connection' },
];

const UI_DEFERRED = [
  'Multi-tenant branding and white-label configuration',
  'Online payment gateway (Stripe/GoCardless) setup',
  'Automated invoice PDF templates',
  'Staff role permission matrix editor',
  'SLA policy configuration UI',
];

const INTENTIONAL_DEFER = [
  'Wholesale billing reconciliation — blocked until Itsi Mobile 13B-2 staging E2E',
  'Live SIM/network controls — blocked until 13B-2',
  'Fidelity Energy live API — manual portal workflow remains in place',
];

export function DeferredSettingsPanel({
  title = 'Platform Settings',
  description = 'Configuration managed outside this UI for Phase 15.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <StaffPageContent>
      <StaffPageHeader title={title} description={description} />
      <div className="max-w-3xl space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold text-foreground mb-2">Environment-managed settings</h2>
          <p className="text-xs text-muted mb-3">These values are set in deployment environment variables, not in the admin UI.</p>
          <ul className="space-y-2">
            {ENV_MANAGED.map((item) => (
              <li key={item.key} className="text-xs border border-border rounded-lg px-3 py-2 bg-surface-raised">
                <code className="font-mono text-foreground">{item.key}</code>
                <p className="text-muted mt-0.5">{item.purpose}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold text-foreground mb-2">Deferred UI settings</h2>
          <p className="text-xs text-muted mb-3">Not yet available as admin screens — intentionally deferred, not placeholder scaffolding.</p>
          <ul className="list-disc list-inside text-xs text-muted space-y-1">
            {UI_DEFERRED.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h2 className="text-sm font-bold text-foreground mb-2">Blocked by external dependencies</h2>
          <ul className="list-disc list-inside text-xs text-muted space-y-1">
            {INTENTIONAL_DEFER.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <p className="text-xs text-muted">
          Active admin areas: <strong>Staff</strong>, <strong>Wholesale Connection</strong>, <strong>Energy Integration</strong> status pages.
        </p>
      </div>
    </StaffPageContent>
  );
}
