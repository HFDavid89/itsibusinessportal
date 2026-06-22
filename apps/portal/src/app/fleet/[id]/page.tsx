'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LoadErrorPanel, LoadingList } from '@itsi-business/ui';
import { PortalPage, DisabledAction } from '../../../components/PortalPage';
import { PortalHero, PortalPanel } from '../../../components/portal-ui/portal-cockpit';
import { ServiceStatusBadge } from '../../../components/portal-ui/StatusBadges';
import { RequestSupportModal, NETWORK_CONTROL_ACTIONS } from '../../../components/PortalRequests';
import { portalApi, fmtPence, fmtDate, TICKET_STATUS_LABELS, type PortalFleetDetail } from '../../../lib/api';

const NETWORK_DEFER_REASON = 'Live network changes are not available in the portal yet — raise a support ticket to request this change.';

export default function FleetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<PortalFleetDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [simLabel, setSimLabel] = useState('');
  const [costCentre, setCostCentre] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    if (!id) return;
    portalApi.fleetDetail(id)
      .then((d) => {
        setDetail(d);
        setSimLabel(d.sim.simLabel ?? '');
        setCostCentre(d.sim.costCentre ?? '');
      })
      .catch(() => setError('SIM not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const sim = detail?.sim;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const updated = await portalApi.updateFleet(id, {
        simLabel: simLabel.trim() || undefined,
        costCentre: costCentre.trim() || undefined,
      });
      setDetail((prev) => prev ? { ...prev, sim: { ...prev.sim, ...updated } } : prev);
      setSaveMsg('SIM details saved.');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalPage title={sim?.displayName ?? 'SIM detail'} subtitle={sim?.mobileNumber ?? undefined}>
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/fleet" className="text-xs text-muted hover:text-foreground">← Back to fleet</Link>

        {error && <LoadErrorPanel message={error} />}
        {loading && <LoadingList rows={3} />}

        {sim && detail && (
          <>
            <PortalHero
              eyebrow="Mobile line"
              title={sim.displayName}
              subtitle={`${sim.serviceReference}${sim.mobileNumber ? ` · ${sim.mobileNumber}` : ''}`}
              badges={<ServiceStatusBadge status={sim.status} label={sim.statusLabel} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PortalPanel title="Service details">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[10px] uppercase text-muted font-bold">Mobile number</dt><dd className="mt-1">{sim.mobileNumber ?? '—'}</dd></div>
                  <div><dt className="text-[10px] uppercase text-muted font-bold">Monthly price</dt><dd className="mt-1 font-semibold">{fmtPence(sim.retailPricePence)}</dd></div>
                  <div><dt className="text-[10px] uppercase text-muted font-bold">SIM label</dt><dd className="mt-1">{sim.simLabel ?? '—'}</dd></div>
                  <div><dt className="text-[10px] uppercase text-muted font-bold">Cost centre</dt><dd className="mt-1">{sim.costCentre ?? '—'}</dd></div>
                  {sim.contact && (
                    <div className="col-span-2">
                      <dt className="text-[10px] uppercase text-muted font-bold">Assigned contact</dt>
                      <dd className="mt-1">{sim.contact.firstName} {sim.contact.lastName} · {sim.contact.email}</dd>
                    </div>
                  )}
                  {sim.site && (
                    <div className="col-span-2">
                      <dt className="text-[10px] uppercase text-muted font-bold">Site</dt>
                      <dd className="mt-1">{sim.site.name} · {sim.site.postcode}</dd>
                    </div>
                  )}
                  {sim.contractStartDate && (
                    <div><dt className="text-[10px] uppercase text-muted font-bold">Contract start</dt><dd className="mt-1">{fmtDate(sim.contractStartDate)}</dd></div>
                  )}
                  {sim.contractEndDate && (
                    <div><dt className="text-[10px] uppercase text-muted font-bold">Contract end</dt><dd className="mt-1">{fmtDate(sim.contractEndDate)}</dd></div>
                  )}
                </dl>
                <button
                  type="button"
                  onClick={() => setShowTicket(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90"
                >
                  Raise support request
                </button>
              </PortalPanel>

              <PortalPanel title="Edit SIM metadata">
                <form onSubmit={handleSave} className="space-y-3">
                  <label className="block text-xs text-muted">
                    SIM label
                    <input value={simLabel} onChange={(e) => setSimLabel(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
                  </label>
                  <label className="block text-xs text-muted">
                    Cost centre
                    <input value={costCentre} onChange={(e) => setCostCentre(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
                  </label>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  {saveMsg && <p className="text-xs text-muted">{saveMsg}</p>}
                </form>
              </PortalPanel>
            </div>

            {detail.relatedTickets.length > 0 && (
              <PortalPanel title="Related tickets" actionLabel="All tickets →" actionHref="/tickets">
                <div className="space-y-2">
                  {detail.relatedTickets.map((t) => (
                    <Link key={t.id} href={`/tickets/${t.id}`} className="block hover:opacity-90">
                      <p className="text-sm font-semibold text-foreground">{t.subject}</p>
                      <p className="text-[11px] text-muted">{t.ticketNumber} · {TICKET_STATUS_LABELS[t.status] ?? t.status}</p>
                    </Link>
                  ))}
                </div>
              </PortalPanel>
            )}

            {detail.relatedInvoices.length > 0 && (
              <PortalPanel title="Related invoices">
                <div className="space-y-2">
                  {detail.relatedInvoices.map((inv) => (
                    <Link key={inv.lineId} href={`/billing/${inv.invoiceId}`} className="flex justify-between text-sm hover:opacity-90">
                      <span className="font-semibold">{inv.invoiceNumber}</span>
                      <span>{fmtPence(inv.grossAmountPence)}</span>
                    </Link>
                  ))}
                </div>
              </PortalPanel>
            )}

            {detail.recentActivity.length > 0 && (
              <PortalPanel title="Recent activity">
                <div className="space-y-2">
                  {detail.recentActivity.map((a) => (
                    <div key={a.id} className="text-sm">
                      <p className="text-foreground capitalize">{a.label}</p>
                      <p className="text-[11px] text-muted">{fmtDate(a.occurredAt)}</p>
                    </div>
                  ))}
                </div>
              </PortalPanel>
            )}

            <PortalPanel title="Network controls">
              <p className="text-xs text-muted mb-3">These actions require live provisioning and are not available in the portal yet.</p>
              <div className="flex flex-wrap gap-2">
                {NETWORK_CONTROL_ACTIONS.map((a) => (
                  <DisabledAction key={a.label} label={a.label} reason={NETWORK_DEFER_REASON} />
                ))}
              </div>
            </PortalPanel>
          </>
        )}

        {showTicket && id && (
          <RequestSupportModal
            title="Raise SIM support request"
            submitLabel="Submit request"
            onClose={() => setShowTicket(false)}
            onSubmit={async (message) => {
              const result = await portalApi.createFleetSupport(id, { message });
              return { ticketNumber: result.ticket.ticketNumber };
            }}
          />
        )}
      </div>
    </PortalPage>
  );
}
