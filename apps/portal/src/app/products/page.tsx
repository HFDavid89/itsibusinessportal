'use client';

import { useEffect, useMemo, useState } from 'react';
import { CompactKpiChip, LoadErrorPanel, LoadingList, StatusPill } from '@itsi-business/ui';
import { PortalPage } from '../../components/PortalPage';
import { PortalHero } from '../../components/portal-ui/portal-cockpit';
import { RequestSupportModal } from '../../components/PortalRequests';
import { portalApi, fmtPence, type PortalProduct } from '../../lib/api';
import { SERVICE_TYPE_LABELS } from '../../lib/labels';

const TYPE_FILTERS = ['ALL', 'MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'SUPPORT', 'OTHER'] as const;

function ProductCard({ product, onEnquire }: { product: PortalProduct; onEnquire: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5 flex flex-col h-full hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          {SERVICE_TYPE_LABELS[product.serviceType] ?? product.serviceType}
        </p>
        <StatusPill tone="success" dot>Available</StatusPill>
      </div>
      <h3 className="text-base font-bold text-foreground mt-2">{product.name}</h3>
      {product.description && (
        <p className="text-sm text-muted mt-2 line-clamp-3 flex-1">{product.description}</p>
      )}
      <div className="mt-4 pt-4 border-t border-border/60">
        <p className="text-xl font-bold text-foreground">
          {fmtPence(product.retailPricePence)}
          <span className="text-xs font-normal text-muted">/mo</span>
        </p>
        {product.setupFeePence != null && product.setupFeePence > 0 && (
          <p className="text-xs text-muted mt-1">Setup fee {fmtPence(product.setupFeePence)}</p>
        )}
        {product.contractTermMonths && (
          <p className="text-xs text-muted">{product.contractTermMonths}-month contract term</p>
        )}
      </div>
      <button
        type="button"
        onClick={onEnquire}
        className="mt-4 w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 transition-opacity"
      >
        Request more information
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('ALL');
  const [enquireId, setEnquireId] = useState<string | null>(null);

  useEffect(() => {
    portalApi.products()
      .then(setProducts)
      .catch(() => setError('Unable to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (typeFilter === 'ALL') return products;
    return products.filter((p) => p.serviceType === typeFilter);
  }, [products, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) counts[p.serviceType] = (counts[p.serviceType] ?? 0) + 1;
    return counts;
  }, [products]);

  return (
    <PortalPage title="Products & plans" subtitle="Business products available to your account">
      <div className="max-w-6xl mx-auto space-y-5">
        <PortalHero
          eyebrow="Catalogue"
          title="Products & plans"
          subtitle="Browse available business services and request information from our team."
          badges={<StatusPill tone="info" dot>{products.length} available</StatusPill>}
        />

        {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}

        {loading ? (
          <LoadingList rows={6} />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-raised px-6 py-14 text-center">
            <p className="text-sm font-semibold text-foreground">No products available</p>
            <p className="text-xs text-muted mt-1">Your account does not have any customer-visible catalogue items right now.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.filter((t) => t === 'ALL' || typeCounts[t]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    typeFilter === t
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-surface-raised text-muted border-border hover:text-foreground'
                  }`}
                >
                  {t === 'ALL' ? `All (${products.length})` : `${SERVICE_TYPE_LABELS[t] ?? t} (${typeCounts[t] ?? 0})`}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-raised px-6 py-10 text-center text-sm text-muted">
                No products match this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} onEnquire={() => setEnquireId(p.id)} />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(typeCounts).map(([type, count]) => (
                <CompactKpiChip key={type} label={SERVICE_TYPE_LABELS[type] ?? type} value={count} />
              ))}
            </div>
          </>
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
