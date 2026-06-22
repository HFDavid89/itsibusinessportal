import type { Prisma } from '@prisma/client';
import { prisma } from '@itsi-business/database';
import {
  calculateDueAt,
  getSlaStatus,
  isSlaBreached,
  type WorkItemPriority,
} from '@itsi-business/core';

export const WORK_ITEM_TYPES = [
  'WHOLESALE_ORDER',
  'WHOLESALE_STATUS_REVIEW',
  'CUSTOMER_SERVICE_REQUEST',
  'SIM_METADATA_CHANGE',
  'PRODUCT_ENQUIRY',
  'ENERGY_REVIEW',
  'BILLING_QUERY',
  'SUPPORT_ESCALATION',
] as const;

export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

export const OPEN_WORK_ITEM_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
  'WAITING_ITSI_MOBILE',
] as const;

const WORK_ITEM_INCLUDE = {
  account: { select: { id: true, companyName: true, accountNumber: true } },
  ticket: { select: { id: true, ticketNumber: true, subject: true, status: true } },
  wholesaleLink: {
    select: {
      id: true,
      status: true,
      businessServiceType: true,
      businessServiceReference: true,
      itsiMobileWholesaleOrderId: true,
    },
  },
  comments: { orderBy: { createdAt: 'asc' as const }, take: 20 },
} satisfies Prisma.BusinessWorkItemInclude;

type Tx = Prisma.TransactionClient;

export interface CreateWorkItemInput {
  type: WorkItemType;
  status?: string;
  priority?: WorkItemPriority;
  accountId: string;
  serviceType?: string;
  serviceId?: string;
  ticketId?: string;
  wholesaleLinkId?: string;
  assignedToStaffUserId?: string;
  source?: string;
  title: string;
  description?: string;
  internalNotes?: string;
  dueAt?: Date;
}

function withSlaFields<T extends { dueAt: Date | null; completedAt: Date | null; slaBreachedAt: Date | null }>(
  item: T,
  now = new Date(),
) {
  const slaStatus = getSlaStatus({ dueAt: item.dueAt, completedAt: item.completedAt, now });
  const breached = isSlaBreached(item.dueAt, now, item.completedAt);
  return { ...item, slaStatus, slaBreached: breached };
}

export function enrichWorkItem(item: Awaited<ReturnType<typeof getWorkItemById>>) {
  if (!item) return null;
  return withSlaFields(item);
}

export async function getWorkItemById(id: string) {
  return prisma.businessWorkItem.findUnique({
    where: { id },
    include: WORK_ITEM_INCLUDE,
  });
}

export async function listWorkItems(params: {
  status?: string;
  priority?: string;
  type?: string;
  serviceType?: string;
  accountId?: string;
  serviceId?: string;
  ticketId?: string;
  assignedToStaffUserId?: string;
  assignedToMe?: string;
  unassigned?: boolean;
  breached?: boolean;
  dueSoon?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 50, 100);
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Prisma.BusinessWorkItemWhereInput = {
    ...(params.status && { status: params.status }),
    ...(params.priority && { priority: params.priority }),
    ...(params.type && { type: params.type }),
    ...(params.serviceType && { serviceType: params.serviceType }),
    ...(params.accountId && { accountId: params.accountId }),
    ...(params.serviceId && { serviceId: params.serviceId }),
    ...(params.ticketId && { ticketId: params.ticketId }),
    ...(params.assignedToStaffUserId && { assignedToStaffUserId: params.assignedToStaffUserId }),
    ...(params.assignedToMe && { assignedToStaffUserId: params.assignedToMe }),
    ...(params.unassigned && { assignedToStaffUserId: null }),
    ...(params.breached && {
      completedAt: null,
      dueAt: { lt: now },
    }),
    ...(params.dueSoon && {
      completedAt: null,
      dueAt: { gte: now, lte: new Date(now.getTime() + 4 * 60 * 60 * 1000) },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.businessWorkItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      include: WORK_ITEM_INCLUDE,
    }),
    prisma.businessWorkItem.count({ where }),
  ]);

  return {
    items: items.map((i) => withSlaFields(i, now)),
    meta: { total, page, limit },
  };
}

