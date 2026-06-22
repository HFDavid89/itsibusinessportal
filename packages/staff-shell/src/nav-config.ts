/**
 * Shared AppShell nav groups derived from the wiring registry.
 * Staff apps import these instead of duplicating NAV_GROUPS per page.
 */
import type { NavGroupDef } from './app-shell';

/** In-app admin tabs only — cross-workspace links live in the left sidebar (PLATFORM_NAV). */
export const ADMIN_NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Admin',
    items: [
      { href: '/', label: 'Overview', exactMatch: true },
      { href: '/reports', label: 'Reports' },
      { href: '/settings', label: 'Settings' },
      { href: '/staff', label: 'Staff' },
      { href: '/wholesale', label: 'Wholesale Connection' },
      { href: '/integrations/energy', label: 'Energy Integration' },
    ],
  },
];

export const CRM_NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'CRM',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/accounts', label: 'Business Accounts' },
    ],
  },
];

export const BILLING_NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Billing',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/invoices', label: 'Invoices' },
    ],
  },
];

export const DESK_NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Desk',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/tickets', label: 'Tickets' },
    ],
  },
];

export const SERVICES_NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Services',
    items: [
      { href: '/', label: 'Dashboard', exactMatch: true },
      { href: '/work-queue', label: 'Work Queue' },
      { href: '/catalogue', label: 'Catalogue' },
      { href: '/records', label: 'Service Records' },
      { href: '/energy', label: 'Energy Tracking' },
    ],
  },
];
