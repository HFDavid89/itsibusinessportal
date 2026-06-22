'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, DisabledAction } from '../../../components/PortalPage';
import { RequestSupportModal, NETWORK_CONTROL_ACTIONS } from '../../../components/PortalRequests';
import { portalApi, fmtPence, fmtDate, type PortalServiceDetail } from '../../../lib/api';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<PortalServiceDetail | null>(null);
  const [error, setError] = useState('');
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    if (!id) return;
    portalApi.service(id).then(setDetail).catch(() => setError('Service not found'));
  }, [id]);

  const service = detail?.service;

  return (
    <PortalPage title={service?.displayName ?? 'Service'} subtitle={service?.serviceReference}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/services" style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))' }}>← Back to services</Link>

        {error && <p style={{ color: 'rgb(var(--danger))' }}>{error}</p>}
        {!detail && !error && <p style={{ color: 'rgb(var(--muted))' }}>Loading…</p>}

        {service && (
          <>
            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{service.displayName}</h1>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 4, fontFamily: 'monospace' }}>{service.serviceReference}</p>
                </div>
                <StatusPill tone={service.status === 'ACTIVE' ? 'success' : 'default'}>{service.statusLabel ?? service.status}</StatusPill>
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Type</dt><dd>{service.type}</dd></div>
                {service.retailPricePence != null && (
                  <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Price</dt><dd>{fmtPence(service.retailPricePence)}/mo</dd></div>
                )}
                {'site' in service && service.site && (
                  <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Site</dt><dd>{service.site.name}</dd></div>
                )}
                {'costCentre' in service && service.costCentre && (
                  <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Cost centre</dt><dd>{service.costCentre}</dd></div>
                )}
                {service.contractStartDate && (
                  <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Contract start</dt><dd>{fmtDate(service.contractStartDate)}</dd></div>
                )}
                {service.contractEndDate && (
                  <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Contract end</dt><dd>{fmtDate(service.contractEndDate)}</dd></div>
                )}
                {service.type === 'ENERGY' && (
                  <>
                    {'fuelType' in service && service.fuelType && (
                      <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Fuel type</dt><dd>{service.fuelType}</dd></div>
                    )}
                    {'supplierName' in service && service.supplierName && (
                      <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Supplier</dt><dd>{service.supplierName}</dd></div>
                    )}
                    {'renewalWindowStartDate' in service && service.renewalWindowStartDate && (
                      <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Renewal window</dt><dd>From {fmtDate(service.renewalWindowStartDate)}</dd></div>
                    )}
                    {'nextCheckInDate' in service && service.nextCheckInDate && (
                      <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Next review</dt><dd>{fmtDate(service.nextCheckInDate)}</dd></div>
                    )}
                  </>
                )}
              </dl>
              {service.type === 'ENERGY' && 'energyBillingNote' in service && (
                <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: '1rem', lineHeight: 1.5 }}>
                  {service.energyBillingNote}
                </p>
              )}
              <div style={{ marginTop: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowTicket(true)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  {service.type === 'ENERGY' ? 'Request energy review' : 'Raise ticket about this service'}
                </button>
                {service.type === 'MOBILE' && (
                  <Link href={`/fleet/${service.id}`} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid rgb(var(--border))', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                    View SIM detail
                  </Link>
                )}
              </div>
            </Panel>

            {detail.relatedInvoices.length > 0 ? (
              <Panel>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Related invoices</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem' }}>
                  {detail.relatedInvoices.map((inv) => (
                    <li key={inv.lineId} style={{ borderTop: '1px solid rgb(var(--border))', padding: '0.5rem 0' }}>
                      <Link href={`/billing/${inv.invoiceId}`} style={{ fontWeight: 600, color: 'inherit' }}>{inv.invoiceNumber}</Link>
                      <span style={{ color: 'rgb(var(--muted))', marginLeft: 8 }}>{inv.description} · {fmtPence(inv.grossAmountPence)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : (
              <Panel>
                <p style={{ fontSize: '0.8rem', color: 'rgb(var(--muted))' }}>Service linkage to invoice lines coming soon where billing references are not yet recorded.</p>
              </Panel>
            )}

            {detail.relatedTickets.length > 0 && (
              <Panel>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Open support requests</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem' }}>
                  {detail.relatedTickets.map((t) => (
                    <li key={t.id} style={{ borderTop: '1px solid rgb(var(--border))', padding: '0.5rem 0' }}>
                      <Link href={`/tickets/${t.id}`} style={{ fontWeight: 600, color: 'inherit' }}>{t.ticketNumber}</Link>
                      <span style={{ color: 'rgb(var(--muted))', marginLeft: 8 }}>{t.subject}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {service.type === 'MOBILE' && (
              <Panel>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Network controls</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {NETWORK_CONTROL_ACTIONS.map((a) => (
                    <DisabledAction key={a.label} label={a.label} reason={a.reason} />
                  ))}
                </div>
              </Panel>
            )}
          </>
        )}

        {showTicket && id && (
          <RequestSupportModal
            title={service?.type === 'ENERGY' ? 'Request energy review' : 'Raise support request'}
            submitLabel="Submit request"
            onClose={() => setShowTicket(false)}
            onSubmit={async (message) => {
              const result = await portalApi.createServiceTicket(id, { message });
              return { ticketNumber: result.ticket.ticketNumber };
            }}
          />
        )}
      </div>
    </PortalPage>
  );
}