export async function getWorkQueueStats(staffUserId?: string) {
  const now = new Date();
  const dueSoonCutoff = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const openWhere = { status: { in: [...OPEN_WORK_ITEM_STATUSES] } };

  const [
    open,
    assignedToMe,
    unassigned,
    dueSoon,
    breached,
    waitingItsiMobile,
    productEnquiries,
    energyReviews,
  ] = await Promise.all([
    prisma.businessWorkItem.count({ where: openWhere }),
    staffUserId
      ? prisma.businessWorkItem.count({ where: { ...openWhere, assignedToStaffUserId: staffUserId } })
      : Promise.resolve(0),
    prisma.businessWorkItem.count({ where: { ...openWhere, assignedToStaffUserId: null } }),
    prisma.businessWorkItem.count({
      where: { ...openWhere, completedAt: null, dueAt: { gte: now, lte: dueSoonCutoff } },
    }),
    prisma.businessWorkItem.count({
      where: { ...openWhere, completedAt: null, dueAt: { lt: now } },
    }),
    prisma.businessWorkItem.count({ where: { ...openWhere, status: 'WAITING_ITSI_MOBILE' } }),
    prisma.businessWorkItem.count({ where: { ...openWhere, type: 'PRODUCT_ENQUIRY' } }),
    prisma.businessWorkItem.count({ where: { ...openWhere, type: 'ENERGY_REVIEW' } }),
  ]);

  return { open, assignedToMe, unassigned, dueSoon, breached, waitingItsiMobile, productEnquiries, energyReviews };
}

async function findOpenDuplicate(
  tx: Tx,
  criteria: {
    type: WorkItemType;
    accountId: string;
    serviceId?: string | null;
    ticketId?: string | null;
    wholesaleLinkId?: string | null;
  },
) {
  return tx.businessWorkItem.findFirst({
    where: {
      type: criteria.type,
      accountId: criteria.accountId,
      status: { in: [...OPEN_WORK_ITEM_STATUSES] },
      ...(criteria.serviceId ? { serviceId: criteria.serviceId } : {}),
      ...(criteria.ticketId ? { ticketId: criteria.ticketId } : {}),
      ...(criteria.wholesaleLinkId ? { wholesaleLinkId: criteria.wholesaleLinkId } : {}),
    },
    include: WORK_ITEM_INCLUDE,
  });
}

export async function createWorkItem(input: CreateWorkItemInput, tx?: Tx) {
  const client = tx ?? prisma;
  const createdAt = new Date();
  const priority = input.priority ?? 'NORMAL';
  const dueAt = input.dueAt ?? calculateDueAt(priority, createdAt);

  const item = await client.businessWorkItem.create({
    data: {
      type: input.type,
      status: input.status ?? 'OPEN',
      priority,
      accountId: input.accountId,
      serviceType: input.serviceType,
      serviceId: input.serviceId,
      ticketId: input.ticketId,
      wholesaleLinkId: input.wholesaleLinkId,
      assignedToStaffUserId: input.assignedToStaffUserId,
      source: input.source ?? 'STAFF',
      title: input.title,
      description: input.description,
      internalNotes: input.internalNotes,
      dueAt,
    },
    include: WORK_ITEM_INCLUDE,
  });

  await writeWorkItemTimeline(input.accountId, 'WORK_ITEM_CREATED', {
    workItemId: item.id,
    type: item.type,
    title: item.title,
  }, tx);

  return withSlaFields(item);
}

