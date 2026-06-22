/**
 * Types for the Itsi Business → Itsi Mobile wholesale API boundary (Phase 14W).
 *
 * Mobile and Broadband use separate route families and strongly typed payloads.
 * Reseller attribution is derived from API key auth on Itsi Mobile — do not send
 * wholesaleAccountId, apiKeyId, sourceCompany, sourcePlatform, or retail owner fields.
 */

export type WholesaleServiceFamily = 'MOBILE' | 'BROADBAND';

export interface WholesaleContact {
  name?: string;
  phone?: string;
  email?: string;
}

export interface WholesalePorting {
  pac?: string;
  stac?: string;
  portingDate?: string;
}

export interface WholesaleAddress {
  line1?: string;
  line2?: string;
  city?: string;
  postcode: string;
  uprn?: string;
}

export interface WholesaleSourceAttribution {
  sourceOrderId: string;
  sourceCustomerReference: string;
  sourceServiceReference: string;
  businessServiceReference: string;
}

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
  tariffCode?: string;
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

export interface MobileWholesaleOrderRequest extends WholesaleSourceAttribution {
  quoteId?: string;
  productCode?: string;
  tariffCode?: string;
  contractTermMonths?: number;
  simType?: string;
  simQuantity?: number;
  contact?: WholesaleContact;
  porting?: WholesalePorting;
  notes?: string;
}

export interface BroadbandWholesaleOrderRequest extends WholesaleSourceAttribution {
  quoteId?: string;
  postcode: string;
  uprn?: string;
  address?: WholesaleAddress;
  productCode?: string;
  accessTechnology?: string;
  installContact?: WholesaleContact;
  appointmentWindow?: string;
  notes?: string;
}

export interface WholesaleEscalationRequest {
  serviceType: WholesaleServiceFamily;
  businessServiceReference: string;
  sourceOrderId?: string;
  orderId?: string;
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
  | 'spendCapPence'
  | 'roamingEnabled' | 'internationalBarred' | 'replacementSim';

/** Reserved broadband fields — not implemented until Itsi Mobile supports them */
export type BroadbandWholesaleFutureFields =
  | 'appointmentSlotId' | 'routerRequired' | 'staticIpRequired'
  | 'installNotes' | 'careLevel' | 'siteContactId';
