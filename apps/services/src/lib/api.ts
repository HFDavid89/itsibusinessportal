import { apiFetch } from '@itsi-business/staff-shell';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CatalogueStatus  = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ServiceType      = 'MOBILE' | 'BROADBAND' | 'ENERGY' | 'SOFTWARE' | 'SUPPORT' | 'OTHER';
export type MobileStatus     = 'DRAFT' | 'REQUESTED' | 'ACTIVE' | 'SUSPENDED' | 'CEASED' | 'CANCELLED';
export type BroadbandStatus  = 'DRAFT' | 'REQUESTED' | 'ACTIVE' | 'SUSPENDED' | 'CEASED' | 'CANCELLED';
export type EnergyStatus = 'PROSPECT' | 'REFERRED_TO_FIDELITY' | 'QUOTE_IN_PROGRESS' | 'CONTRACTED' | 'RENEWAL_DUE' | 'LOST' | 'CEASED';
export type FuelType         = 'ELECTRICITY' | 'GAS' | 'DUAL_FUEL';
export type WholesaleLinkStatus = 'PLACEHOLDER' | 'PENDING' | 'ACTIVE' | 'CEASED';

export interface CatalogueCount {
  mobileServices: number;
  broadbandServices: number;
  energyServices: number;
}

export interface BusinessServiceCatalogueItem {
  id:                         string;
  sku:                        string;
  name:                       string;
  description:                string | null;
  serviceType:                ServiceType;
  status:                     CatalogueStatus;
  retailPricePence:           number;
  wholesaleCostEstimatePence: number | null;
  setupFeePence:              number | null;
  contractTermMonths:         number | null;
  taxRate:                    number;
  marginPolicy:               string | null;
  createdAt:                  string;
  updatedAt:                  string;
  _count?:                    CatalogueCount;
}

export interface AccountSummary {
  id:            string;
  companyName:   string;
  accountNumber: string;
}

export interface SiteSummary {
  id:       string;
  name:     string;
  postcode: string;
}

export interface CatalogueItemSummary {
  id:                string;
  sku:               string;
  name:              string;
  serviceType:       ServiceType;
  retailPricePence:  number;
  contractTermMonths: number | null;
  status:            CatalogueStatus;
}

export interface ItsiMobileWholesaleServiceLink {
  id:                         string;
  businessAccountId:          string;
  businessServiceType:        'MOBILE' | 'BROADBAND';
  businessServiceReference:   string;
  itsiMobileWholesaleOrderId: string | null;
  itsiMobileServiceOrderId:   string | null;
  safeProviderReference:      string | null;
  status:                     WholesaleLinkStatus;
  lastSyncedAt:               string | null;
  lastStatusCheckedAt:        string | null;
  createdAt:                  string;
  updatedAt:                  string;
}

export interface WholesaleInsights {
  upstreamStatus: string | null;
  upstreamFailure: boolean;
  staffWarning: string | null;
  suggestedAction: string | null;
}

export interface WholesaleStatusResponse {
  service: AnyService;
  wholesaleLink: ItsiMobileWholesaleServiceLink | null;
  wholesaleEnabled: boolean;
  wholesaleInsights?: WholesaleInsights;
}

export interface RequestWholesaleOrderInput {
  quoteId?: string;
  productCode?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  confirm: true;
}

export interface BusinessMobileService {
  id:                string;
  accountId:         string;
  contactId:         string | null;
  siteId:            string | null;
  catalogueItemId:   string | null;
  serviceReference:  string;
  displayName:       string;
  status:            MobileStatus;
  retailPricePence:  number;
  contractStartDate: string | null;
  contractEndDate:   string | null;
  mobileNumber:      string | null;
  simLabel:          string | null;
  costCentre:        string | null;
  wholesaleServiceLinkId: string | null;
  createdAt:         string;
  updatedAt:         string;
  _serviceType?:     'MOBILE';
  account?:          AccountSummary;
  catalogueItem?:    CatalogueItemSummary | null;
  wholesaleLink?:    ItsiMobileWholesaleServiceLink | null;
}

export interface BusinessBroadbandService {
  id:                string;
  accountId:         string;
  siteId:            string;
  catalogueItemId:   string | null;
  serviceReference:  string;
  displayName:       string;
  status:            BroadbandStatus;
  retailPricePence:  number;
  contractStartDate: string | null;
  contractEndDate:   string | null;
  accessTechnology:  string | null;
  postcode:          string;
  uprn:              string | null;
  circuitLabel:      string | null;
  wholesaleServiceLinkId: string | null;
  createdAt:         string;
  updatedAt:         string;
  _serviceType?:     'BROADBAND';
  account?:          AccountSummary;
  site?:             SiteSummary;
  catalogueItem?:    CatalogueItemSummary | null;
  wholesaleLink?:    ItsiMobileWholesaleServiceLink | null;
}

