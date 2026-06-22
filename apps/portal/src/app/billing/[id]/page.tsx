'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, DisabledAction } from '../../../components/PortalPage';
import { portalApi, fmtPence, fmtDate, type PortalInvoiceDetail } from '../../../lib/api';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<PortalInvoiceDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    portalApi.invoice(id).then(setInvoice).catch(() => setError('Invoice not found'));
  }, [id]);

  return (
    <PortalPage title={invoice?.invoiceNumber ?? 'Invoice'} subtitle={invoice?.status}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/billing" style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))' }}>← Back to billing</Link>

        {error && <p style={{ color: 'rgb(var(--danger))' }}>{error}</p>}
        {!invoice && !error && <p style={{ color: 'rgb(var(--muted))' }}>Loading…</p>}

        {invoice && (
          <>
            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{invoice.invoiceNumber}</h1>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 4 }}>
                    Issued {fmtDate(invoice.issueDate)} · Due {fmtDate(invoice.dueDate)}
                  </p>
                </div>
                <StatusPill tone={invoice.status === 'OVERDUE' ? 'danger' : invoice.status === 'PAID' ? 'success' : 'default'}>{invoice.status}</StatusPill>
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Total</dt><dd style={{ fontWeight: 700 }}>{fmtPence(invoice.totalPence)}</dd></div>
                <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Paid</dt><dd>{fmtPence(invoice.amountPaidPence)}</dd></div>
                <div><dt style={{ color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>Balance due</dt><dd style={{ fontWeight: 700, color: invoice.balanceDuePence > 0 ? 'rgb(var(--danger))' : undefined }}>{fmtPence(invoice.balanceDuePence)}</dd></div>
              </dl>
              <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
                <DisabledAction label="Pay invoice" reason="Online payment coming soon" />
                <DisabledAction label="Download PDF" reason="PDF generation not yet available" />
              </div>
            </Panel>

            <Panel>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Line items</h2>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'rgb(var(--muted))', fontSize: '0.65rem' }}>
                    <th>Description</th><th>Service</th><th>Qty</th><th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line) => (
                    <tr key={line.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                      <td style={{ padding: '0.5rem 0' }}>{line.description}</td>
                      <td>
                        {line.serviceLink ? (
                          <Link href={`/services/${line.serviceLink.serviceId}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'inherit' }}>
                            {line.serviceLink.displayName}
                          </Link>
                        ) : line.businessServiceReference ? (
                          <span style={{ fontSize: '0.7rem', color: 'rgb(var(--muted))', fontFamily: 'monospace' }}>{line.businessServiceReference}</span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'rgb(var(--muted))' }}>—</span>
                        )}
                      </td>
                      <td>{line.quantity}</td>
                      <td>{fmtPence(line.grossAmountPence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoice.lines.every((l) => !l.serviceLink && !l.businessServiceReference) && (
                <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: '0.75rem' }}>
                  Service linkage to invoice lines coming soon where billing references are not yet recorded.
                </p>
              )}
            </Panel>
          </>
        )}
      </div>
    </PortalPage>
  );
}
