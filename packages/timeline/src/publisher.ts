import type { TimelineEventPayload, TimelinePublisher } from './types';

/**
 * No-op publisher — used until the database package is wired in.
 * Mirrors the Itsi Mobile createNoopPublisher pattern.
 */
export function createNoopPublisher(): TimelinePublisher {
  return {
    publish: async (_event: TimelineEventPayload) => {
      // no-op until database is connected
    },
  };
}

/**
 * Database-backed publisher.
 * Pass a minimal prisma-compatible client that supports `timelineEvent.create`.
 */
export function createDbPublisher(prismaClient: {
  timelineEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
}): TimelinePublisher {
  return {
    publish: async (event: TimelineEventPayload) => {
      await prismaClient.timelineEvent.create({
        data: {
          sourceModule: event.sourceModule,
          entityType: event.entityType,
          entityId: event.entityId,
          actorUserId: event.actorUserId ?? null,
          eventType: event.eventType,
          visibilityScope: event.visibilityScope,
          payload: event.payload ?? {},
          occurredAt: new Date(),
        },
      });
    },
  };
}
