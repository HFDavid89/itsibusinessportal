/**
 * Itsi Business workspace URL definitions.
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * Staff workspaces: admin (17005), crm (17006), billing (17007), desk (17008), services (17010).
 * Customer workspace: portal (4009) — business customer self-service.
 */

export type WorkspaceKey = 'admin' | 'crm' | 'billing' | 'desk' | 'portal' | 'services';

export const WORKSPACE_URLS = {
  admin:   process.env.NEXT_PUBLIC_ADMIN_URL   ?? 'http://localhost:4005',
  crm:     process.env.NEXT_PUBLIC_CRM_URL     ?? 'http://localhost:4006',
  billing: process.env.NEXT_PUBLIC_BILLING_URL ?? 'http://localhost:4007',
  desk:    process.env.NEXT_PUBLIC_DESK_URL    ?? 'http://localhost:4008',
  portal:   process.env.NEXT_PUBLIC_PORTAL_URL   ?? 'http://localhost:4009',
  services: process.env.NEXT_PUBLIC_SERVICES_URL ?? 'http://localhost:17010',
} as const;

export const ADMIN_WORKSPACE_LINKS = {
  crmAccounts:     `${WORKSPACE_URLS.crm}/accounts`,
  billingInvoices: `${WORKSPACE_URLS.billing}/invoices`,
  deskTickets:       `${WORKSPACE_URLS.desk}/tickets`,
  servicesCatalogue: `${WORKSPACE_URLS.services}/catalogue`,
  servicesRecords:   `${WORKSPACE_URLS.services}/records`,
} as const;

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
