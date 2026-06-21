import { apiFetch } from '@itsi-business/staff-shell';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CatalogueStatus  = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ServiceType      = 'MOBILE' | 'BROADBAND' | 'ENERGY' | 'SOFTWARE' | 'SUPPORT' | 'OTHER';
export type MobileStatus     = 'DRAFT' | 'REQUESTED' | 'ACTIVE' | 'SUSPENDED' | 'CEASED' | 'CANCELLED';
export type BroadbandStatus  = 'DRAFT' | 'REQUESTED' | 'ACTIVE' | 'SUSPENDED' | 'CEASED' | 'CANCELLED';
export type EnergyStatus     = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'CEASED';
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
  createdAt:                  string;
  updatedAt:                  string;
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
  id:                    string;
  accountId:             string;
  siteId:                string;
  catalogueItemId:       string | null;
  serviceReference:      string;
  displayName:           string;
  status:                EnergyStatus;
  fuelType:              FuelType;
  meterPointReference:   string | null;
  retailPriceDescription: string | null;
  contractStartDate:     string | null;
  contractEndDate:       string | null;
  createdAt:             string;
  updatedAt:             string;
  _serviceType?:         'ENERGY';
  account?:              AccountSummary;
  site?:                 SiteSummary;
  catalogueItem?:        CatalogueItemSummary | null;
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

export const servicesApi = {
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
    retailPricePence?: number;
    catalogueItemId?: string;
    status?:          EnergyStatus;
    meterPointReference?: string;
    retailPriceDescription?: string;
    contractStartDate?: string;
    contractEndDate?:   string;
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
};
