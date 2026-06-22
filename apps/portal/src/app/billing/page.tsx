'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, EmptyState, DisabledAction } from '../../components/PortalPage';
import { portalApi, fmtPence, fmtDate, type PortalInvoiceSummary } from '../../lib/api';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<PortalInvoiceSummary[]>([]);

  useEffect(() => {
    portalApi.invoices().then((r) => setInvoices(r.data));
  }, []);

  return (
    <PortalPage title="Billing & invoices" subtitle={`${invoices.length} invoices`}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {!invoices.length ? (
          <EmptyState message="No invoices available for your account." />
        ) : (
          <Panel>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'rgb(var(--muted))', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.4rem 0' }}>Invoice</th>
                    <th>Status</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Total</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                      <td style={{ padding: '0.5rem 0' }}>
                        <Link href={`/billing/${inv.id}`} style={{ color: 'rgb(var(--accent))', fontWeight: 600, textDecoration: 'none' }}>{inv.invoiceNumber}</Link>
                      </td>
                      <td><StatusPill tone={inv.status === 'OVERDUE' ? 'danger' : inv.status === 'PAID' ? 'success' : 'default'}>{inv.status}</StatusPill></td>
                      <td>{fmtDate(inv.issueDate)}</td>
                      <td>{fmtDate(inv.dueDate)}</td>
                      <td>{fmtPence(inv.totalPence)}</td>
                      <td style={{ fontWeight: 600 }}>{fmtPence(inv.balanceDuePence)}</td>
                      <td><DisabledAction label="Pay invoice" reason="Online payment coming soon" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </PortalPage>
  );
}
