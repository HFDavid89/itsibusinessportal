const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `API error ${res.status}`);
  return json as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TicketStatus   = 'OPEN' | 'WAITING_CUSTOMER' | 'WAITING_INTERNAL' | 'WAITING_ITSI_MOBILE' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketCategory = 'GENERAL' | 'BILLING' | 'MOBILE' | 'BROADBAND' | 'ENERGY' | 'SOFTWARE' | 'ACCOUNT';

export interface BusinessTicket {
  id:                           string;
  ticketNumber:                 string;
  accountId:                    string;
  contactId:                    string | null;
  siteId:                       string | null;
  subject:                      string;
  description:                  string | null;
  category:                     TicketCategory;
  status:                       TicketStatus;
  priority:                     TicketPriority;
  assignedToStaffUserId:        string | null;
  wholesaleEscalationId:        string | null;
  wholesaleEscalationReference: string | null;
  createdAt:                    string;
  updatedAt:                    string;
  account?: { id: string; companyName: string; accountNumber: string };
  site?:    { id: string; name: string; addressLine1: string; postcode: string } | null;
  threads?: BusinessTicketThread[];
  _latestThread?: Pick<BusinessTicketThread, 'id' | 'body' | 'isInternal' | 'createdAt'>;
}

export interface BusinessTicketThread {
  id:              string;
  ticketId:        string;
  body:            string;
  authorType:      string;
  authorId:        string;
  isInternal:      boolean;
  customerVisible: boolean;
  createdAt:       string;
}

export interface CreateTicketInput {
  accountId:   string;
  contactId?:  string;
  siteId?:     string;
  subject:     string;
  description?: string;
  category?:   TicketCategory;
  priority?:   TicketPriority;
  message?:    string;
}

export interface PatchTicketInput {
  status?:               TicketStatus;
  priority?:             TicketPriority;
  category?:             TicketCategory;
  subject?:              string;
  assignedToStaffUserId?: string | null;
}

interface ApiList<T>   { success: boolean; data: T[]; meta?: { total: number; page: number; limit: number } }
interface ApiSingle<T> { success: boolean; data: T }

// ── API client ────────────────────────────────────────────────────────────────

export const deskApi = {
  tickets(params?: {
    status?: string; priority?: string; category?: string;
    accountId?: string; search?: string; page?: number; limit?: number;
  }): Promise<ApiList<BusinessTicket>> {
    const q = new URLSearchParams();
    if (params?.status)    q.set('status', params.status);
    if (params?.priority)  q.set('priority', params.priority);
    if (params?.category)  q.set('category', params.category);
    if (params?.accountId) q.set('accountId', params.accountId);
    if (params?.search)    q.set('search', params.search);
    if (params?.page)      q.set('page', String(params.page));
    if (params?.limit)     q.set('limit', String(params.limit));
    return apiFetch(`/tickets?${q}`);
  },

  ticket(id: string): Promise<ApiSingle<BusinessTicket>> {
    return apiFetch(`/tickets/${id}`);
  },

  createTicket(data: CreateTicketInput): Promise<ApiSingle<BusinessTicket>> {
    return apiFetch('/tickets', { method: 'POST', body: JSON.stringify(data) });
  },

  updateTicket(id: string, data: PatchTicketInput): Promise<ApiSingle<BusinessTicket>> {
    return apiFetch(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  threads(ticketId: string, includeInternal = true): Promise<ApiList<BusinessTicketThread>> {
    return apiFetch(`/tickets/${ticketId}/threads?includeInternal=${includeInternal}`);
  },

  addThread(ticketId: string, body: string, customerVisible = true): Promise<ApiSingle<BusinessTicketThread>> {
    return apiFetch(`/tickets/${ticketId}/threads`, {
      method: 'POST',
      body: JSON.stringify({ body, customerVisible }),
    });
  },

  addInternalNote(ticketId: string, body: string): Promise<ApiSingle<BusinessTicketThread>> {
    return apiFetch(`/tickets/${ticketId}/internal-notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  escalateToItsiMobile(ticketId: string): Promise<ApiSingle<{ message: string }>> {
    return apiFetch(`/tickets/${ticketId}/escalate-to-itsi-mobile`, { method: 'POST' });
  },
};
