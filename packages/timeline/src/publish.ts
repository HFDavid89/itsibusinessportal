import type { TimelineEvent } from './event-types';

export async function publishTimelineEvent(
  event: TimelineEvent,
  prismaClient: {
    timelineEvent: {
      create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    };
  }
): Promise<void> {
  await prismaClient.timelineEvent.create({
    data: {
      type: event.type,
      accountId: event.accountId,
      actorId: event.actorId ?? null,
      actorType: event.actorType ?? 'SYSTEM',
      meta: event.meta ?? {},
      occurredAt: event.occurredAt ?? new Date(),
    },
  });
}
