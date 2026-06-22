'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  servicesApi,
  fmt,
  type AnyService,
  type ItsiMobileWholesaleServiceLink,
} from '../lib/api';

const ORDERABLE = new Set(['DRAFT', 'REQUESTED']);

function DisabledBtn({ label, reason }: { label: string; reason: string }) {
  return (
    <button type="button" disabled title={reason}
      className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted cursor-not-allowed opacity-70">
      {label}
    </button>
  );
}

export function WholesaleFulfilmentPanel({
  serviceId,
  serviceType,
  serviceStatus,
  wholesaleLink: initialLink,
  onUpdated,
}: {
  serviceId: string;
  serviceType: 'MOBILE' | 'BROADBAND' | 'ENERGY';
  serviceStatus: string;
  wholesaleLink?: ItsiMobileWholesaleServiceLink | null;
  onUpdated: (svc: AnyService) => void;
}) {
  const [wholesaleEnabled, setWholesaleEnabled] = useState<boolean | null>(null);
  const [link, setLink] = useState(initialLink ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const apiType = serviceType === 'MOBILE' ? 'mobile' as const : 'broadband' as const;

  const refreshMeta = useCallback(async () => {
    if (serviceType === 'ENERGY') return;
    try {
      const res = await servicesApi.getWholesaleStatus(apiType, serviceId);
      setWholesaleEnabled(res.data.wholesaleEnabled);
      setLink(res.data.wholesaleLink);
    } catch {
      setWholesaleEnabled(false);
    }
  }, [apiType, serviceId, serviceType]);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta, initialLink]);

  if (serviceType === 'ENERGY') {
    return (
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Wholesale Fulfilment</p>
        <p className="text-sm text-muted">Energy wholesale ordering is not supported yet.</p>
      </div>
    );
  }

  const canRequest = ORDERABLE.has(serviceStatus) && !link && wholesaleEnabled === true;
  const wholesaleDisabled = wholesaleEnabled === false;

  async function handleRequest() {
    if (!confirm) return;
    setLoading(true);
    setError('');
    try {
      const res = await servicesApi.requestWholesaleOrder(apiType, serviceId, {
        confirm: true,
        notes: notes || undefined,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
      });
      onUpdated(res.data);
      const linkFromResponse = 'wholesaleLink' in res.data ? res.data.wholesaleLink : null;
      setLink(linkFromResponse ?? null);
      setShowModal(false);
      setConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setError('');
    try {
      const res = await servicesApi.refreshWholesaleStatus(apiType, serviceId);
      onUpdated(res.data);
      const linkFromResponse = 'wholesaleLink' in res.data ? res.data.wholesaleLink : null;
      setLink(linkFromResponse ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">Wholesale Fulfilment</p>
        {wholesaleDisabled && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 font-semibold">
            Wholesale API disabled
          </span>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {link ? (
        <div className="space-y-2 text-xs">
          <p><span className="text-muted">Link status:</span> <strong>{link.status}</strong></p>
          {link.itsiMobileWholesaleOrderId && (
            <p className="font-mono text-muted">Itsi Mobile order: {link.itsiMobileWholesaleOrderId}</p>
          )}
          {link.itsiMobileServiceOrderId && (
            <p className="font-mono text-muted">Service order: {link.itsiMobileServiceOrderId}</p>
          )}
          {link.safeProviderReference && (
            <p className="font-mono text-muted">Provider ref: {link.safeProviderReference}</p>
          )}
          {link.lastSyncedAt && <p className="text-muted">Last synced: {fmt(link.lastSyncedAt)}</p>}
          {link.lastStatusCheckedAt && <p className="text-muted">Status checked: {fmt(link.lastStatusCheckedAt)}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleRefresh} disabled={loading || wholesaleDisabled || !link.itsiMobileWholesaleOrderId}
              title={!link.itsiMobileWholesaleOrderId ? 'No order ID to refresh' : wholesaleDisabled ? 'Wholesale API disabled' : undefined}
              className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50">
              {loading ? 'Refreshing…' : 'Refresh Status'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted">No wholesale order linked to this service.</p>
          {canRequest ? (
            <button type="button" onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90">
              Request Wholesale Order
            </button>
          ) : wholesaleDisabled ? (
            <DisabledBtn label="Request Wholesale Order" reason="Wholesale API is disabled or misconfigured" />
          ) : !ORDERABLE.has(serviceStatus) ? (
            <DisabledBtn label="Request Wholesale Order" reason={`Service status must be DRAFT or REQUESTED (current: ${serviceStatus})`} />
          ) : (
            <DisabledBtn label="Request Wholesale Order" reason="Checking wholesale availability…" />
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-foreground">Request Wholesale Order</h3>
            <p className="text-xs text-muted leading-relaxed">
              This submits a fulfilment request to Itsi Mobile for this retail service record.
              Provider provisioning is handled by Itsi Mobile — not directly by Itsi Business.
            </p>
            <div className="space-y-2">
              <input placeholder="Contact name (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2" />
              <input placeholder="Contact phone (optional)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2" />
              <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-border bg-background text-sm px-3 py-2" />
            </div>
            <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5" />
              I confirm this wholesale order request should be submitted to Itsi Mobile for fulfilment.
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowModal(false); setConfirm(false); }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted">Cancel</button>
              <button type="button" onClick={handleRequest} disabled={!confirm || loading}
                className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-50">
                {loading ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
