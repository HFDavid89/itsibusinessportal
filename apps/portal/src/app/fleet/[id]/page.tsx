'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, DisabledAction } from '../../../components/PortalPage';
import { RequestSupportModal, NETWORK_CONTROL_ACTIONS } from '../../../components/PortalRequests';
import { portalApi, fmtPence, fmtDate, type PortalFleetDetail } from '../../../lib/api';

export default function FleetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<PortalFleetDetail | null>(null);
  const [error, setError] = useState('');
  const [simLabel, setSimLabel] = useState('');
  const [costCentre, setCostCentre] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    if (!id) return;
    portalApi.fleetDetail(id).then((d) => {
      setDetail(d);
      setSimLabel(d.sim.simLabel ?? '');
      setCostCentre(d.sim.costCentre ?? '');
    }).catch(() => setError('SIM not found'));
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
      setDetail((prev) => prev ? { ...prev, sim: updated } : prev);
      setSaveMsg('SIM details updated');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalPage title={sim?.displayName ?? 'SIM detail'} subtitle={sim?.mobileNumber ?? undefined}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/fleet" style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))' }}>← Back to fleet</Link>

        {error && <p style={{ color: 'rgb(var(--danger))' }}>{error}</p>}
        {!detail && !error && <p style={{ color: 'rgb(var(--muted))' }}>Loading…</p>}

        {sim && (
          <>
            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{sim.displayName}</h1>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 4, fontFamily: 'monospace' }}>{sim.serviceReference}</p>
                </div>
                <StatusPill tone={sim.status === 'ACTIVE' ? 'success' : 'default'}>{sim.statusLabel ?? sim.status}</StatusPill>
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Mobile number</dt><dd>{sim.mobileNumber ?? '—'}</dd></div>
                <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Price</dt><dd>{fmtPence(sim.retailPricePence)}/mo</dd></div>
                {sim.contractStartDate && (
                  <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Contract start</dt><dd>{fmtDate(sim.contractStartDate)}</dd></div>
                )}
                {sim.contractEndDate && (
                  <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Contract end</dt><dd>{fmtDate(sim.contractEndDate)}</dd></div>
                )}
              </dl>
              <div style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTicket(true)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Raise ticket about this SIM
                </button>
              </div>
            </Panel>

            <Panel>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>SIM label & cost centre</h2>
              <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ fontSize: '0.75rem' }}>
                  SIM label
                  <input value={simLabel} onChange={(e) => setSimLabel(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
                </label>
                <label style={{ fontSize: '0.75rem' }}>
                  Cost centre
                  <input value={costCentre} onChange={(e) => setCostCentre(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
                </label>
                <button type="submit" disabled={saving} style={{ gridColumn: '1 / -1', justifySelf: 'start', padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
              {saveMsg && <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 8 }}>{saveMsg}</p>}
            </Panel>

            {detail.relatedInvoices.length > 0 && (
              <Panel>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Related invoices</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem' }}>
                  {detail.relatedInvoices.map((inv) => (
                    <li key={inv.lineId} style={{ borderTop: '1px solid rgb(var(--border))', padding: '0.5rem 0' }}>
                      <Link href={`/billing/${inv.invoiceId}`} style={{ fontWeight: 600, color: 'inherit' }}>{inv.invoiceNumber}</Link>
                      <span style={{ color: 'rgb(var(--muted))', marginLeft: 8 }}>{fmtPence(inv.grossAmountPence)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Network controls</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {NETWORK_CONTROL_ACTIONS.map((a) => (
                  <DisabledAction key={a.label} label={a.label} reason={a.reason} />
                ))}
              </div>
            </Panel>
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
