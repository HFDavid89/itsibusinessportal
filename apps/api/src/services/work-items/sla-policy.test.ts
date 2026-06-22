import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDueAt, getSlaStatus, isSlaBreached } from '@itsi-business/core';

describe('SLA policy', () => {
  const created = new Date('2026-06-22T09:00:00Z');

  it('calculateDueAt applies priority targets', () => {
    const urgent = calculateDueAt('URGENT', created);
    assert.equal(urgent.getTime() - created.getTime(), 4 * 60 * 60 * 1000);

    const high = calculateDueAt('HIGH', created);
    assert.equal(high.getTime() - created.getTime(), 8 * 60 * 60 * 1000);

    const normal = calculateDueAt('NORMAL', created);
    assert.equal(normal.getTime() - created.getTime(), 3 * 8 * 60 * 60 * 1000);
  });

  it('getSlaStatus returns COMPLETED when done', () => {
    assert.equal(getSlaStatus({ completedAt: new Date(), dueAt: new Date('2020-01-01') }), 'COMPLETED');
  });

  it('getSlaStatus detects BREACHED and DUE_SOON', () => {
    const dueAt = new Date('2026-06-22T14:00:00Z');
    assert.equal(getSlaStatus({ dueAt, now: new Date('2026-06-22T15:00:00Z') }), 'BREACHED');
    assert.equal(getSlaStatus({ dueAt, now: new Date('2026-06-22T13:00:00Z') }), 'DUE_SOON');
    assert.equal(getSlaStatus({ dueAt, now: new Date('2026-06-22T09:00:00Z') }), 'ON_TRACK');
  });

  it('isSlaBreached respects completed items', () => {
    const dueAt = new Date('2026-06-22T10:00:00Z');
    const now = new Date('2026-06-22T12:00:00Z');
    assert.equal(isSlaBreached(dueAt, now), true);
    assert.equal(isSlaBreached(dueAt, now, now), false);
  });
});
