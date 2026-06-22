'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LoadErrorPanel, LoadingList } from '@itsi-business/ui';
import { PortalPage } from '../../../components/PortalPage';
import { PortalHero, PortalPanel } from '../../../components/portal-ui/portal-cockpit';
import { InvoiceStatusBadge } from '../../../components/portal-ui/StatusBadges';
import { portalApi, fmtPence, fmtDate, type PortalInvoiceDetail } from '../../../lib/api';
import { INVOICE_STATUS_LABELS } from '../../../lib/labels';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<PortalInvoiceDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    portalApi.invoice(id)
      .then(setInvoice)
      .catch(() => setError('Invoice not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const hasBalance = (invoice?.balanceDuePence ?? 0) > 0;

  return (
    <PortalPage title={invoice?.invoiceNumber ?? 'Invoice'} subtitle={invoice ? INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status : undefined}>
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/billing" className="text-xs text-muted hover:text-foreground">← Back to billing</Link>

        {error && <LoadErrorPanel message={error} />}
        {loading && <LoadingList rows={3} />}

        {invoice && (
          <>
            <PortalHero
              eyebrow="Invoice"
              title={invoice.invoiceNumber}
              subtitle={`Issued ${fmtDate(invoice.issueDate)} · Due ${fmtDate(invoice.dueDate)}`}
              badges={<InvoiceStatusBadge status={invoice.status} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <p className="text-[10px] uppercase text-muted font-bold">Total</p>
                <p className="text-xl font-bold mt-1">{fmtPence(invoice.totalPence)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <p className="text-[10px] uppercase text-muted font-bold">Paid</p>
                <p className="text-xl font-bold mt-1">{fmtPence(invoice.amountPaidPence)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${invoice.status === 'OVERDUE' ? 'border-danger/30 bg-danger/5' : 'border-border bg-surface-raised'}`}>
                <p className="text-[10px] uppercase text-muted font-bold">Balance due</p>
                <p className={`text-xl font-bold mt-1 ${hasBalance ? 'text-danger' : ''}`}>{fmtPence(invoice.balanceDuePence)}</p>
              </div>
            </div>

            {hasBalance && (
              <PortalPanel title="Payment instructions">
                <p className="text-sm text-foreground leading-relaxed">
                  Online card payment is not yet available in the business portal. Please pay using your agreed business payment method
                  and quote invoice <strong className="font-mono">{invoice.invoiceNumber}</strong> as your payment reference.
                </p>
                <p className="text-xs text-muted mt-2">
                  If you need payment details or have questions, raise a billing support ticket from the Support area.
                </p>
              </PortalPanel>
            )}

            <PortalPanel title="Line items">
              {invoice.lines.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No line items recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] uppercase text-muted border-b border-border">
                        <th className="py-2 pr-3">Description</th>
                        <th className="py-2 pr-3">Service</th>
                        <th className="py-2 pr-3">Qty</th>
                        <th className="py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line) => (
                        <tr key={line.id} className="border-t border-border/60">
                          <td className="py-3 pr-3">{line.description}</td>
                          <td className="py-3 pr-3">
                            {line.serviceLink ? (
                              <Link href={`/services/${line.serviceLink.serviceId}`} className="text-xs font-semibold text-accent hover:underline">
                                {line.serviceLink.displayName}
                              </Link>
                            ) : line.businessServiceReference ? (
                              <span className="text-xs text-muted font-mono">{line.businessServiceReference}</span>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-3">{line.quantity}</td>
                          <td className="py-3 font-semibold">{fmtPence(line.grossAmountPence)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PortalPanel>
          </>
        )}
      </div>
    </PortalPage>
  );
}
