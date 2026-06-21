import { AppShell } from '@itsi-business/staff-shell';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import { PageHeader, Card, Badge } from '@itsi-business/ui';

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

export default function AdminOverviewPage() {
  return (
    <AppShell navGroups={navGroups} brand={{ name: 'Itsi Business', badge: 'Admin' }}>
      <div className="p-8">
        <PageHeader
          title="Platform Overview"
          subtitle="Itsi Business Administration — scaffold placeholder"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Business Accounts', value: '—', status: 'Placeholder' },
            { label: 'Active Services', value: '—', status: 'Placeholder' },
            { label: 'Open Tickets', value: '—', status: 'Placeholder' },
            { label: 'Wholesale Status', value: 'Not configured', status: 'Disabled' },
          ].map((stat) => (
            <Card key={stat.label}>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              <Badge variant="default" className="mt-2">{stat.status}</Badge>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Scaffold Status</h2>
          <p className="text-sm text-gray-600">
            This is the Itsi Business Admin scaffold. No live data is connected yet.
            Configure <code className="bg-gray-100 px-1 rounded">ITSI_MOBILE_WHOLESALE_ENABLED</code> and related
            env vars to activate the wholesale API connection.
          </p>
          <p className="text-xs text-gray-400 mt-3 font-mono">
            RULE: Itsi Business owns the business customer. Itsi Mobile owns the wholesale/provider fulfilment.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
