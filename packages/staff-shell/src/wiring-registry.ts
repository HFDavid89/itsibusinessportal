/**
 * Phase 9A — Shared wiring registry for all workspaces.
 *
 * Every visible nav link, quick action, and route href is declared here with
 * enabled state, required realm, and coming-soon reasons for disabled items.
 */
import { WORKSPACE_URLS, ADMIN_WORKSPACE_LINKS } from './workspace-urls';

export type WiringRealm = 'platform' | 'staff' | 'portal';

export interface WiringNavItem {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
  exactMatch?: boolean;
  enabled: boolean;
  requiredRealm?: WiringRealm | WiringRealm[];
  requiredPermission?: string;
  comingSoonReason?: string;
}

export interface WiringQuickAction {
  label: string;
  href?: string;
  enabled: boolean;
  requiredRealm?: WiringRealm | WiringRealm[];
  requiredPermission?: string;
  comingSoonReason?: string;
}

export interface WorkspaceWiring {
  workspace: 'admin' | 'crm' | 'billing' | 'desk' | 'services' | 'portal';
  navLinks: WiringNavItem[];
  quickActions: WiringQuickAction[];
}

/** Portal-owned routes — never link to staff workspaces from the customer portal. */
export const PORTAL_ROUTES = {
  home: '/',
  account: '/account',
  products: '/products',
  services: '/services',
  billing: '/billing',
  tickets: '/tickets',
  fleet: '/fleet',
  users: '/users',
  settings: '/settings',
} as const;

export const ADMIN_WIRING: WorkspaceWiring = {
  workspace: 'admin',
  navLinks: [
    { label: 'Overview', href: '/', icon: '⊞', exactMatch: true, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Settings', href: '/settings', icon: '⚙', enabled: true, requiredRealm: ['platform', 'staff'], comingSoonReason: 'Platform settings scaffold — full configuration in a later phase.' },
    { label: 'Staff', href: '/staff', icon: '👤', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'admin.staff.manage' },
    { label: 'Wholesale Connection', href: '/wholesale', icon: '🔗', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'wholesale.read' },
    { label: 'Energy Integration', href: '/integrations/energy', icon: '⚡', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'wholesale.read', comingSoonReason: 'Fidelity Energy live integration awaiting API documentation.' },
  ],
  quickActions: [
    { label: 'Manage Staff', href: '/staff', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'admin.staff.manage' },
    { label: 'Test Wholesale', href: '/wholesale', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'wholesale.read' },
    { label: 'Open CRM', href: ADMIN_WORKSPACE_LINKS.crmAccounts, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Open Billing', href: ADMIN_WORKSPACE_LINKS.billingInvoices, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Open Desk', href: ADMIN_WORKSPACE_LINKS.deskTickets, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Open Services', href: ADMIN_WORKSPACE_LINKS.servicesRecords, enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
};

export const CRM_WIRING: WorkspaceWiring = {
  workspace: 'crm',
  navLinks: [
    { label: 'Dashboard', href: '/', exactMatch: true, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Business Accounts', href: '/accounts', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
  quickActions: [
    { label: 'New Account', href: '/accounts/new', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'crm.accounts.write' },
    { label: 'View Accounts', href: '/accounts', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
};

export const BILLING_WIRING: WorkspaceWiring = {
  workspace: 'billing',
  navLinks: [
    { label: 'Dashboard', href: '/', exactMatch: true, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Invoices', href: '/invoices', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
  quickActions: [
    { label: 'New Invoice', href: '/invoices/new', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'billing.invoices.write' },
    { label: 'View Invoices', href: '/invoices', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
};

export const DESK_WIRING: WorkspaceWiring = {
  workspace: 'desk',
  navLinks: [
    { label: 'Dashboard', href: '/', exactMatch: true, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Tickets', href: '/tickets', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
  quickActions: [
    { label: 'New Ticket', href: '/tickets/new', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'desk.tickets.write' },
    { label: 'View Tickets', href: '/tickets', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
};

export const SERVICES_WIRING: WorkspaceWiring = {
  workspace: 'services',
  navLinks: [
    { label: 'Dashboard', href: '/', exactMatch: true, enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Catalogue', href: '/catalogue', enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Service Records', href: '/records', enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'Energy Tracking', href: '/energy', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
  quickActions: [
    { label: 'Catalogue Item', href: '/catalogue/new', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'services.catalogue.write' },
    { label: 'Service Record', href: '/records/new', enabled: true, requiredRealm: ['platform', 'staff'], requiredPermission: 'services.records.write' },
    { label: 'Energy Tracking', href: '/energy', enabled: true, requiredRealm: ['platform', 'staff'] },
    { label: 'View Records', href: '/records', enabled: true, requiredRealm: ['platform', 'staff'] },
  ],
};

export const PORTAL_WIRING: WorkspaceWiring = {
  workspace: 'portal',
  navLinks: [
    { label: 'Dashboard', href: PORTAL_ROUTES.home, icon: '💼', exactMatch: true, enabled: true, requiredRealm: 'portal' },
    { label: 'Account', href: PORTAL_ROUTES.account, icon: '🏢', enabled: true, requiredRealm: 'portal' },
    { label: 'Products', href: PORTAL_ROUTES.products, icon: '📦', enabled: true, requiredRealm: 'portal' },
    { label: 'Services', href: PORTAL_ROUTES.services, icon: '🌐', enabled: true, requiredRealm: 'portal' },
    { label: 'Billing', href: PORTAL_ROUTES.billing, icon: '🧾', enabled: true, requiredRealm: 'portal' },
    { label: 'Tickets', href: PORTAL_ROUTES.tickets, icon: '🎫', enabled: true, requiredRealm: 'portal' },
    { label: 'Fleet / SIMs', href: PORTAL_ROUTES.fleet, icon: '📱', enabled: true, requiredRealm: 'portal' },
    { label: 'Users', href: PORTAL_ROUTES.users, icon: '👥', enabled: true, requiredRealm: 'portal' },
    { label: 'Settings', href: PORTAL_ROUTES.settings, icon: '⚙', enabled: true, requiredRealm: 'portal' },
  ],
  quickActions: [
    { label: 'Raise support ticket', href: `${PORTAL_ROUTES.tickets}?new=1`, enabled: true, requiredRealm: 'portal' },
    { label: 'View services', href: PORTAL_ROUTES.services, enabled: true, requiredRealm: 'portal' },
    { label: 'View invoices', href: PORTAL_ROUTES.billing, enabled: true, requiredRealm: 'portal' },
    { label: 'Request product information', href: PORTAL_ROUTES.products, enabled: true, requiredRealm: 'portal' },
    { label: 'Request energy review', href: `${PORTAL_ROUTES.tickets}?new=1&category=ENERGY`, enabled: true, requiredRealm: 'portal' },
    { label: 'Update SIM label / cost centre', href: PORTAL_ROUTES.fleet, enabled: true, requiredRealm: 'portal' },
  ],
};

export const WIRING_REGISTRY: Record<WorkspaceWiring['workspace'], WorkspaceWiring> = {
  admin: ADMIN_WIRING,
  crm: CRM_WIRING,
  billing: BILLING_WIRING,
  desk: DESK_WIRING,
  services: SERVICES_WIRING,
  portal: PORTAL_WIRING,
};
