'use client';

import { useEffect, useState } from 'react';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, EmptyState } from '../../components/PortalPage';
import { portalApi, fmtPence, type PortalServiceItem } from '../../lib/api';

function ServiceTable({ title, items }: { title: string; items: PortalServiceItem[] }) {
  if (!items.length) return null;
  return (
    <Panel>
      <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title} ({items.length})</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'rgb(var(--muted))', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.4rem 0' }}>Service</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Site</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                <td style={{ padding: '0.5rem 0' }}>{s.displayName}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{s.serviceReference}</td>
                <td><StatusPill tone={s.status === 'ACTIVE' ? 'success' : 'default'}>{s.status}</StatusPill></td>
                <td>{s.site?.name ?? '—'}</td>
                <td>{s.retailPricePence != null ? fmtPence(s.retailPricePence) : s.retailPriceDescription ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<{ mobile: PortalServiceItem[]; broadband: PortalServiceItem[]; energy: PortalServiceItem[] } | null>(null);

  useEffect(() => {
    portalApi.services().then(setServices);
  }, []);

  const total = services ? services.mobile.length + services.broadband.length + services.energy.length : 0;

  return (
    <PortalPage title="Active services" subtitle={services ? `${total} services` : undefined}>
      <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!services ? (
          <p style={{ color: 'rgb(var(--muted))' }}>Loading…</p>
        ) : total === 0 ? (
          <EmptyState message="No services on your account yet." />
        ) : (
          <>
            <ServiceTable title="Mobile" items={services.mobile} />
            <ServiceTable title="Broadband" items={services.broadband} />
            <ServiceTable title="Energy" items={services.energy} />
          </>
        )}
      </div>
    </PortalPage>
  );
}
