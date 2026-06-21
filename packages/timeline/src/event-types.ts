export type TimelineEventType =
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_SUSPENDED'
  | 'CONTACT_ADDED'
  | 'SITE_ADDED'
  | 'SERVICE_ORDER_PLACED'
  | 'SERVICE_ACTIVATED'
  | 'SERVICE_SUSPENDED'
  | 'SERVICE_CANCELLED'
  | 'TICKET_OPENED'
  | 'TICKET_ESCALATED'
  | 'TICKET_RESOLVED'
  | 'INVOICE_ISSUED'
  | 'PAYMENT_RECEIVED'
  | 'WHOLESALE_ORDER_PLACED'
  | 'WHOLESALE_ORDER_UPDATED'
  | 'NOTE_ADDED';

export interface TimelineEvent {
  type: TimelineEventType;
  accountId: string;
  actorId?: string;
  actorType?: 'STAFF' | 'SYSTEM' | 'PORTAL_USER';
  meta?: Record<string, unknown>;
  occurredAt?: Date;
}
