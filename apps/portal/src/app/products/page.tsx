'use client';

import { useEffect, useState } from 'react';
import { PortalPage, Panel, EmptyState } from '../../components/PortalPage';
import { portalApi, fmtPence, type PortalProduct } from '../../lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<PortalProduct[]>([]);

  useEffect(() => {
    portalApi.products().then(setProducts);
  }, []);

  const grouped = products.reduce<Record<string, PortalProduct[]>>((acc, p) => {
    (acc[p.serviceType] ??= []).push(p);
    return acc;
  }, {});

  return (
    <PortalPage title="Products & plans" subtitle="Available business products">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {!products.length ? (
          <EmptyState message="No products are currently available for your account." />
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type} style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgb(var(--muted))', marginBottom: '0.75rem' }}>{type}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {items.map((p) => (
                  <Panel key={p.id}>
                    <p style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))', fontFamily: 'monospace' }}>{p.sku}</p>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 4 }}>{p.name}</h3>
                    {p.description && <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 6, lineHeight: 1.5 }}>{p.description}</p>}
                    <p style={{ fontSize: '1rem', fontWeight: 700, marginTop: 10 }}>{fmtPence(p.retailPricePence)}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'rgb(var(--muted))' }}>/mo</span></p>
                    {p.setupFeePence != null && p.setupFeePence > 0 && (
                      <p style={{ fontSize: '0.7rem', color: 'rgb(var(--muted))' }}>Setup: {fmtPence(p.setupFeePence)}</p>
                    )}
                    {p.contractTermMonths && (
                      <p style={{ fontSize: '0.7rem', color: 'rgb(var(--muted))' }}>{p.contractTermMonths}-month contract</p>
                    )}
                  </Panel>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </PortalPage>
  );
}
