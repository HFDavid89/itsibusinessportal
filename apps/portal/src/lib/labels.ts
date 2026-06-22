export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  BILLING: 'Billing',
  MOBILE: 'Mobile',
  BROADBAND: 'Broadband',
  ENERGY: 'Energy',
  SOFTWARE: 'Software',
  ACCOUNT: 'Account',
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  ISSUED: 'Issued',
  PART_PAID: 'Part paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  MOBILE: 'Mobile',
  BROADBAND: 'Broadband',
  ENERGY: 'Energy',
  SOFTWARE: 'Software',
  SUPPORT: 'Support',
  OTHER: 'Other',
};

export function isProductEnquiry(subject: string) {
  return subject.startsWith('Product enquiry:');
}

export function ticketContextLabel(subject: string, category?: string) {
  if (isProductEnquiry(subject)) return 'Product enquiry';
  if (subject.startsWith('SIM support:')) return 'SIM support';
  if (category && category !== 'GENERAL') return TICKET_CATEGORY_LABELS[category] ?? category;
  return null;
}
