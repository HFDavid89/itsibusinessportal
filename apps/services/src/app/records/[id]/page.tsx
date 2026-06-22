'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { servicesApi, money, fmt, type AnyService, type BusinessMobileService, type BusinessBroadbandService, type BusinessEnergyService } from '../../../lib/api';
import { WholesaleFulfilmentPanel } from '../../../components/WholesaleFulfilmentPanel';

const NAV_GROUPS = [
  { label: 'Services', items: [
    { href: '/',          label: 'Dashboard',  exactMatch: true },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/records',   label: 'Service Records' },
  ]},
];

const STATUS_CLS: Record<string, string> = {
  DRAFT:      'bg-border/40 text-muted border-border',
  REQUESTED:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACTIVE:     'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  SUSPENDED:  'bg-amber-500/10 text-amber-700 border-amber-500/20',
  CEASED:     'bg-rose-500/10 text-rose-600 border-rose-500/20',
  CANCELLED:  'bg-border text-muted border-border',
};

const TYPE_CLS: Record<string, string> = {
  MOBILE:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  BROADBAND: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  ENERGY:    'bg-amber-500/10 text-amber-700 border-amber-500/20',
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value ?? '—'}</p>
    </div>
  );
}

const INP = 'w-full rounded-lg border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30';
const LBL = 'block text-xs font-semibold text-foreground mb-1';
const SEL = `${INP} cursor-pointer`;

