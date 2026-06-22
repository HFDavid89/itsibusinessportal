/**
 * Shared AppShell nav groups derived from the wiring registry.
 * Staff apps import these instead of duplicating NAV_GROUPS per page.
 */
import type { NavGroupDef } from './app-shell';
import { WORKSPACE_URLS } from './workspace-urls';

export const ADMIN_NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Admin',
    items: [
      { href: '/', label: 'Overview', exactMatch: true },
      { href: '/settings', label: 'Settings' },
      { href: '/staff', label: 'Staff' },
      { href: '/wholesale', label: 'Wholesale Connection' },
      { href: '/integrations/energy', label: 'Energy Integration' },
    ],
  },
  {
    label: 'Workspaces',
    items: [
      { href: WORKSPACE_URLS.crm, label: 'CRM', external: true },
      { href: WORKSPACE_URLS.billing, label: 'Billing', external: true },
      { href: WORKSPACE_URLS.desk, label: 'Desk', external: true },
      { href: WORKSPACE_URLS.services, label: 'Services', external: true },
      { href: WORKSPACE_URLS.portal, label: 'Portal', external: true },
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
      { href: '/catalogue', label: 'Catalogue' },
      { href: '/records', label: 'Service Records' },
      { href: '/energy', label: 'Energy Tracking' },
    ],
  },
];
