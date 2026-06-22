/**
 * Phase 14 — simplified SLA policy for staff work items.
 *
 * Business-hours model (documented simplification):
 * - One "business day" = 8 wall-clock hours (Mon–Fri 09:00–17:00 not modelled per-hour yet).
 * - URGENT uses 4-hour wall-clock target (treated as business hours for v1).
 */

export const WORK_ITEM_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type WorkItemPriority = (typeof WORK_ITEM_PRIORITIES)[number];

export type SlaStatus = 'ON_TRACK' | 'DUE_SOON' | 'BREACHED' | 'COMPLETED';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_BUSINESS_DAY = 8 * MS_PER_HOUR;

const PRIORITY_SLA_MS: Record<WorkItemPriority, number> = {
  URGENT: 4 * MS_PER_HOUR,
  HIGH: 1 * MS_PER_BUSINESS_DAY,
  NORMAL: 3 * MS_PER_BUSINESS_DAY,
  LOW: 5 * MS_PER_BUSINESS_DAY,
};

/** Default due date from priority and creation time. */
export function calculateDueAt(priority: WorkItemPriority, createdAt: Date): Date {
  return new Date(createdAt.getTime() + PRIORITY_SLA_MS[priority]);
}

/** True when past due and not completed. */
export function isSlaBreached(
  dueAt: Date | null | undefined,
  now: Date,
  completedAt?: Date | null,
): boolean {
  if (!dueAt || completedAt) return false;
  return now.getTime() > dueAt.getTime();
}

const DUE_SOON_WINDOW_MS = 4 * MS_PER_HOUR;

export function getSlaStatus(input: {
  dueAt?: Date | null;
  completedAt?: Date | null;
  now?: Date;
}): SlaStatus {
  if (input.completedAt) return 'COMPLETED';
  if (!input.dueAt) return 'ON_TRACK';

  const now = input.now ?? new Date();
  if (now.getTime() > input.dueAt.getTime()) return 'BREACHED';

  const remaining = input.dueAt.getTime() - now.getTime();
  if (remaining <= DUE_SOON_WINDOW_MS) return 'DUE_SOON';

  return 'ON_TRACK';
}
