/**
 * Types for the Itsi Business → Itsi Mobile wholesale API boundary.
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * These types represent the contract between the two systems.
 * Do NOT add provider-specific fields here.
 */

export type WholesaleOrderType = 'MOBILE' | 'BROADBAND';
export type WholesaleOrderStatus =
  | 'WHOLESALE_PENDING'
  | 'WHOLESALE_ACCEPTED'
  | 'WHOLESALE_IN_PROGRESS'
  | 'WHOLESALE_COMPLETE'
  | 'WHOLESALE_FAILED'
  | 'WHOLESALE_CANCELLED';

export interface WholesaleOrderRequest {
  type: WholesaleOrderType;
  sourceOrderId: string;
  sourceAccountId: string;
  postcode: string;
  uprn?: string;
  tariffId: string;
  simSerialNumber?: string;
  requestedPortDate?: string;
  notes?: string;
}

export interface WholesaleOrderResponse {
  id: string;
  reference: string;
  status: WholesaleOrderStatus;
  createdAt: string;
}

export interface WholesaleOrderStatusResponse {
  id: string;
  reference: string;
  status: WholesaleOrderStatus;
  statusDescription: string;
  updatedAt: string;
}

export interface WholesaleAddressResult {
  uprn: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  providers: string[];
}

export interface WholesaleEscalationRequest {
  businessTicketId: string;
  businessTicketReference: string;
  businessAccountId: string;
  serviceType: 'MOBILE' | 'BROADBAND' | 'GENERAL';
  serviceReference?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subject: string;
  notes: string;
}

export interface WholesaleEscalationResponse {
  id: string;
  itsiMobileTicketId: string;
  itsiMobileTicketReference: string;
  status: string;
  createdAt: string;
}
