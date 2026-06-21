import { AppShell } from '@itsi-business/staff-shell';
import { PageHeader, Card, EmptyState } from '@itsi-business/ui';

const navGroups = [
  {
    label: 'Desk',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/tickets', label: 'Tickets' },
      { href: '/escalations', label: 'Escalations' },
    ],
  },
];

export default function DeskDashboardPage() {
  return (
    <AppShell navGroups={navGroups} brand={{ name: 'Itsi Business', badge: 'Desk' }}>
      <div className="p-8">
        <PageHeader
          title="Support Desk"
          subtitle="Ticket Management — scaffold placeholder"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-sm text-gray-500">Open Tickets</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Escalated to Wholesale</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Resolved (7d)</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
          </Card>
        </div>
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Recent Tickets</h2>
          </div>
          <EmptyState
            title="No tickets yet"
            description="Support tickets will appear here once the desk is connected to the API."
          />
        </Card>
      </div>
    </AppShell>
  );
}
