/**
 * Itsi Business Portal — Customer-facing dashboard
 *
 * RULE: This is the business customer's self-service portal.
 *       No consumer signup flow. No provider portal UI.
 *       Authentication is portal-realm only (not staff-realm).
 */
import { Card, PageHeader, EmptyState } from '@itsi-business/ui';
import Link from 'next/link';

export default function PortalHomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">IB</span>
          </div>
          <span className="font-semibold text-gray-900">Itsi Business Portal</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Sign in
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <PageHeader
          title="Your Business Account"
          subtitle="Manage services, invoices, and support — scaffold placeholder"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Services', href: '/services' },
            { label: 'Invoices', href: '/invoices' },
            { label: 'Support Tickets', href: '/tickets' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500 mt-1">View {item.label.toLowerCase()}</p>
              </Card>
            </Link>
          ))}
        </div>
        <Card>
          <EmptyState
            title="Portal scaffold placeholder"
            description="Sign in to view your business account. Authentication and data will be connected in Phase 3."
          />
        </Card>
      </main>
    </div>
  );
}
