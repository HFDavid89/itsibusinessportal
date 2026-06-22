import type { Prisma } from '@prisma/client';
import { prisma } from '@itsi-business/database';
import type { ServiceLifecycleEventMeta } from '@itsi-business/core';

type TimelineClient = Pick<typeof prisma, 'timelineEvent'> | {
  timelineEvent: typeof prisma.timelineEvent;
};

export async function writeServiceLifecycleEvent(
  accountId: string,
  type: string,
  meta: ServiceLifecycleEventMeta,
  actorId?: string,
  client: TimelineClient = prisma,
): Promise<void> {
  try {
    await client.timelineEvent.create({
      data: {
        type,
        accountId,
        actorId: actorId ?? null,
        actorType: meta.source === 'STAFF' ? 'STAFF' : 'SYSTEM',
        meta: meta as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Non-fatal — lifecycle event write must not block primary operation
  }
}
