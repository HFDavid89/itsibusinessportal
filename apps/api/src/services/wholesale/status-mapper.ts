/**
 * Maps Itsi Mobile wholesale order statuses to local link/service lifecycle.
 * Conservative mapping — does not over-automate retail service transitions.
 */

export function mapWholesaleLinkStatus(upstreamStatus: string): string {
  const s = upstreamStatus.toUpperCase();
  if (['PENDING', 'REQUESTED', 'SUBMITTED', 'IN_PROGRESS', 'PROCESSING'].includes(s)) return 'PENDING';
  if (['ACTIVE', 'COMPLETED', 'LIVE', 'PROVISIONED'].includes(s)) return 'ACTIVE';
  if (['CEASED', 'TERMINATED', 'DISCONNECTED'].includes(s)) return 'CEASED';
  if (['CANCELLED', 'REJECTED', 'FAILED'].includes(s)) return 'PENDING';
  return 'PENDING';
}

/** Only promote retail service to ACTIVE when upstream explicitly indicates completion. */
export function shouldPromoteRetailToActive(upstreamStatus: string, currentRetailStatus: string): boolean {
  if (currentRetailStatus === 'ACTIVE') return false;
  const s = upstreamStatus.toUpperCase();
  return ['ACTIVE', 'COMPLETED', 'LIVE', 'PROVISIONED'].includes(s);
}

export function sanitizeStatusResponse(input: {
  orderId: string;
  status: string;
  safeProviderReference?: string;
  lastUpdatedAt?: string;
  events?: { occurredAt: string; status: string; note?: string }[];
}): Record<string, unknown> {
  return {
    orderId: input.orderId,
    status: input.status,
    ...(input.safeProviderReference ? { safeProviderReference: input.safeProviderReference } : {}),
    ...(input.lastUpdatedAt ? { lastUpdatedAt: input.lastUpdatedAt } : {}),
    events: (input.events ?? []).map((e) => ({
      occurredAt: e.occurredAt,
      status: e.status,
      ...(e.note ? { note: e.note } : {}),
    })),
  };
}
