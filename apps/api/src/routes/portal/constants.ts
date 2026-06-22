/** Customer-visible invoice statuses — DRAFT and VOID are staff-only. */
export const CUSTOMER_INVOICE_STATUSES = ['ISSUED', 'PART_PAID', 'PAID', 'OVERDUE'] as const;

export const OPEN_TICKET_STATUSES = ['OPEN', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'WAITING_ITSI_MOBILE'] as const;

export const CUSTOMER_TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  WAITING_CUSTOMER: 'Awaiting your response',
  WAITING_INTERNAL: 'Being reviewed',
  WAITING_ITSI_MOBILE: 'With our provisioning team',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function balanceDuePence(totalPence: number, amountPaidPence: number) {
  return Math.max(0, totalPence - amountPaidPence);
}
