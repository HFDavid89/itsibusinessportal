'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { catalogueApi, type ServiceType } from '../../../lib/api';

const NAV_GROUPS = [
  { label: 'Services', items: [
    { href: '/',          label: 'Dashboard',  exactMatch: true },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/records',   label: 'Service Records' },
  ]},
];

const INP = 'w-full rounded-lg border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30';
const LBL = 'block text-xs font-semibold text-foreground mb-1';
const SEL = `${INP} cursor-pointer`;

const SERVICE_TYPES: ServiceType[] = ['MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'SUPPORT', 'OTHER'];

export default function NewCatalogueItemPage() {
  const router = useRouter();

  const [name,               setName]               = useState('');
  const [serviceType,        setServiceType]        = useState<ServiceType>('MOBILE');
  const [description,        setDescription]        = useState('');
  const [retailPricePence,   setRetailPricePence]   = useState('');
  const [wholesaleCost,      setWholesaleCost]      = useState('');
  const [setupFee,           setSetupFee]           = useState('');
  const [contractTermMonths, setContractTermMonths] = useState('');
  const [taxRate,            setTaxRate]            = useState('20');
  const [marginPolicy,       setMarginPolicy]       = useState('');
  const [sku,                setSku]                = useState('');
  const [saving,             setSaving]             = useState(false);
  const [error,              setError]              = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const retail = parseInt(retailPricePence, 10);
    if (isNaN(retail) || retail < 0) { setError('Retail price must be a non-negative integer (pence)'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await catalogueApi.create({
        name,
        serviceType,
        retailPricePence: retail,
        description: description || undefined,
        wholesaleCostEstimatePence: wholesaleCost ? parseInt(wholesaleCost, 10) : undefined,
        setupFeePence:              setupFee      ? parseInt(setupFee, 10)      : undefined,
        contractTermMonths:         contractTermMonths ? parseInt(contractTermMonths, 10) : undefined,
        taxRate:    parseFloat(taxRate) || 20,
        marginPolicy: marginPolicy || undefined,
        sku:          sku || undefined,
      });
      router.push(`/catalogue/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create catalogue item');
      setSaving(false);
    }
  }

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }}>
      <div className="p-5 max-w-2xl mx-auto space-y-4">

        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/catalogue" className="hover:text-foreground">Catalogue</Link>
          <span>/</span>
          <span className="text-foreground">New Item</span>
        </div>

        <h1 className="text-lg font-bold text-foreground">New Catalogue Item</h1>

        {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</div>}

        <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-6 space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LBL}>Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                required className={INP} placeholder="e.g. Business Mobile Unlimited" />
            </div>

            <div>
              <label className={LBL}>Service Type *</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)} className={SEL}>
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className={LBL}>SKU (auto-generated if blank)</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)}
                className={INP} placeholder="e.g. MOB-UNLIMITED-001" />
            </div>

            <div>
              <label className={LBL}>Retail Price (pence) *</label>
              <input type="number" value={retailPricePence} onChange={(e) => setRetailPricePence(e.target.value)}
                required min="0" step="1" className={INP} placeholder="e.g. 2999 = £29.99" />
            </div>

            <div>
              <label className={LBL}>Wholesale Cost Estimate (pence)</label>
              <input type="number" value={wholesaleCost} onChange={(e) => setWholesaleCost(e.target.value)}
                min="0" step="1" className={INP} placeholder="Optional" />
            </div>

            <div>
              <label className={LBL}>Setup Fee (pence)</label>
              <input type="number" value={setupFee} onChange={(e) => setSetupFee(e.target.value)}
                min="0" step="1" className={INP} placeholder="Optional" />
            </div>

            <div>
              <label className={LBL}>Contract Term (months)</label>
              <input type="number" value={contractTermMonths} onChange={(e) => setContractTermMonths(e.target.value)}
                min="0" step="1" className={INP} placeholder="e.g. 12, 24, 36" />
            </div>

            <div>
              <label className={LBL}>Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                min="0" max="100" step="0.1" className={INP} />
            </div>

            <div className="sm:col-span-2">
              <label className={LBL}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} className={INP} placeholder="Optional customer-facing description" />
            </div>

            <div className="sm:col-span-2">
              <label className={LBL}>Margin Policy</label>
              <input type="text" value={marginPolicy} onChange={(e) => setMarginPolicy(e.target.value)}
                className={INP} placeholder="Optional internal margin note" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Link href="/catalogue"
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
