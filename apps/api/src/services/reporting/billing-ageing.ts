export type AgeingBucketKey = 'current' | 'days_1_30' | 'days_31_60' | 'days_61_90' | 'days_90_plus';

export interface AgeingInvoiceInput {
  status: string;
  dueDate: Date | null;
  totalPence: number;
  amountPaidPence: number;
}

export interface AgeingBucket {
  key: AgeingBucketKey;
  label: string;
  count: number;
  balancePence: number;
}

const BUCKET_DEFS: Array<{ key: AgeingBucketKey; label: string; minDays: number; maxDays: number | null }> = [
  { key: 'current', label: 'Current', minDays: Number.NEGATIVE_INFINITY, maxDays: 0 },
  { key: 'days_1_30', label: '1–30 days', minDays: 1, maxDays: 30 },
  { key: 'days_31_60', label: '31–60 days', minDays: 31, maxDays: 60 },
  { key: 'days_61_90', label: '61–90 days', minDays: 61, maxDays: 90 },
  { key: 'days_90_plus', label: '90+ days', minDays: 91, maxDays: null },
];

function balanceDue(inv: AgeingInvoiceInput): number {
  if (!['ISSUED', 'PART_PAID', 'OVERDUE'].includes(inv.status)) return 0;
  return Math.max(0, inv.totalPence - inv.amountPaidPence);
}

function daysPastDue(dueDate: Date | null, now: Date): number {
  if (!dueDate) return 0;
  const ms = now.getTime() - dueDate.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function computeAgeingBuckets(invoices: AgeingInvoiceInput[], now = new Date()): AgeingBucket[] {
  const buckets = new Map<AgeingBucketKey, AgeingBucket>(
    BUCKET_DEFS.map((d) => [d.key, { key: d.key, label: d.label, count: 0, balancePence: 0 }]),
  );

  for (const inv of invoices) {
    const balance = balanceDue(inv);
    if (balance <= 0) continue;

    const pastDue = daysPastDue(inv.dueDate, now);
    let key: AgeingBucketKey = 'current';
    if (pastDue >= 91) key = 'days_90_plus';
    else if (pastDue >= 61) key = 'days_61_90';
    else if (pastDue >= 31) key = 'days_31_60';
    else if (pastDue >= 1) key = 'days_1_30';

    const bucket = buckets.get(key)!;
    bucket.count += 1;
    bucket.balancePence += balance;
  }

  return BUCKET_DEFS.map((d) => buckets.get(d.key)!);
}