export interface BusinessEnergyService {
  id:                       string;
  accountId:                string;
  siteId:                   string;
  catalogueItemId:          string | null;
  serviceReference:         string;
  displayName:              string;
  status:                   EnergyStatus;
  fuelType:                 FuelType;
  supplierName:             string | null;
  fidelityReference:        string | null;
  meterPointReference:      string | null;
  mpan:                     string | null;
  mprn:                     string | null;
  contractStartDate:        string | null;
  contractEndDate:          string | null;
  renewalWindowStartDate:     string | null;
  nextCheckInDate:          string | null;
  lastCheckInDate:          string | null;
  checkInCadenceDays:       number | null;
  estimatedAnnualSpendPence: number | null;
  notes:                    string | null;
  customerVisible:          boolean;
  retailPriceDescription:   string | null;
  createdAt:                string;
  updatedAt:                string;
  _serviceType?:            'ENERGY';
  account?:                 AccountSummary;
  site?:                    SiteSummary;
  catalogueItem?:           CatalogueItemSummary | null;
}

export interface EnergyDashboardStats {
  total: number;
  contractsEnding: { days30: number; days60: number; days90: number; days180: number };
  renewalDue: number;
  checkInsDue: number;
  referralsInProgress: number;
  contracted: number;
  lost: number;
}

export type AnyService = (BusinessMobileService | BusinessBroadbandService | BusinessEnergyService) & { _serviceType: 'MOBILE' | 'BROADBAND' | 'ENERGY' };

// ── Helpers ───────────────────────────────────────────────────────────────────

