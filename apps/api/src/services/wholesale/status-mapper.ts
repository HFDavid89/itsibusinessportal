/**
 * Maps Itsi Mobile wholesale order statuses to local link/service lifecycle.
 * Conservative mapping — does not over-automate retail service transitions.
 */
import {
  SAFE_ACTIVE_UPSTREAM,
  getStaffWarningForUpstream,
  getSuggestedActionForUpstream,
  isUpstreamFailureStatus,
} from '@itsi-business/core';

export { isUpstreamFailureStatus, getStaffWarningForUpstream, getSuggestedActionForUpstream };

export function mapWholesaleLinkStatus(upstreamStatus: string): string {
  const s = upstreamStatus.toUpperCase();
  if (['PENDING', 'REQUESTED', 'SUBMITTED', 'IN_PROGRESS', 'PROCESSING'].includes(s)) return 'PENDING';
  if (SAFE_ACTIVE_UPSTREAM.has(s)) return 'ACTIVE';
  if (['CEASED', 'TERMINATED', 'DISCONNECTED'].includes(s)) return 'CEASED';
  if (isUpstreamFailureStatus(s)) return 'PENDING';
  return 'PENDING';
}

/** Only promote retail service to ACTIVE when upstream explicitly indicates completion. */
export function shouldPromoteRetailToActive(upstreamStatus: string, currentRetailStatus: string): boolean {
  if (currentRetailStatus === 'ACTIVE') return false;
  return SAFE_ACTIVE_UPSTREAM.has(upstreamStatus.toUpperCase());
}

/** Never auto-cease or cancel retail from upstream in this phase. */
export function shouldAutoDemoteRetail(_upstreamStatus: string): boolean {
  return false;
}

export function extractUpstreamStatusFromResponse(lastStatusResponse: unknown): string | null {
  if (!lastStatusResponse || typeof lastStatusResponse !== 'object') return null;
  const status = (lastStatusResponse as Record<string, unknown>).status;
  return typeof status === 'string' ? status : null;
}

export function buildWholesaleStaffInsights(
  upstreamStatus: string | null,
  options: { hasWholesaleLink: boolean; retailStatus: string },
): { staffWarning: string | null; suggestedAction: string | null } {
  if (!upstreamStatus) {
    return { staffWarning: null, suggestedAction: null };
  }
  return {
    staffWarning: getStaffWarningForUpstream(upstreamStatus),
    suggestedAction: getSuggestedActionForUpstream(upstreamStatus, options),
  };
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
