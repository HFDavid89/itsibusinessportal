/**
 * Types for the Itsi Business → Itsi Mobile wholesale API boundary.
 *
 * Mobile and Broadband use separate route families and strongly typed payloads.
 * Do NOT add provider-specific fields here.
 */

export type WholesaleServiceFamily = 'MOBILE' | 'BROADBAND';

export interface WholesaleOrderResult {
  orderId: string;
  serviceType: WholesaleServiceFamily;
  status: string;
  serviceOrderId?: string;
  safeProviderReference?: string;
  message?: string;
}

export interface WholesaleOrderStatusResult {
  orderId: string;
  serviceType: WholesaleServiceFamily;
  status: string;
  safeProviderReference?: string;
  lastUpdatedAt: string;
  events: Array<{ occurredAt: string; status: string; note?: string }>;
}

export interface MobileWholesaleQuoteRequest {
  productCode?: string;
  contractTermMonths?: number;
  simType?: string;
  simQuantity?: number;
  userCount?: number;
}

export interface BroadbandWholesaleQuoteRequest {
  postcode: string;
  uprn?: string;
  productCode?: string;
  contractTermMonths?: number;
  accessTechnology?: string;
}

export interface MobileWholesaleOrderRequest {
  businessAccountId: string;
  businessServiceReference: string;
  quoteId?: string;
  productCode?: string;
  contractTermMonths?: number;
  simType?: string;
  simQuantity?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface BroadbandWholesaleOrderRequest {
  businessAccountId: string;
  businessServiceReference: string;
  quoteId?: string;
  postcode: string;
  uprn?: string;
  productCode?: string;
  accessTechnology?: string;
  installContactName?: string;
  installContactPhone?: string;
  installContactEmail?: string;
  notes?: string;
}

export interface WholesaleEscalationRequest {
  serviceType: WholesaleServiceFamily;
  orderId?: string;
  businessServiceReference: string;
  subject: string;
  description: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface WholesaleEscalationResponse {
  escalationId: string;
  status: string;
  createdAt: string;
}

/** Reserved mobile fields — not implemented until Itsi Mobile supports them */
export type MobileWholesaleFutureFields =
  | 'pac' | 'stac' | 'portingDate' | 'spendCapPence'
  | 'roamingEnabled' | 'internationalBarred' | 'replacementSim';

/** Reserved broadband fields — not implemented until Itsi Mobile supports them */
export type BroadbandWholesaleFutureFields =
  | 'appointmentSlotId' | 'routerRequired' | 'staticIpRequired'
  | 'installNotes' | 'careLevel' | 'siteContactId';
