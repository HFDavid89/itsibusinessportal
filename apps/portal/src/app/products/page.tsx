'use client';

import { useEffect, useState } from 'react';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, EmptyState } from '../../components/PortalPage';
import { RequestSupportModal } from '../../components/PortalRequests';
import { portalApi, fmtPence, type PortalProduct } from '../../lib/api';

function ProductCard({ product, onEnquire }: { product: PortalProduct; onEnquire: () => void }) {
  return (
    <Panel>
      <p style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))', textTransform: 'uppercase' }}>{product.serviceType}</p>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 4 }}>{product.name}</h3>
      {product.description && <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 6, lineHeight: 1.5 }}>{product.description}</p>}
      <p style={{ fontSize: '1rem', fontWeight: 700, marginTop: 10 }}>{fmtPence(product.retailPricePence)}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'rgb(var(--muted))' }}>/mo</span></p>
      {product.setupFeePence != null && product.setupFeePence > 0 && (
        <p style={{ fontSize: '0.7rem', color: 'rgb(var(--muted))' }}>Setup: {fmtPence(product.setupFeePence)}</p>
      )}
      {product.contractTermMonths && (
        <p style={{ fontSize: '0.7rem', color: 'rgb(var(--muted))' }}>{product.contractTermMonths}-month contract</p>
      )}
      <div style={{ marginTop: 10 }}>
        <StatusPill tone="success">{product.availability ?? 'Available'}</StatusPill>
      </div>
      <button
        type="button"
        onClick={onEnquire}
        style={{ marginTop: 12, padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', width: '100%' }}
      >
        Request more info
      </button>
    </Panel>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [enquireId, setEnquireId] = useState<string | null>(null);

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
                  <ProductCard key={p.id} product={p} onEnquire={() => setEnquireId(p.id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {enquireId && (
        <RequestSupportModal
          title="Product enquiry"
          submitLabel="Send enquiry"
          onClose={() => setEnquireId(null)}
          onSubmit={async (message) => {
            const result = await portalApi.enquireProduct(enquireId, { message });
            return { ticketNumber: result.ticket.ticketNumber };
          }}
        />
      )}
    </PortalPage>
  );
}
