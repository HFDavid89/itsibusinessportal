import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { classifyAccountHealth } from './account-health';
import { computeAgeingBuckets } from './billing-ageing';

const API_SRC = join(process.cwd(), 'src');

describe('classifyAccountHealth', () => {
  it('returns healthy for active account with no issues', () => {
    const r = classifyAccountHealth({
      accountStatus: 'ACTIVE',
      openTickets: 0,
      overdueInvoiceCount: 0,
      overdueBalancePence: 0,
      breachedWorkItems: 0,
      dueSoonWorkItems: 0,
      activeServices: 3,
      energyRenewalsDue: 0,
      openProductEnquiries: 0,
      contactCount: 2,
      siteCount: 1,
    });
    assert.equal(r.tier, 'healthy');
    assert.ok(r.score >= 75);
  });

  it('returns needs_attention for suspended account with overdue debt', () => {
    const r = classifyAccountHealth({
      accountStatus: 'SUSPENDED',
      openTickets: 3,
      overdueInvoiceCount: 2,
      overdueBalancePence: 50000,
      breachedWorkItems: 2,
      dueSoonWorkItems: 0,
      activeServices: 0,
      energyRenewalsDue: 1,
      openProductEnquiries: 1,
      contactCount: 0,
      siteCount: 0,
    });
    assert.equal(r.tier, 'needs_attention');
    assert.ok(r.score < 35);
  });

  it('returns at_risk for overdue debt without suspension', () => {
    const r = classifyAccountHealth({
      accountStatus: 'ACTIVE',
      openTickets: 2,
      overdueInvoiceCount: 1,
      overdueBalancePence: 50000,
      breachedWorkItems: 2,
      dueSoonWorkItems: 0,
      activeServices: 2,
      energyRenewalsDue: 0,
      openProductEnquiries: 0,
      contactCount: 1,
      siteCount: 1,
    });
    assert.equal(r.tier, 'at_risk');
    assert.ok(r.score >= 35 && r.score < 55);
  });
});

describe('computeAgeingBuckets', () => {
  const now = new Date('2026-06-22T12:00:00Z');

  it('places current invoices in current bucket', () => {
    const buckets = computeAgeingBuckets([
      {
        status: 'ISSUED',
        dueDate: new Date('2026-07-01'),
        totalPence: 10000,
        amountPaidPence: 0,
      },
    ], now);
    const current = buckets.find((b) => b.key === 'current')!;
    assert.equal(current.count, 1);
    assert.equal(current.balancePence, 10000);
  });

  it('places overdue invoices in correct ageing bucket', () => {
    const buckets = computeAgeingBuckets([
      {
        status: 'OVERDUE',
        dueDate: new Date('2026-05-01'),
        totalPence: 20000,
        amountPaidPence: 5000,
      },
    ], now);
    const bucket = buckets.find((b) => b.key === 'days_31_60')!;
    assert.equal(bucket.count, 1);
    assert.equal(bucket.balancePence, 15000);
  });

  it('ignores paid invoices', () => {
    const buckets = computeAgeingBuckets([
      {
        status: 'PAID',
        dueDate: new Date('2026-01-01'),
        totalPence: 10000,
        amountPaidPence: 10000,
      },
    ], now);
    assert.equal(buckets.every((b) => b.count === 0), true);
  });
});

describe('reporting portal boundary', () => {
  it('staff report routes require platform/staff realm and reports permissions', () => {
    const reportsRoute = readFileSync(join(API_SRC, 'routes/reports.ts'), 'utf8');
    assert.match(reportsRoute, /requireRealm\('platform', 'staff'\)/);
    assert.match(reportsRoute, /requirePermission\('reports\.read'\)/);
    assert.match(reportsRoute, /reports\.billing\.read/);
    assert.match(reportsRoute, /reports\.operations\.read/);
    assert.match(reportsRoute, /reports\.energy\.read/);
  });

  it('portal API routes do not expose management report endpoints', () => {
    const portalIndex = readFileSync(join(API_SRC, 'routes/portal/index.ts'), 'utf8');
    assert.doesNotMatch(portalIndex, /\/reports/);
    assert.doesNotMatch(portalIndex, /getOverviewReport|getBillingReport/);
  });
});
