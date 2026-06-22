'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toStaffEnergyStatusLabel } from '@itsi-business/core';
import { energyApi, fmt, type BusinessEnergyService } from '../lib/api';

const CRM_URL = process.env.NEXT_PUBLIC_CRM_URL ?? 'http://localhost:17006';

function DisabledBtn({ label, reason }: { label: string; reason: string }) {
  return (
    <button type="button" disabled title={reason}
      className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted cursor-not-allowed opacity-70">
      {label}
    </button>
  );
}

export function EnergyTrackingPanel({
  serviceId,
  record,
  onUpdated,
}: {
  serviceId: string;
  record: BusinessEnergyService;
  onUpdated: (r: BusinessEnergyService) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const manualProcessNote = 'Sales and contracts are completed manually in the Fidelity portal. Itsi Business tracks the relationship only.';

  async function run(fn: () => Promise<{ data: BusinessEnergyService }>) {
    setLoading(true);
    setError('');
    try {
      const res = await fn();
      onUpdated(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">Energy Account Tracking</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 font-semibold">
          Fidelity portal — manual process
        </span>
      </div>

      <p className="text-xs text-muted leading-relaxed">{manualProcessNote}</p>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        <p><span className="text-muted">Status:</span> <strong>{toStaffEnergyStatusLabel(record.status)}</strong></p>
        <p><span className="text-muted">Supplier:</span> {record.supplierName ?? '—'}</p>
        <p><span className="text-muted">Contract end:</span> {fmt(record.contractEndDate)}</p>
        <p><span className="text-muted">Renewal window:</span> {fmt(record.renewalWindowStartDate)}</p>
        <p><span className="text-muted">Next check-in:</span> {fmt(record.nextCheckInDate)}</p>
        <p><span className="text-muted">Last check-in:</span> {fmt(record.lastCheckInDate)}</p>
      </div>

      {record.notes && (
        <p className="text-xs text-muted border-t border-border pt-2"><strong>Notes:</strong> {record.notes}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {record.status === 'PROSPECT' && (
          <button type="button" disabled={loading} onClick={() => run(() => energyApi.markReferred(serviceId))}
            className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50">
            Mark Referred to Fidelity
          </button>
        )}
        {['REFERRED_TO_FIDELITY', 'QUOTE_IN_PROGRESS'].includes(record.status) && (
          <DisabledBtn label="Submit Energy Order" reason={manualProcessNote} />
        )}
        {!['LOST', 'CEASED'].includes(record.status) && (
          <button type="button" disabled={loading} onClick={() => run(() => energyApi.completeCheckIn(serviceId))}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-raised disabled:opacity-50">
            Complete Check-in
          </button>
        )}
        {!['LOST', 'CEASED'].includes(record.status) && (
          <button type="button" disabled={loading} onClick={() => run(() => energyApi.markLost(serviceId))}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground disabled:opacity-50">
            Mark Lost
          </button>
        )}
        <Link href={`${CRM_URL}/accounts/${record.accountId}`}
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground">
          Open Account
        </Link>
      </div>
    </div>
  );
}
