import { apiFetch } from '@itsi-business/staff-shell';
import { toPortalStatusLabel } from '@itsi-business/core';

export { toPortalStatusLabel };

type ApiEnvelope<T> = { success: boolean; data: T; meta?: { total: number; page: number; limit: number } };

async function get<T>(path: string): Promise<T> {
  const res = await apiFetch<ApiEnvelope<T>>(path);
  return res.data;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch<ApiEnvelope<T>>(path, { method: 'POST', body });
  return res.data;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch<ApiEnvelope<T>>(path, { method: 'PATCH', body });
  return res.data;
}

export interface PortalAccount {
  id: string;
  accountNumber: string;
  companyName: string;
  tradingName: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  status: string;
}

export interface PortalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  realm: string;
  portalRole?: string;
  isActive: boolean;
  createdAt?: string;
}

export type PortalRole = 'ACCOUNT_ADMIN' | 'BILLING_CONTACT' | 'TECHNICAL_CONTACT' | 'READ_ONLY';

export interface PortalMe {
  user: PortalUser;
  account: PortalAccount;
}

export interface PortalDashboard {
  account: Pick<PortalAccount, 'companyName' | 'accountNumber' | 'status'> | null;
  tickets: { open: number; recent: PortalTicketSummary[] };
  services: { active: number; mobile: number; broadband: number; energy: number };
  invoices: {
    overduePence: number;
    outstandingPence: number;
    collectedPence: number;
    issuedCount: number;
    paidCount: number;
    recent: PortalInvoiceSummary[];
  };
  productEnquiries: { open: number };
  energy: {
    renewalsDue: number;
    upcomingCheckIns: Array<{
      id: string;
      displayName: string;
      status: string;
      statusLabel: string;
      nextCheckInDate: string | null;
      contractEndDate: string | null;
    }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    label: string;
    createdAt: string;
  }>;
}

export interface PortalInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
  totalPence: number;
  amountPaidPence: number;
  balanceDuePence: number;
  issueDate: string | null;
  dueDate: string | null;
}

export interface PortalInvoiceDetail extends PortalInvoiceSummary {
  subtotalPence: number;
  taxTotalPence: number;
  discountTotalPence: number;
  currency: string;
  notes: string | null;
  lines: Array<{
    id: string;
    description: string;
    serviceType: string | null;
    quantity: number;
    unitPricePence: number;
    grossAmountPence: number;
    businessServiceReference?: string | null;
    serviceLink?: { displayName: string; serviceId: string; serviceType: string } | null;
  }>;
}

export interface PortalTicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortalTicketDetail extends PortalTicketSummary {
  description: string | null;
  threads: Array<{ id: string; body: string; authorType: string; createdAt: string }>;
}

export interface PortalProduct {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  retailPricePence: number;
  setupFeePence: number | null;
  contractTermMonths: number | null;
  availability?: string;
}

export interface PortalServiceItem {
  id: string;
  serviceReference: string;
  displayName: string;
  status: string;
  statusLabel?: string;
  type: 'MOBILE' | 'BROADBAND' | 'ENERGY';
  retailPricePence?: number;
  mobileNumber?: string | null;
  simLabel?: string | null;
  costCentre?: string | null;
  accessTechnology?: string | null;
  postcode?: string | null;
  fuelType?: string | null;
  supplierName?: string | null;
  contractEndDate?: string | null;
  renewalWindowStartDate?: string | null;
  nextCheckInDate?: string | null;
  renewalStatusLabel?: string | null;
  nextReviewLabel?: string | null;
  site?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
}

