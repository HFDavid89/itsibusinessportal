import { AppShell } from '@itsi-business/staff-shell';
import { PageHeader, Card, EmptyState } from '@itsi-business/ui';

const navGroups = [
  {
    label: 'Billing',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/invoices', label: 'Invoices' },
      { href: '/payments', label: 'Payments' },
    ],
  },
];

export default function BillingDashboardPage() {
  return (
    <AppShell navGroups={navGroups} brand={{ name: 'Itsi Business', badge: 'Billing' }}>
      <div className="p-8">
        <PageHeader
          title="Billing"
          subtitle="Invoices & Payments — scaffold placeholder"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-sm text-gray-500">Outstanding Invoices</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Total Billed (MTD)</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
        </div>
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
          </div>
          <EmptyState
            title="No invoices yet"
            description="Invoices will appear here once billing is connected to the API."
          />
        </Card>
      </div>
    </AppShell>
  );
}
