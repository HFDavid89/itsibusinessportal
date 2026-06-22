/**
 * Typed Billing API client — uses shared staff-shell transport.
 */
import { apiFetch } from '@itsi-business/staff-shell';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PART_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
export type ServiceType   = 'MOBILE' | 'BROADBAND' | 'ENERGY' | 'SOFTWARE' | 'SUPPORT' | 'OTHER';

export interface BusinessInvoiceLine {
  id:                       string;
  invoiceId:                string;
  description:              string;
  serviceType:              ServiceType | null;
  quantity:                 number;
  unitPricePence:           number;
  discountAmountPence:      number;
  taxRate:                  number;
  netAmountPence:           number;
  taxAmountPence:           number;
  grossAmountPence:         number;
  businessServiceReference: string | null;
  wholesaleCostReference:   string | null;
  createdAt:                string;
  updatedAt:                string;
}

export interface BusinessPayment {
  id:                    string;
  invoiceId:             string;
  accountId:             string;
  amountPence:           number;
  currency:              string;
  method:                string;
  reference:             string | null;
  notes:                 string | null;
  paidAt:                string;
  recordedByStaffUserId: string | null;
  createdAt:             string;
}

export interface BusinessInvoice {
  id:                  string;
  invoiceNumber:       string;
  accountId:           string;
  status:              InvoiceStatus;
  issueDate:           string | null;
  dueDate:             string | null;
  notes:               string | null;
  subtotalPence:       number;
  taxTotalPence:       number;
  discountTotalPence:  number;
  totalPence:          number;
  amountPaidPence:     number;
  currency:            string;
  createdAt:           string;
  updatedAt:           string;
  account?: { id: string; companyName: string; accountNumber: string };
  lines?:   BusinessInvoiceLine[];
  payments?: BusinessPayment[];
  _count?: { lines: number; payments: number };
}
// ── Types ──────────────────────────────────────────────────────────────────────

export const billingApi = {
  invoices: (params?: {
    status?: InvoiceStatus;
    accountId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status)    qs.set('status',    params.status);
    if (params?.accountId) qs.set('accountId', params.accountId);
    if (params?.search)    qs.set('search',    params.search);
    if (params?.page)      qs.set('page',      String(params.page));
    if (params?.limit)     qs.set('limit',     String(params.limit));
    return apiFetch<{ success: true; data: BusinessInvoice[]; meta: { total: number; page: number; limit: number } }>(
      `/api/v1/invoices?${qs}`
    );
  },

  invoice: (id: string) =>
    apiFetch<{ success: true; data: BusinessInvoice }>(`/api/v1/invoices/${id}`),

  createInvoice: (data: { accountId: string; dueDate?: string; notes?: string }) =>
    apiFetch<{ success: true; data: BusinessInvoice }>('/api/v1/invoices', {
      method: 'POST',
      body: data,
    }),

  patchInvoice: (id: string, data: { dueDate?: string; notes?: string }) =>
    apiFetch<{ success: true; data: BusinessInvoice }>(`/api/v1/invoices/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  addLine: (invoiceId: string, data: {
    description: string;
    serviceType?: ServiceType;
    quantity?: number;
    unitPricePence: number;
    discountAmountPence?: number;
    taxRate?: number;
    businessServiceReference?: string;
    wholesaleCostReference?: string;
  }) => apiFetch<{ success: true; data: BusinessInvoiceLine }>(`/api/v1/invoices/${invoiceId}/lines`, {
    method: 'POST',
    body: data,
  }),

  patchLine: (invoiceId: string, lineId: string, data: Partial<{
    description: string;
    serviceType: ServiceType;
    quantity: number;
    unitPricePence: number;
    discountAmountPence: number;
    taxRate: number;
  }>) => apiFetch<{ success: true; data: BusinessInvoiceLine }>(`/api/v1/invoices/${invoiceId}/lines/${lineId}`, {
    method: 'PATCH',
    body: data,
  }),

  deleteLine: (invoiceId: string, lineId: string) =>
    apiFetch<{ success: true }>(`/api/v1/invoices/${invoiceId}/lines/${lineId}`, { method: 'DELETE' }),

  issueInvoice: (id: string) =>
    apiFetch<{ success: true; data: BusinessInvoice }>(`/api/v1/invoices/${id}/issue`, { method: 'POST' }),

  voidInvoice: (id: string, reason?: string) =>
    apiFetch<{ success: true; data: BusinessInvoice }>(`/api/v1/invoices/${id}/void`, {
      method: 'POST',
      body: { reason },
    }),

  markPaid: (id: string, data: {
    amountPence: number;
    method?: string;
    reference?: string;
    notes?: string;
    paidAt?: string;
  }) => apiFetch<{ success: true; data: { invoice: BusinessInvoice; payment: BusinessPayment } }>(`/api/v1/invoices/${id}/mark-paid`, {
    method: 'POST',
    body: data,
  }),
};

// ── Money formatting ───────────────────────────────────────────────────────────

export function money(pence: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(pence / 100);
}

export function balanceDue(invoice: BusinessInvoice) {
  return Math.max(0, invoice.totalPence - invoice.amountPaidPence);
}