export async function findOrCreateWorkItem(input: CreateWorkItemInput, tx?: Tx) {
  const run = async (client: Tx) => {
    const existing = await findOpenDuplicate(client, {
      type: input.type,
      accountId: input.accountId,
      serviceId: input.serviceId,
      ticketId: input.ticketId,
      wholesaleLinkId: input.wholesaleLinkId,
    });
    if (existing) return { item: withSlaFields(existing), created: false };
    const item = await createWorkItem(input, client);
    return { item, created: true };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}

async function writeWorkItemTimeline(
  accountId: string,
  type: string,
  meta: Record<string, unknown>,
  tx?: Tx,
  actorId?: string,
) {
  const client = tx ?? prisma;
  await client.timelineEvent.create({
    data: {
      type,
      accountId,
      actorId,
      actorType: actorId ? 'STAFF' : 'SYSTEM',
      meta: meta as Prisma.InputJsonValue,
    },
  });
}

export async function assignWorkItem(id: string, staffUserId: string, actorId?: string) {
  const item = await prisma.businessWorkItem.update({
    where: { id },
    data: { assignedToStaffUserId: staffUserId, status: 'IN_PROGRESS' },
    include: WORK_ITEM_INCLUDE,
  });
  await writeWorkItemTimeline(item.accountId, 'WORK_ITEM_ASSIGNED', { workItemId: id, assignedToStaffUserId: staffUserId }, undefined, actorId);
  return withSlaFields(item);
}

export async function startWorkItem(id: string, actorId?: string) {
  const item = await prisma.businessWorkItem.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
    include: WORK_ITEM_INCLUDE,
  });
  await writeWorkItemTimeline(item.accountId, 'WORK_ITEM_STARTED', { workItemId: id }, undefined, actorId);
  return withSlaFields(item);
}

export async function resolveWorkItem(id: string, actorId?: string, internalNotes?: string) {
  const now = new Date();
  const item = await prisma.businessWorkItem.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      completedAt: now,
      ...(internalNotes !== undefined ? { internalNotes } : {}),
    },
    include: WORK_ITEM_INCLUDE,
  });
  await writeWorkItemTimeline(item.accountId, 'WORK_ITEM_RESOLVED', { workItemId: id }, undefined, actorId);
  return withSlaFields(item);
}

export async function cancelWorkItem(id: string, actorId?: string, reason?: string) {
  const now = new Date();
  const item = await prisma.businessWorkItem.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      completedAt: now,
      ...(reason ? { internalNotes: reason } : {}),
    },
    include: WORK_ITEM_INCLUDE,
  });
  await writeWorkItemTimeline(item.accountId, 'WORK_ITEM_CANCELLED', { workItemId: id, reason }, undefined, actorId);
  return withSlaFields(item);
}

export async function addWorkItemComment(id: string, body: string, authorId: string) {
  const item = await prisma.businessWorkItem.findUnique({ where: { id }, select: { id: true, accountId: true } });
  if (!item) return null;

  const comment = await prisma.businessWorkItemComment.create({
    data: { workItemId: id, body, authorId, authorType: 'STAFF' },
  });

  await writeWorkItemTimeline(item.accountId, 'WORK_ITEM_COMMENT_ADDED', { workItemId: id, commentId: comment.id }, undefined, authorId);
  return comment;
}

export async function patchWorkItem(
  id: string,
  data: Partial<{
    status: string;
    priority: WorkItemPriority;
    title: string;
    description: string;
    internalNotes: string;
    assignedToStaffUserId: string | null;
    dueAt: Date | null;
  }>,
  actorId?: string,
) {
  const now = new Date();
  const update: Prisma.BusinessWorkItemUpdateInput = { ...data };

  if (data.priority && !data.dueAt) {
    const existing = await prisma.businessWorkItem.findUnique({ where: { id }, select: { createdAt: true } });
    if (existing) update.dueAt = calculateDueAt(data.priority, existing.createdAt);
  }

  if (data.status === 'RESOLVED' || data.status === 'CANCELLED') {
    update.completedAt = now;
  }

  const item = await prisma.businessWorkItem.update({
    where: { id },
    data: update,
    include: WORK_ITEM_INCLUDE,
  });

  if (isSlaBreached(item.dueAt, now, item.completedAt) && !item.slaBreachedAt) {
    await prisma.businessWorkItem.update({
      where: { id },
      data: { slaBreachedAt: now },
    });
    item.slaBreachedAt = now;
  }

  await writeWorkItemTimeline(item.accountId, 'WORK_ITEM_UPDATED', { workItemId: id, changes: Object.keys(data) }, undefined, actorId);
  return withSlaFields(item);
}

// ── Automatic work item creators ─────────────────────────────────────────────

