/**
 * Typed Desk API client — uses shared staff-shell transport.
 */
import { apiFetch } from '@itsi-business/staff-shell';

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
  workItems?: Array<{
    id: string;
    type: string;
    status: string;
    priority: string;
    title: string;
    slaStatus?: string;
    dueAt?: string | null;
  }>;
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
    return apiFetch(`/api/v1/tickets?${q}`);
  },

  ticket(id: string): Promise<ApiSingle<BusinessTicket>> {
    return apiFetch(`/api/v1/tickets/${id}`);
  },

  createTicket(data: CreateTicketInput): Promise<ApiSingle<BusinessTicket>> {
    return apiFetch('/api/v1/tickets', { method: 'POST', body: data });
  },

  updateTicket(id: string, data: PatchTicketInput): Promise<ApiSingle<BusinessTicket>> {
    return apiFetch(`/api/v1/tickets/${id}`, { method: 'PATCH', body: data });
  },

  threads(ticketId: string, includeInternal = true): Promise<ApiList<BusinessTicketThread>> {
    return apiFetch(`/api/v1/tickets/${ticketId}/threads?includeInternal=${includeInternal}`);
  },

  addThread(ticketId: string, body: string, customerVisible = true): Promise<ApiSingle<BusinessTicketThread>> {
    return apiFetch(`/api/v1/tickets/${ticketId}/threads`, {
      method: 'POST',
      body: { body, customerVisible },
    });
  },

  addInternalNote(ticketId: string, body: string): Promise<ApiSingle<BusinessTicketThread>> {
    return apiFetch(`/api/v1/tickets/${ticketId}/internal-notes`, {
      method: 'POST',
      body: { body },
    });
  },

  escalateToItsiMobile(ticketId: string): Promise<ApiSingle<{ message: string }>> {
    return apiFetch(`/api/v1/tickets/${ticketId}/escalate-to-itsi-mobile`, { method: 'POST' });
  },
};
