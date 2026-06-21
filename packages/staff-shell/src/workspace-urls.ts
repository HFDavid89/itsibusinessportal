/**
 * Itsi Business workspace URL definitions.
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 */

export type WorkspaceKey = 'admin' | 'crm' | 'billing' | 'desk';

export const WORKSPACE_URLS = {
  admin: process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:4005',
  crm: process.env.NEXT_PUBLIC_CRM_URL ?? 'http://localhost:4006',
  billing: process.env.NEXT_PUBLIC_BILLING_URL ?? 'http://localhost:4007',
  desk: process.env.NEXT_PUBLIC_DESK_URL ?? 'http://localhost:4008',
} as const;

export const ADMIN_WORKSPACE_LINKS = {
  crmAccounts: `${WORKSPACE_URLS.crm}/accounts`,
  billingInvoices: `${WORKSPACE_URLS.billing}/invoices`,
  deskTickets: `${WORKSPACE_URLS.desk}/tickets`,
} as const;

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
