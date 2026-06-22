const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:17001';

async function portalFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export interface PortalMe {
  user: { id: string; email: string; firstName: string; lastName: string; realm: string };
  account: { id: string; accountNumber: string; companyName: string; tradingName: string | null; status: string };
}

export interface PortalDashboard {
  tickets: { open: number };
  services: { active: number; mobile: number; broadband: number; energy: number };
  invoices: {
    totalPence: number;
    overduePence: number;
    outstandingPence: number;
    collectedPence: number;
    draftCount: number;
    issuedCount: number;
    paidCount: number;
  };
}

export function fmtPence(pence: number) {
  if (pence >= 100_000_00) return `£${(pence / 100_000_00).toFixed(1)}m`;
  if (pence >= 1_000_00) return `£${(pence / 1_000_00).toFixed(1)}k`;
  return `£${(pence / 100).toFixed(2)}`;
}

export const portalApi = {
  me: () => portalFetch<PortalMe>('/api/v1/portal/me'),
  dashboard: () => portalFetch<PortalDashboard>('/api/v1/portal/dashboard'),
};
