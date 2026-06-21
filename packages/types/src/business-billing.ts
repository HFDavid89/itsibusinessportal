export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CARD' | 'DIRECT_DEBIT' | 'BACS' | 'MANUAL';

export interface BusinessInvoice {
  id: string;
  invoiceNumber: string;
  accountId: string;
  status: InvoiceStatus;
  issuedAt?: string;
  dueAt?: string;
  totalAmountPence: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitAmountPence: number;
  totalAmountPence: number;
  serviceType?: 'MOBILE' | 'BROADBAND' | 'ENERGY' | 'SOFTWARE' | 'OTHER';
}

export interface BusinessPayment {
  id: string;
  invoiceId: string;
  accountId: string;
  amountPence: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt?: string;
  createdAt: string;
}