export interface PortalFleetItem {
  id: string;
  serviceReference: string;
  displayName: string;
  status: string;
  statusLabel?: string;
  mobileNumber: string | null;
  simLabel: string | null;
  costCentre: string | null;
  retailPricePence: number;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

export interface PortalRelatedInvoice {
  lineId: string;
  description: string;
  grossAmountPence: number;
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
  issueDate: string | null;
}

export interface PortalServiceDetail {
  service: PortalServiceItem & {
    contractStartDate?: string | null;
    energyBillingNote?: string;
    accessTechnology?: string | null;
    postcode?: string | null;
    circuitLabel?: string | null;
  };
  relatedInvoices: PortalRelatedInvoice[];
  relatedTickets: PortalTicketSummary[];
}

export interface PortalFleetDetail {
  sim: PortalFleetItem;
  relatedInvoices: PortalRelatedInvoice[];
  relatedTickets: PortalTicketSummary[];
}

export interface PortalAccountDetail {
  account: PortalAccount & { createdAt?: string };
  sites: Array<{ id: string; name: string; addressLine1: string; city: string; postcode: string; isPrimary: boolean }>;
  contacts: Array<{ id: string; firstName: string; lastName: string; email: string; phone: string | null; role: string; isPrimary: boolean }>;
}

export function fmtPence(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

export function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  WAITING_CUSTOMER: 'Awaiting your response',
  WAITING_INTERNAL: 'Being reviewed',
  WAITING_ITSI_MOBILE: 'With our provisioning team',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const portalApi = {
  me: () => get<PortalMe>('/api/v1/portal/me'),
  dashboard: () => get<PortalDashboard>('/api/v1/portal/dashboard'),
  account: () => get<PortalAccountDetail>('/api/v1/portal/account'),
  updateContactDetails: (body: { firstName: string; lastName: string }) =>
    patch<PortalUser>('/api/v1/portal/account/contact-details', body),
  products: () => get<PortalProduct[]>('/api/v1/portal/products'),
  enquireProduct: (id: string, body: { message?: string }) =>
    post<{ ticket: PortalTicketSummary; productName: string }>(`/api/v1/portal/products/${id}/enquiry`, body),
  services: () => get<{ mobile: PortalServiceItem[]; broadband: PortalServiceItem[]; energy: PortalServiceItem[] }>('/api/v1/portal/services'),
  service: (id: string) => get<PortalServiceDetail>(`/api/v1/portal/services/${id}`),
  createServiceTicket: (id: string, body: { message: string; subject?: string }) =>
    post<{ ticket: PortalTicketSummary }>(`/api/v1/portal/services/${id}/tickets`, body),
  invoices: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
    return apiFetch<ApiEnvelope<PortalInvoiceSummary[]>>(`/api/v1/portal/invoices${q}`).then((r) => r);
  },
  invoice: (id: string) => get<PortalInvoiceDetail>(`/api/v1/portal/invoices/${id}`),
  tickets: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
    return apiFetch<ApiEnvelope<PortalTicketSummary[]>>(`/api/v1/portal/tickets${q}`).then((r) => r);
  },
  ticket: (id: string) => get<PortalTicketDetail>(`/api/v1/portal/tickets/${id}`),
  createTicket: (body: { subject: string; description?: string; category?: string; priority?: string; message?: string }) =>
    post<PortalTicketSummary>('/api/v1/portal/tickets', body),
  replyToTicket: (id: string, body: string) =>
    post<{ id: string; body: string; createdAt: string }>(`/api/v1/portal/tickets/${id}/replies`, { body }),
  fleet: () => get<PortalFleetItem[]>('/api/v1/portal/fleet'),
  fleetDetail: (id: string) => get<PortalFleetDetail>(`/api/v1/portal/fleet/${id}`),
  updateFleet: (id: string, body: { simLabel?: string; costCentre?: string }) =>
    patch<PortalFleetItem>(`/api/v1/portal/fleet/${id}`, body),
  createFleetSupport: (id: string, body: { message: string; subject?: string }) =>
    post<{ ticket: PortalTicketSummary }>(`/api/v1/portal/fleet/${id}/support`, body),
  users: () => get<PortalUser[]>('/api/v1/portal/users'),
  createUser: (body: { email: string; firstName: string; lastName: string; password: string; portalRole?: PortalRole }) =>
    post<PortalUser>('/api/v1/portal/users', body),
  updateUser: (id: string, body: { firstName?: string; lastName?: string; isActive?: boolean; portalRole?: PortalRole }) =>
    patch<PortalUser>(`/api/v1/portal/users/${id}`, body),
};