export function money(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

export function fmt(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── API client ────────────────────────────────────────────────────────────────

export const catalogueApi = {
  list: (params?: {
    serviceType?: ServiceType;
    status?: CatalogueStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.serviceType) qs.set('serviceType', params.serviceType);
    if (params?.status)      qs.set('status',      params.status);
    if (params?.search)      qs.set('search',       params.search);
    if (params?.page)        qs.set('page',         String(params.page));
    if (params?.limit)       qs.set('limit',        String(params.limit));
    return apiFetch<{ success: true; data: BusinessServiceCatalogueItem[]; meta: { total: number; page: number; limit: number } }>(
      `/api/v1/services/catalogue?${qs}`
    );
  },

  get: (id: string) =>
    apiFetch<{ success: true; data: BusinessServiceCatalogueItem }>(`/api/v1/services/catalogue/${id}`),

  create: (body: {
    name:              string;
    serviceType:       ServiceType;
    retailPricePence:  number;
    description?:      string;
    status?:           CatalogueStatus;
    wholesaleCostEstimatePence?: number;
    setupFeePence?:    number;
    contractTermMonths?: number;
    taxRate?:          number;
    marginPolicy?:     string;
    sku?:              string;
  }) =>
    apiFetch<{ success: true; data: BusinessServiceCatalogueItem }>('/api/v1/services/catalogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{
    name:              string;
    description:       string;
    status:            CatalogueStatus;
    retailPricePence:  number;
    wholesaleCostEstimatePence: number;
    setupFeePence:     number;
    contractTermMonths: number;
    taxRate:           number;
    marginPolicy:      string;
    sku:               string;
  }>) =>
    apiFetch<{ success: true; data: BusinessServiceCatalogueItem }>(`/api/v1/services/catalogue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  archive: (id: string) =>
    apiFetch<{ success: true; data: BusinessServiceCatalogueItem }>(`/api/v1/services/catalogue/${id}/archive`, {
      method: 'POST',
    }),
};

export interface ServicesSummary {
  catalogue: { active: number };
  mobile:    { total: number; active: number };
  broadband: { total: number; active: number };
  energy:    { total: number; active: number };
}

export const servicesApi = {
  summary: () =>
    apiFetch<{ success: true; data: ServicesSummary }>('/api/v1/services/summary').then((r) => r.data),

  list: (params?: {
    accountId?: string;
    type?: 'MOBILE' | 'BROADBAND' | 'ENERGY';
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set('accountId', params.accountId);
    if (params?.type)      qs.set('type',      params.type);
    if (params?.status)    qs.set('status',    params.status);
    if (params?.page)      qs.set('page',      String(params.page));
    if (params?.limit)     qs.set('limit',     String(params.limit));
    return apiFetch<{ success: true; data: AnyService[]; meta: { total: number; page: number; limit: number } }>(
      `/api/v1/services?${qs}`
    );
  },

  get: (id: string) =>
    apiFetch<{ success: true; data: AnyService }>(`/api/v1/services/${id}`),

  createMobile: (body: {
    accountId:        string;
    displayName:      string;
    retailPricePence: number;
    contactId?:       string;
    siteId?:          string;
    catalogueItemId?: string;
    status?:          MobileStatus;
    contractStartDate?: string;
    contractEndDate?:   string;
    mobileNumber?:    string;
    simLabel?:        string;
    costCentre?:      string;
  }) =>
    apiFetch<{ success: true; data: BusinessMobileService }>('/api/v1/services/mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateMobile: (id: string, body: Record<string, unknown>) =>
    apiFetch<{ success: true; data: BusinessMobileService }>(`/api/v1/services/mobile/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  createBroadband: (body: {
    accountId:        string;
    siteId:           string;
    displayName:      string;
    postcode:         string;
    retailPricePence: number;
    catalogueItemId?: string;
    status?:          BroadbandStatus;
    contractStartDate?: string;
    contractEndDate?:   string;
    accessTechnology?: string;
    uprn?:            string;
    circuitLabel?:    string;
  }) =>
    apiFetch<{ success: true; data: BusinessBroadbandService }>('/api/v1/services/broadband', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateBroadband: (id: string, body: Record<string, unknown>) =>
    apiFetch<{ success: true; data: BusinessBroadbandService }>(`/api/v1/services/broadband/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  createEnergy: (body: {
    accountId:        string;
    siteId:           string;
    displayName:      string;
    fuelType:         FuelType;
    catalogueItemId?: string;
    status?:          EnergyStatus;
    supplierName?:    string;
    meterPointReference?: string;
    mpan?:            string;
    mprn?:            string;
    contractStartDate?: string;
    contractEndDate?:   string;
    checkInCadenceDays?: number;
    notes?:           string;
    customerVisible?: boolean;
  }) =>
    apiFetch<{ success: true; data: BusinessEnergyService }>('/api/v1/services/energy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateEnergy: (id: string, body: Record<string, unknown>) =>
    apiFetch<{ success: true; data: BusinessEnergyService }>(`/api/v1/services/energy/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getWholesaleLink: (serviceId: string) =>
    apiFetch<{ success: true; data: ItsiMobileWholesaleServiceLink | null }>(`/api/v1/services/${serviceId}/wholesale-link`),

  createWholesaleLinkPlaceholder: (serviceId: string, body: {
    businessServiceType:      'MOBILE' | 'BROADBAND';
    businessServiceReference: string;
    itsiMobileWholesaleOrderId?: string;
    itsiMobileServiceOrderId?:   string;
    safeProviderReference?:      string;
  }) =>
    apiFetch<{ success: true; data: ItsiMobileWholesaleServiceLink }>(`/api/v1/services/${serviceId}/wholesale-link-placeholder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getWholesaleStatus: (serviceType: 'mobile' | 'broadband', serviceId: string) =>
    apiFetch<{ success: true; data: WholesaleStatusResponse }>(`/api/v1/services/${serviceType}/${serviceId}/wholesale-status`),

  requestWholesaleOrder: (serviceType: 'mobile' | 'broadband', serviceId: string, body: RequestWholesaleOrderInput) =>
    apiFetch<{ success: true; data: AnyService }>(`/api/v1/services/${serviceType}/${serviceId}/request-wholesale-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  refreshWholesaleStatus: (serviceType: 'mobile' | 'broadband', serviceId: string) =>
    apiFetch<{ success: true; data: AnyService }>(`/api/v1/services/${serviceType}/${serviceId}/refresh-wholesale-status`, {
      method: 'POST',
    }),
};

export const energyApi = {
  dashboard: () =>
    apiFetch<{ success: true; data: EnergyDashboardStats }>('/api/v1/services/energy/dashboard'),

  list: (params?: {
    accountId?: string; status?: string; fuelType?: string; supplier?: string;
    renewalDue?: string; checkInDue?: string; page?: number; limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set('accountId', params.accountId);
    if (params?.status) qs.set('status', params.status);
    if (params?.fuelType) qs.set('fuelType', params.fuelType);
    if (params?.supplier) qs.set('supplier', params.supplier);
    if (params?.renewalDue) qs.set('renewalDue', params.renewalDue);
    if (params?.checkInDue) qs.set('checkInDue', params.checkInDue);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiFetch<{ success: true; data: BusinessEnergyService[]; meta: { total: number; page: number; limit: number } }>(
      `/api/v1/services/energy?${qs}`,
    );
  },

  get: (id: string) =>
    apiFetch<{ success: true; data: BusinessEnergyService }>(`/api/v1/services/energy/${id}`),

  create: (body: Parameters<typeof servicesApi.createEnergy>[0]) => servicesApi.createEnergy(body),

  update: (id: string, body: Record<string, unknown>) => servicesApi.updateEnergy(id, body),

  markReferred: (id: string) =>
    apiFetch<{ success: true; data: BusinessEnergyService }>(`/api/v1/services/energy/${id}/mark-referred`, { method: 'POST' }),

  markContracted: (id: string, body: { contractStartDate: string; contractEndDate: string; supplierName?: string; fidelityReference?: string }) =>
    apiFetch<{ success: true; data: BusinessEnergyService }>(`/api/v1/services/energy/${id}/mark-contracted`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  markLost: (id: string) =>
    apiFetch<{ success: true; data: BusinessEnergyService }>(`/api/v1/services/energy/${id}/mark-lost`, { method: 'POST' }),

  completeCheckIn: (id: string, body?: { notes?: string; scheduleNext?: boolean }) =>
    apiFetch<{ success: true; data: BusinessEnergyService }>(`/api/v1/services/energy/${id}/check-ins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }),
};

// ── Work Queue (Phase 14) ─────────────────────────────────────────────────────

export type WorkItemType =
  | 'WHOLESALE_ORDER' | 'WHOLESALE_STATUS_REVIEW' | 'CUSTOMER_SERVICE_REQUEST'
  | 'SIM_METADATA_CHANGE' | 'PRODUCT_ENQUIRY' | 'ENERGY_REVIEW' | 'BILLING_QUERY' | 'SUPPORT_ESCALATION';

export type WorkItemStatus =
  | 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'WAITING_INTERNAL'
  | 'WAITING_ITSI_MOBILE' | 'RESOLVED' | 'CANCELLED';

export type SlaStatus = 'ON_TRACK' | 'DUE_SOON' | 'BREACHED' | 'COMPLETED';

export interface WorkItemComment {
  id: string;
  workItemId: string;
  body: string;
  authorId: string;
  authorType: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  accountId: string;
  serviceType?: string | null;
  serviceId?: string | null;
  ticketId?: string | null;
  wholesaleLinkId?: string | null;
  assignedToStaffUserId?: string | null;
  dueAt?: string | null;
  slaBreachedAt?: string | null;
  completedAt?: string | null;
  source: string;
  title: string;
  description?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  slaStatus?: SlaStatus;
  slaBreached?: boolean;
  account?: { id: string; companyName: string; accountNumber: string };
  ticket?: { id: string; ticketNumber: string; subject: string; status: string } | null;
  wholesaleLink?: {
    id: string;
    status: string;
    businessServiceType: string;
    businessServiceReference: string;
    itsiMobileWholesaleOrderId: string | null;
  } | null;
  comments?: WorkItemComment[];
}

export interface WorkQueueStats {
  open: number;
  assignedToMe: number;
  unassigned: number;
  dueSoon: number;
  breached: number;
  waitingItsiMobile: number;
  productEnquiries: number;
  energyReviews: number;
}

export const workItemsApi = {
  stats: () =>
    apiFetch<{ success: true; data: WorkQueueStats }>('/api/v1/work-items/stats'),

  list: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params ?? {});
    return apiFetch<{ success: true; data: WorkItem[]; meta: { total: number; page: number; limit: number } }>(
      `/api/v1/work-items?${qs}`,
    );
  },

  get: (id: string) =>
    apiFetch<{ success: true; data: WorkItem }>(`/api/v1/work-items/${id}`),

  assign: (id: string, staffUserId: string) =>
    apiFetch<{ success: true; data: WorkItem }>(`/api/v1/work-items/${id}/assign`, {
      method: 'POST',
      body: { staffUserId },
    }),

  start: (id: string) =>
    apiFetch<{ success: true; data: WorkItem }>(`/api/v1/work-items/${id}/start`, { method: 'POST' }),

  resolve: (id: string, internalNotes?: string) =>
    apiFetch<{ success: true; data: WorkItem }>(`/api/v1/work-items/${id}/resolve`, {
      method: 'POST',
      body: internalNotes ? { internalNotes } : {},
    }),

  comment: (id: string, body: string) =>
    apiFetch<{ success: true; data: WorkItemComment }>(`/api/v1/work-items/${id}/comment`, {
      method: 'POST',
      body: { body },
    }),
};
