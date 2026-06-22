import { apiFetch } from '@itsi-business/staff-shell';

export const reportsApi = {
  overview: () =>
    apiFetch<{ success: true; data: OverviewReport }>('/api/v1/reports/overview'),

  billing: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params ?? '').toString();
    return apiFetch<{ success: true; data: BillingReport }>(`/api/v1/reports/billing${qs ? `?${qs}` : ''}`);
  },

  services: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params ?? '').toString();
    return apiFetch<{ success: true; data: ServicesReport }>(`/api/v1/reports/services${qs ? `?${qs}` : ''}`);
  },

  desk: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params ?? '').toString();
    return apiFetch<{ success: true; data: DeskReport }>(`/api/v1/reports/desk${qs ? `?${qs}` : ''}`);
  },

  workItems: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params ?? '').toString();
    return apiFetch<{ success: true; data: WorkItemsReport }>(`/api/v1/reports/work-items${qs ? `?${qs}` : ''}`);
  },

  energy: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params ?? '').toString();
    return apiFetch<{ success: true; data: EnergyReport }>(`/api/v1/reports/energy${qs ? `?${qs}` : ''}`);
  },

  products: () =>
    apiFetch<{ success: true; data: ProductsReport }>('/api/v1/reports/products'),

  accounts: () =>
    apiFetch<{ success: true; data: AccountsReport }>('/api/v1/reports/accounts'),
};

export interface OverviewReport {
  accounts: { total: number; active: number };
  services: { active: number; mobile: number; broadband: number; energy: number; mix: Array<{ type: string; count: number }> };
  tickets: { open: number };
  workItems: { open: number; breached: number; dueSoon: number; assignedToMe: number };
  billing: { outstandingPence: number; overduePence: number; overdueCount: number };
  productEnquiries: { open: number };
  energy: { renewalsDue: number; checkInsDue: number };
  trends: { note: string; last30Days: Record<string, number> };
  generatedAt: string;
}

export interface BillingReport {
  outstandingPence: number;
  overduePence: number;
  overdueAccountsCount: number;
  statusCounts: Record<string, number>;
  dueSoon: { days7: number; days14: number; days30: number };
  ageingBuckets: Array<{ key: string; label: string; count: number; balancePence: number }>;
  billingByServiceType: Array<{ serviceType: string; totalPence: number }>;
  topOverdueAccounts: Array<{ accountId: string; companyName: string; balancePence: number; count: number }>;
  generatedAt: string;
}

export interface ServicesReport {
  mobile: { active: number; byStatus: Array<{ status: string; count: number }> };
  broadband: { active: number; byStatus: Array<{ status: string; count: number }>; byAccessTechnology: Array<{ accessTechnology: string; count: number }> };
  energy: { active: number; byStatus: Array<{ status: string; count: number }> };
  dataQuality: { mobileWithoutContact: number; servicesWithOpenWorkItems: number };
  wholesale: { label: string; byStatus: Array<{ status: string; count: number }> };
  generatedAt: string;
}

export interface DeskReport {
  open: number;
  unassigned: number;
  withWorkItems: number;
  averageOpenAgeDays: number;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  oldestOpen: Array<{ id: string; ticketNumber: string; subject: string; accountId: string; companyName?: string; ageDays: number }>;
  generatedAt: string;
}

export interface WorkItemsReport {
  open: number;
  assignedToMe: number;
  unassigned: number;
  dueSoon: number;
  breached: number;
  completedThisMonth: number;
  averageOpenAgeDays: number;
  byType: Array<{ type: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  breachedByType: Array<{ type: string; count: number }>;
  oldestOpen: Array<{ id: string; title: string; type: string; accountId: string; companyName?: string; ageDays: number }>;
  generatedAt: string;
}

export interface EnergyReport {
  label: string;
  byStatus: Array<{ status: string; count: number }>;
  pipeline: { referred: number; quoteInProgress: number; contracted: number; lost: number };
  renewalsDue: { days30: number; days60: number; days90: number };
  checkInsDueNext30Days: number;
  missingSupplierOrMeterData: number;
  estimatedAnnualSpendPence: number;
  recordsWithSpendEntered: number;
  generatedAt: string;
}

export interface ProductsReport {
  catalogue: { customerVisibleActive: number; incompleteCustomerVisible: number };
  productEnquiries: {
    open: number;
    byServiceType: Array<{ serviceType: string; count: number }>;
    recent: Array<{ id: string; title: string; accountId: string; createdAt: string; account?: { companyName: string } }>;
  };
  generatedAt: string;
}

export interface AccountsReport {
  summary: { healthy: number; watch: number; atRisk: number; needsAttention: number };
  accountsAtRisk: Array<{
    accountId: string;
    companyName: string;
    accountNumber: string;
    accountStatus: string;
    health: { tier: string; score: number; label: string };
    openTickets: number;
    overdueInvoices: number;
    overdueBalancePence: number;
  }>;
  overdueDebtWithOpenTickets: Array<{
    accountId: string;
    companyName: string;
    openTickets: number;
    overdueInvoices: number;
  }>;
  accountsWithoutContacts: Array<{ accountId: string; companyName: string; accountNumber: string }>;
  generatedAt: string;
}