export async function ensureWholesaleOrderWorkItem(params: {
  accountId: string;
  serviceType: 'MOBILE' | 'BROADBAND';
  serviceId: string;
  serviceReference: string;
  wholesaleLinkId: string;
  displayName: string;
}, tx?: Tx) {
  return findOrCreateWorkItem({
    type: 'WHOLESALE_ORDER',
    status: 'WAITING_ITSI_MOBILE',
    priority: 'NORMAL',
    accountId: params.accountId,
    serviceType: params.serviceType,
    serviceId: params.serviceId,
    wholesaleLinkId: params.wholesaleLinkId,
    source: 'WHOLESALE_BRIDGE',
    title: `Wholesale order: ${params.displayName}`,
    description: `Track fulfilment for ${params.serviceReference} via Itsi Mobile wholesale bridge.`,
  }, tx);
}

export async function ensureWholesaleStatusReviewWorkItem(params: {
  accountId: string;
  serviceType: 'MOBILE' | 'BROADBAND';
  serviceId: string;
  serviceReference: string;
  wholesaleLinkId: string;
  displayName: string;
  staffWarning?: string | null;
  upstreamFailure?: boolean;
}, tx?: Tx) {
  const priority: WorkItemPriority = params.upstreamFailure ? 'HIGH' : 'HIGH';
  return findOrCreateWorkItem({
    type: 'WHOLESALE_STATUS_REVIEW',
    status: 'OPEN',
    priority,
    accountId: params.accountId,
    serviceType: params.serviceType,
    serviceId: params.serviceId,
    wholesaleLinkId: params.wholesaleLinkId,
    source: 'WHOLESALE_BRIDGE',
    title: `Review wholesale status: ${params.displayName}`,
    description: params.staffWarning ?? `Upstream status needs staff review for ${params.serviceReference}.`,
  }, tx);
}

export async function ensureProductEnquiryWorkItem(params: {
  accountId: string;
  ticketId: string;
  productName: string;
}, tx?: Tx) {
  return findOrCreateWorkItem({
    type: 'PRODUCT_ENQUIRY',
    status: 'OPEN',
    priority: 'NORMAL',
    accountId: params.accountId,
    ticketId: params.ticketId,
    source: 'PORTAL',
    title: `Product enquiry: ${params.productName}`,
    description: 'Customer submitted a product enquiry via the business portal.',
  }, tx);
}

export async function ensureCustomerServiceRequestWorkItem(params: {
  accountId: string;
  ticketId: string;
  serviceType?: string;
  serviceId?: string;
  displayName: string;
  isEnergyReview?: boolean;
}, tx?: Tx) {
  const type = params.isEnergyReview ? 'ENERGY_REVIEW' as const : 'CUSTOMER_SERVICE_REQUEST' as const;
  return findOrCreateWorkItem({
    type,
    status: 'OPEN',
    priority: 'NORMAL',
    accountId: params.accountId,
    ticketId: params.ticketId,
    serviceType: params.serviceType,
    serviceId: params.serviceId,
    source: 'PORTAL',
    title: params.isEnergyReview
      ? `Energy review: ${params.displayName}`
      : `Customer request: ${params.displayName}`,
    description: 'Customer submitted a support request via the business portal.',
  }, tx);
}

export async function ensureSimMetadataChangeWorkItem(params: {
  accountId: string;
  serviceId: string;
  displayName: string;
  changes: string;
}, tx?: Tx) {
  return findOrCreateWorkItem({
    type: 'SIM_METADATA_CHANGE',
    status: 'OPEN',
    priority: 'LOW',
    accountId: params.accountId,
    serviceType: 'MOBILE',
    serviceId: params.serviceId,
    source: 'PORTAL',
    title: `SIM metadata update: ${params.displayName}`,
    description: params.changes,
  }, tx);
}

export async function ensureEnergyReviewWorkItem(params: {
  accountId: string;
  serviceId: string;
  displayName: string;
  reason: string;
}, tx?: Tx) {
  return findOrCreateWorkItem({
    type: 'ENERGY_REVIEW',
    status: 'OPEN',
    priority: 'NORMAL',
    accountId: params.accountId,
    serviceType: 'ENERGY',
    serviceId: params.serviceId,
    source: 'SYSTEM',
    title: `Energy review due: ${params.displayName}`,
    description: params.reason,
  }, tx);
}

export async function listWorkItemsForTicket(ticketId: string) {
  const items = await prisma.businessWorkItem.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    include: WORK_ITEM_INCLUDE,
  });
  return items.map((i) => withSlaFields(i));
}