const MOBILE_STATUSES    = ['DRAFT','REQUESTED','ACTIVE','SUSPENDED','CEASED','CANCELLED'];
const BROADBAND_STATUSES = ['DRAFT','REQUESTED','ACTIVE','SUSPENDED','CEASED','CANCELLED'];
const ENERGY_STATUSES    = ['DRAFT','ACTIVE','SUSPENDED','CEASED'];

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [svc,     setSvc]     = useState<AnyService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [editing, setEditing] = useState(false);
  const [patch,   setPatch]   = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState('');

  useEffect(() => {
    servicesApi.get(id)
      .then((r) => setSvc(r.data))
      .catch(() => setError('Failed to load service'))
      .finally(() => setLoading(false));
  }, [id]);

  function startEdit() {
    if (!svc) return;
    const m = svc as any;
    setPatch({
      displayName: svc.displayName,
      status:      svc.status,
      ...(svc._serviceType !== 'ENERGY' ? { retailPricePence: String(m.retailPricePence ?? '') } : {}),
      ...(svc._serviceType === 'MOBILE'    ? { mobileNumber: m.mobileNumber ?? '', simLabel: m.simLabel ?? '', costCentre: m.costCentre ?? '' } : {}),
      ...(svc._serviceType === 'BROADBAND' ? { circuitLabel: m.circuitLabel ?? '', accessTechnology: m.accessTechnology ?? '' } : {}),
      ...(svc._serviceType === 'ENERGY'    ? { meterPointReference: m.meterPointReference ?? '', retailPriceDescription: m.retailPriceDescription ?? '' } : {}),
    });
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!svc) return;
    setSaving(true);
    setSaveErr('');
    const body: Record<string, unknown> = { ...patch };
    if (body.retailPricePence) body.retailPricePence = parseInt(body.retailPricePence as string, 10);
    try {
      let res;
      if (svc._serviceType === 'MOBILE')    res = await servicesApi.updateMobile(id, body);
      else if (svc._serviceType === 'BROADBAND') res = await servicesApi.updateBroadband(id, body);
      else                                   res = await servicesApi.updateEnergy(id, body);
      setSvc(res.data as unknown as AnyService);
      setEditing(false);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-8 text-sm text-muted">Loading…</div>
    </AppShell>
  );

  if (error || !svc) return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-8 text-sm text-danger">{error || 'Not found'}</div>
    </AppShell>
  );

  const m = svc as any;
  const statuses = svc._serviceType === 'ENERGY' ? ENERGY_STATUSES : svc._serviceType === 'MOBILE' ? MOBILE_STATUSES : BROADBAND_STATUSES;

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-5 max-w-4xl mx-auto space-y-4">

        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/records" className="hover:text-foreground">Service Records</Link>
          <span>/</span>
          <span className="text-foreground font-mono">{svc.serviceReference}</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-foreground">{svc.displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-muted">{svc.serviceReference}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${TYPE_CLS[svc._serviceType] ?? 'bg-border/40 text-muted border-border'}`}>
                {svc._serviceType}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_CLS[svc.status] ?? STATUS_CLS.DRAFT}`}>
                {svc.status}
              </span>
            </div>
          </div>
          {!editing && (
            <button onClick={startEdit}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-raised transition-colors">
              Edit
            </button>
          )}
        </div>

        {/* Account & catalogue */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Account"     value={svc.account?.companyName ?? svc.accountId} />
          <Field label="Acc. Number" value={svc.account?.accountNumber ?? '—'} />
          {svc.catalogueItem && <Field label="Catalogue Item" value={`${svc.catalogueItem.name} (${svc.catalogueItem.sku})`} />}
          {svc._serviceType !== 'ENERGY' && <Field label="Retail Price" value={money(m.retailPricePence ?? 0)} />}
          <Field label="Contract Start" value={fmt(svc.contractStartDate ?? null)} />
          <Field label="Contract End"   value={fmt(svc.contractEndDate ?? null)} />
          <Field label="Created" value={fmt(svc.createdAt)} />
          <Field label="Updated" value={fmt(svc.updatedAt)} />
        </div>

        {/* Type-specific fields */}
        {svc._serviceType === 'MOBILE' && (() => { const ms = svc as BusinessMobileService; return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Mobile Number" value={ms.mobileNumber} />
            <Field label="SIM Label"     value={ms.simLabel} />
            <Field label="Cost Centre"   value={ms.costCentre} />
          </div>
        ); })()}

        {svc._serviceType === 'BROADBAND' && (() => { const bs = svc as BusinessBroadbandService; return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Postcode"     value={bs.postcode} />
            <Field label="UPRN"         value={bs.uprn} />
            <Field label="Access Tech"  value={bs.accessTechnology} />
            <Field label="Circuit"      value={bs.circuitLabel} />
            <Field label="Site"         value={bs.site?.name ?? bs.siteId} />
          </div>
        ); })()}

        {svc._serviceType === 'ENERGY' && (() => { const es = svc as BusinessEnergyService; return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Fuel Type"    value={es.fuelType} />
            <Field label="Meter Ref"    value={es.meterPointReference} />
            <Field label="Price Desc"   value={es.retailPriceDescription} />
            <Field label="Site"         value={es.site?.name ?? es.siteId} />
          </div>
        ); })()}

        {/* Wholesale fulfilment */}
        <WholesaleFulfilmentPanel
          serviceId={id}
          serviceType={svc._serviceType}
          serviceStatus={svc.status}
          wholesaleLink={m.wholesaleLink}
          onUpdated={(updated) => setSvc(updated)}
        />

        {/* Edit form */}
        {editing && (
          <form onSubmit={save} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Edit Service</h2>
            {saveErr && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{saveErr}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">
                <label className={LBL}>Display Name</label>
                <input type="text" value={patch.displayName ?? ''} onChange={(e) => setPatch((p) => ({ ...p, displayName: e.target.value }))} className={INP} />
              </div>

              <div>
                <label className={LBL}>Status</label>
                <select value={patch.status ?? svc.status} onChange={(e) => setPatch((p) => ({ ...p, status: e.target.value }))} className={SEL}>
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {svc._serviceType !== 'ENERGY' && (
                <div>
                  <label className={LBL}>Retail Price (pence)</label>
                  <input type="number" value={patch.retailPricePence ?? ''} onChange={(e) => setPatch((p) => ({ ...p, retailPricePence: e.target.value }))} min="0" step="1" className={INP} />
                </div>
              )}

              {svc._serviceType === 'MOBILE' && (<>
                <div>
                  <label className={LBL}>Mobile Number</label>
                  <input type="text" value={patch.mobileNumber ?? ''} onChange={(e) => setPatch((p) => ({ ...p, mobileNumber: e.target.value }))} className={INP} />
                </div>
                <div>
                  <label className={LBL}>SIM Label</label>
                  <input type="text" value={patch.simLabel ?? ''} onChange={(e) => setPatch((p) => ({ ...p, simLabel: e.target.value }))} className={INP} />
                </div>
                <div>
                  <label className={LBL}>Cost Centre</label>
                  <input type="text" value={patch.costCentre ?? ''} onChange={(e) => setPatch((p) => ({ ...p, costCentre: e.target.value }))} className={INP} />
                </div>
              </>)}

              {svc._serviceType === 'BROADBAND' && (<>
                <div>
                  <label className={LBL}>Access Technology</label>
                  <input type="text" value={patch.accessTechnology ?? ''} onChange={(e) => setPatch((p) => ({ ...p, accessTechnology: e.target.value }))} className={INP} />
                </div>
                <div>
                  <label className={LBL}>Circuit Label</label>
                  <input type="text" value={patch.circuitLabel ?? ''} onChange={(e) => setPatch((p) => ({ ...p, circuitLabel: e.target.value }))} className={INP} />
                </div>
              </>)}

              {svc._serviceType === 'ENERGY' && (<>
                <div>
                  <label className={LBL}>Meter Point Reference</label>
                  <input type="text" value={patch.meterPointReference ?? ''} onChange={(e) => setPatch((p) => ({ ...p, meterPointReference: e.target.value }))} className={INP} />
                </div>
                <div className="sm:col-span-2">
                  <label className={LBL}>Retail Price Description</label>
                  <input type="text" value={patch.retailPriceDescription ?? ''} onChange={(e) => setPatch((p) => ({ ...p, retailPriceDescription: e.target.value }))} className={INP} />
                </div>
              </>)}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => setEditing(false)}
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
