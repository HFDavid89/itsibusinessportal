'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { catalogueApi, money, fmt, type BusinessServiceCatalogueItem } from '../../../lib/api';

const NAV_GROUPS = [
  { label: 'Services', items: [
    { href: '/',          label: 'Dashboard',  exactMatch: true },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/records',   label: 'Service Records' },
  ]},
];

const INP = 'w-full rounded-lg border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30';
const LBL = 'block text-xs font-semibold text-foreground mb-1';

const STATUS_CLS: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  INACTIVE: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  ARCHIVED: 'bg-border text-muted border-border',
};

export default function CatalogueItemPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [item,   setItem]   = useState<BusinessServiceCatalogueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState('');
  const [desc,    setDesc]    = useState('');
  const [retail,  setRetail]  = useState('');
  const [wholesale, setWholesale] = useState('');
  const [setup,   setSetup]   = useState('');
  const [term,    setTerm]    = useState('');
  const [tax,     setTax]     = useState('');
  const [margin,  setMargin]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    catalogueApi.get(id).then((r) => {
      setItem(r.data);
      populate(r.data);
    }).catch(() => setError('Failed to load catalogue item')).finally(() => setLoading(false));
  }, [id]);

  function populate(i: BusinessServiceCatalogueItem) {
    setName(i.name);
    setDesc(i.description ?? '');
    setRetail(String(i.retailPricePence));
    setWholesale(i.wholesaleCostEstimatePence != null ? String(i.wholesaleCostEstimatePence) : '');
    setSetup(i.setupFeePence != null ? String(i.setupFeePence) : '');
    setTerm(i.contractTermMonths != null ? String(i.contractTermMonths) : '');
    setTax(String(i.taxRate));
    setMargin(i.marginPolicy ?? '');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveErr('');
    try {
      const res = await catalogueApi.update(id, {
        name,
        description:               desc       || undefined,
        retailPricePence:          parseInt(retail, 10),
        wholesaleCostEstimatePence: wholesale  ? parseInt(wholesale, 10) : undefined,
        setupFeePence:             setup       ? parseInt(setup, 10)     : undefined,
        contractTermMonths:        term        ? parseInt(term, 10)      : undefined,
        taxRate:                   parseFloat(tax) || 20,
        marginPolicy:              margin      || undefined,
      });
      setItem(res.data);
      populate(res.data);
      setEditing(false);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function doArchive() {
    if (!confirm('Archive this catalogue item?')) return;
    setArchiving(true);
    try {
      await catalogueApi.archive(id);
      router.push('/catalogue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed');
      setArchiving(false);
    }
  }

  if (loading) return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-8 text-sm text-muted">Loading…</div>
    </AppShell>
  );

  if (error || !item) return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-8 text-sm text-danger">{error || 'Not found'}</div>
    </AppShell>
  );

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-5 max-w-3xl mx-auto space-y-4">

        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/catalogue" className="hover:text-foreground">Catalogue</Link>
          <span>/</span>
          <span className="text-foreground font-mono">{item.sku}</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-foreground">{item.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-muted">{item.sku}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_CLS[item.status] ?? STATUS_CLS.INACTIVE}`}>
                {item.status}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-border/30 text-muted font-semibold">
                {item.serviceType}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.status !== 'ARCHIVED' && !editing && (
              <>
                <button onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-raised transition-colors">
                  Edit
                </button>
                <button onClick={doArchive} disabled={archiving}
                  className="px-4 py-2 rounded-xl border border-danger/30 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-40 transition-colors">
                  {archiving ? 'Archiving…' : 'Archive'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Detail cards */}
        {!editing ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Retail Price',          value: money(item.retailPricePence) },
              { label: 'Wholesale Cost Est.',   value: item.wholesaleCostEstimatePence != null ? money(item.wholesaleCostEstimatePence) : '—' },
              { label: 'Setup Fee',             value: item.setupFeePence != null ? money(item.setupFeePence) : '—' },
              { label: 'Contract Term',         value: item.contractTermMonths ? `${item.contractTermMonths} months` : '—' },
              { label: 'Tax Rate',              value: `${item.taxRate}%` },
              { label: 'Margin Policy',         value: item.marginPolicy ?? '—' },
              { label: 'Created',               value: fmt(item.createdAt) },
              { label: 'Updated',               value: fmt(item.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
              </div>
            ))}
            {item.description && (
              <div className="col-span-2 md:col-span-3 bg-surface border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-foreground">{item.description}</p>
              </div>
            )}
            {item._count && (
              <div className="col-span-2 md:col-span-3 bg-surface border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Linked Service Records</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-foreground"><strong>{item._count.mobileServices}</strong> mobile</span>
                  <span className="text-sm text-foreground"><strong>{item._count.broadbandServices}</strong> broadband</span>
                  <span className="text-sm text-foreground"><strong>{item._count.energyServices}</strong> energy</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={save} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            {saveErr && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{saveErr}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LBL}>Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={INP} />
              </div>
              <div>
                <label className={LBL}>Retail Price (pence) *</label>
                <input type="number" value={retail} onChange={(e) => setRetail(e.target.value)} required min="0" step="1" className={INP} />
              </div>
              <div>
                <label className={LBL}>Wholesale Cost Estimate (pence)</label>
                <input type="number" value={wholesale} onChange={(e) => setWholesale(e.target.value)} min="0" step="1" className={INP} />
              </div>
              <div>
                <label className={LBL}>Setup Fee (pence)</label>
                <input type="number" value={setup} onChange={(e) => setSetup(e.target.value)} min="0" step="1" className={INP} />
              </div>
              <div>
                <label className={LBL}>Contract Term (months)</label>
                <input type="number" value={term} onChange={(e) => setTerm(e.target.value)} min="0" step="1" className={INP} />
              </div>
              <div>
                <label className={LBL}>Tax Rate (%)</label>
                <input type="number" value={tax} onChange={(e) => setTax(e.target.value)} min="0" max="100" step="0.1" className={INP} />
              </div>
              <div>
                <label className={LBL}>Margin Policy</label>
                <input type="text" value={margin} onChange={(e) => setMargin(e.target.value)} className={INP} />
              </div>
              <div className="sm:col-span-2">
                <label className={LBL}>Description</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={INP} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => { setEditing(false); populate(item); }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
