import { AppShell, ADMIN_NAV_GROUPS, StaffPageHeader, StaffPageContent } from '@itsi-business/staff-shell';

const STATS = [
  { label: 'Business Accounts', value: '—', status: 'Placeholder', pillClass: 'status-pill-info' },
  { label: 'Active Services', value: '—', status: 'Placeholder', pillClass: 'status-pill-info' },
  { label: 'Open Tickets', value: '—', status: 'Placeholder', pillClass: 'status-pill-info' },
  { label: 'Wholesale Status', value: 'Not configured', status: 'Disabled', pillClass: 'status-pill-warning' },
] as const;

export default function AdminOverviewPage() {
  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <StaffPageContent>
        <StaffPageHeader
          title="Platform Overview"
          description="Itsi Business Administration — scaffold placeholder"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="metric-card">
              <p className="metric-label">{stat.label}</p>
              <p className="metric-value">{stat.value}</p>
              <span className={`status-pill ${stat.pillClass}`}>{stat.status}</span>
            </div>
          ))}
        </div>

        <div className="command-card">
          <h2 className="text-base font-semibold text-foreground mb-2">Scaffold Status</h2>
          <p className="text-sm text-muted">
            This is the Itsi Business Admin scaffold. No live data is connected yet.
            Configure{' '}
            <code className="px-1.5 py-0.5 rounded-md bg-surface-raised border border-border text-foreground text-xs font-mono">
              ITSI_MOBILE_WHOLESALE_ENABLED
            </code>{' '}
            and related env vars to activate the wholesale API connection.
          </p>
          <p className="text-xs text-muted/70 mt-3 font-mono">
            RULE: Itsi Business owns the business customer. Itsi Mobile owns the wholesale/provider fulfilment.
          </p>
        </div>
      </StaffPageContent>
    </AppShell>
  );
}
