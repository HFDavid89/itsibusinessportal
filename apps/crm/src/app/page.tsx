import { AppShell } from '@itsi-business/staff-shell';
import { PageHeader, Card, EmptyState } from '@itsi-business/ui';

const navGroups = [
  {
    label: 'CRM',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/accounts', label: 'Business Accounts' },
      { href: '/contacts', label: 'Contacts' },
      { href: '/sites', label: 'Sites' },
    ],
  },
];

export default function CrmDashboardPage() {
  return (
    <AppShell navGroups={navGroups} brand={{ name: 'Itsi Business', badge: 'CRM' }}>
      <div className="p-8">
        <PageHeader
          title="Business Accounts"
          subtitle="CRM — scaffold placeholder"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-sm text-gray-500">Business Accounts</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Contacts</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Sites</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
        </div>
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Business Accounts</h2>
          </div>
          <EmptyState
            title="No business accounts yet"
            description="Business accounts will appear here once the CRM is connected to the API."
          />
        </Card>
      </div>
    </AppShell>
  );
}
