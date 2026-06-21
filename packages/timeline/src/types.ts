/**
 * Itsi Business timeline event payload.
 *
 * Adapted from Itsi Mobile pattern — `tenantId` removed because
 * Itsi Business is a single-company deployment, not a multi-tenant reseller.
 */
export interface TimelineEventPayload {
  sourceModule: string;
  entityType: string;
  entityId: string;
  actorUserId?: string;
  eventType: string;
  visibilityScope: 'internal' | 'customer' | 'public';
  payload?: Record<string, unknown>;
}

export type TimelinePublisher = {
  publish: (event: TimelineEventPayload) => Promise<void>;
};
