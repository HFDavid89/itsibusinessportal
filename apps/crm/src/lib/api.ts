/**
 * Typed CRM API client for Itsi Business.
 * Wraps the Itsi Business API at /api/v1/accounts/*.
 * No Itsi Mobile, Gamma, KCOM, MS3, or provider calls here.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

// ── Domain types ──────────────────────────────────────────────────────────────

export type AccountStatus = 'PROSPECT' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type ContactRole = 'PRIMARY' | 'BILLING' | 'TECHNICAL' | 'GENERAL';

export interface BusinessAccount {
  id: string;
  accountNumber: string;
  companyName: string;
  tradingName?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  contacts?: BusinessContact[];
  sites?: BusinessSite[];
  _count?: { contacts: number; sites: number; tickets: number; invoices: number; mobileServices: number; broadbandServices: number };
}

export interface BusinessContact {
  id: string;
  accountId: string;
  siteId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: ContactRole;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSite {
  id: string;
  accountId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  county?: string | null;
  postcode: string;
  uprn?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { contacts: number };
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PART_PAID' | 'PAID' | 'OVERDUE' | 'VOID';

export interface BusinessInvoice {
  id: string;
  invoiceNumber: string;
  accountId: string;
  status: InvoiceStatus;
  dueDate?: string | null;
  issuedAt?: string | null;
  subtotalPence: number;
  taxTotalPence: number;
  totalPence: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { lines: number; payments: number };
}

export type ServiceStatus = 'DRAFT' | 'REQUESTED' | 'ACTIVE' | 'SUSPENDED' | 'CEASED' | 'CANCELLED';
export type ServiceType = 'MOBILE' | 'BROADBAND' | 'ENERGY';

export interface BusinessService {
  id: string;
  _serviceType: ServiceType;
  accountId: string;
  displayName: string;
  status: ServiceStatus;
  retailPricePence: number;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
  mobileNumber?: string | null;
  simLabel?: string | null;
  postcode?: string | null;
  accessTechnology?: string | null;
  fuelType?: string | null;
  site?: { id: string; name: string; postcode: string } | null;
  catalogueItem?: { id: string; name: string; sku: string; serviceType: string } | null;
}

export interface TimelineEvent {
  id: string;
  type: string;
  accountId: string;
  actorId?: string | null;
  actorType: string;
  meta: Record<string, unknown>;
  occurredAt: string;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: { total: number; page: number; limit: number };
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

// ── Create input types ────────────────────────────────────────────────────────

export interface CreateAccountInput {
  companyName: string;
  tradingName?: string;
  companyNumber?: string;
  vatNumber?: string;
  status?: AccountStatus;
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: ContactRole;
  isPrimary?: boolean;
  siteId?: string;
}

export interface CreateSiteInput {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
  uprn?: string;
  isPrimary?: boolean;
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  const json = await res.json();

  if (!res.ok) {
    const err = (json as ApiError).error;
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }

  return json as T;
}

// ── CRM API ───────────────────────────────────────────────────────────────────

export const crmApi = {
  // Accounts
  accounts: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return apiFetch<ApiResponse<BusinessAccount[]>>(`/api/v1/accounts${qs ? `?${qs}` : ''}`);
  },

  account: (id: string) =>
    apiFetch<ApiResponse<BusinessAccount>>(`/api/v1/accounts/${id}`),

  createAccount: (data: CreateAccountInput) =>
    apiFetch<ApiResponse<BusinessAccount>>('/api/v1/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAccount: (id: string, data: Partial<CreateAccountInput>) =>
    apiFetch<ApiResponse<BusinessAccount>>(`/api/v1/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Contacts
  contacts: (accountId: string) =>
    apiFetch<ApiResponse<BusinessContact[]>>(`/api/v1/accounts/${accountId}/contacts`),

  createContact: (accountId: string, data: CreateContactInput) =>
    apiFetch<ApiResponse<BusinessContact>>(`/api/v1/accounts/${accountId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateContact: (accountId: string, contactId: string, data: Partial<CreateContactInput>) =>
    apiFetch<ApiResponse<BusinessContact>>(`/api/v1/accounts/${accountId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Sites
  sites: (accountId: string) =>
    apiFetch<ApiResponse<BusinessSite[]>>(`/api/v1/accounts/${accountId}/sites`),

  createSite: (accountId: string, data: CreateSiteInput) =>
    apiFetch<ApiResponse<BusinessSite>>(`/api/v1/accounts/${accountId}/sites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSite: (accountId: string, siteId: string, data: Partial<CreateSiteInput>) =>
    apiFetch<ApiResponse<BusinessSite>>(`/api/v1/accounts/${accountId}/sites/${siteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Invoices for account
  accountInvoices: (accountId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({ accountId });
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<ApiResponse<BusinessInvoice[]>>(`/api/v1/invoices?${q.toString()}`);
  },

  // Services for account
  accountServices: (accountId: string, params?: { type?: ServiceType; page?: number; limit?: number }) => {
    const q = new URLSearchParams({ accountId });
    if (params?.type) q.set('type', params.type);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<ApiResponse<BusinessService[]>>(`/api/v1/services?${q.toString()}`);
  },

  // Timeline
  timeline: (accountId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return apiFetch<ApiResponse<TimelineEvent[]>>(`/api/v1/accounts/${accountId}/timeline${qs ? `?${qs}` : ''}`);
  },

  energyRecords: (accountId: string) =>
    apiFetch<ApiResponse<EnergyRecord[]>>(`/api/v1/services/energy?accountId=${accountId}&limit=100`),

  markEnergyReferred: (id: string) =>
    apiFetch<ApiResponse<EnergyRecord>>(`/api/v1/services/energy/${id}/mark-referred`, { method: 'POST' }),

  completeEnergyCheckIn: (id: string) =>
    apiFetch<ApiResponse<EnergyRecord>>(`/api/v1/services/energy/${id}/check-ins`, { method: 'POST', body: JSON.stringify({}) }),

  markEnergyLost: (id: string) =>
    apiFetch<ApiResponse<EnergyRecord>>(`/api/v1/services/energy/${id}/mark-lost`, { method: 'POST' }),
};

interface EnergyRecord {
  id: string;
  displayName: string;
  status: string;
  fuelType: string;
  supplierName?: string | null;
  contractEndDate?: string | null;
  nextCheckInDate?: string | null;
  notes?: string | null;
  site?: { name: string } | null;
}
