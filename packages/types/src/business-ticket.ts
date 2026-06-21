export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'AWAITING_SUPPLIER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketCategory = 'BROADBAND' | 'MOBILE' | 'ENERGY' | 'BILLING' | 'GENERAL';

export interface BusinessTicket {
  id: string;
  reference: string;
  accountId: string;
  siteId?: string;
  serviceId?: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  wholesaleEscalationId?: string;
  wholesaleEscalationReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTicketThread {
  id: string;
  ticketId: string;
  body: string;
  authorType: 'STAFF' | 'CUSTOMER';
  authorId: string;
  isInternal: boolean;
  createdAt: string;
}
