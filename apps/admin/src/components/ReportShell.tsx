'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppShell, ADMIN_NAV_GROUPS, StaffPageContent, StaffPageHeader } from '@itsi-business/staff-shell';

const REPORT_TABS = [
  { href: '/reports', label: 'Overview', exact: true },
  { href: '/reports/billing', label: 'Billing' },
  { href: '/reports/services', label: 'Services' },
  { href: '/reports/desk', label: 'Desk' },
  { href: '/reports/work-items', label: 'Work queue' },
  { href: '/reports/energy', label: 'Energy' },
  { href: '/reports/products', label: 'Products' },
  { href: '/reports/accounts', label: 'Account health' },
];

export function ReportShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <StaffPageContent>
        <StaffPageHeader
          title={title}
          description={description ?? 'Management reporting — staff and platform realm only. Not visible to portal users.'}
        />
        <nav className="flex flex-wrap gap-2 mb-6">
          {REPORT_TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  active ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </StaffPageContent>
    </AppShell>
  );
}
