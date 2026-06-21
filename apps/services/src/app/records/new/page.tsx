'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { servicesApi, type FuelType } from '../../../lib/api';

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

type ServiceKind = 'MOBILE' | 'BROADBAND' | 'ENERGY';

export default function NewServicePage() {
  const router  = useRouter();
  const [kind,  setKind]  = useState<ServiceKind>('MOBILE');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Shared
  const [accountId,   setAccountId]   = useState('');
  const [displayName, setDisplayName] = useState('');
  const [retailPence, setRetailPence] = useState('');
  const [catalogueItemId, setCatalogueItemId] = useState('');
  const [contractStart,   setContractStart]   = useState('');
  const [contractEnd,     setContractEnd]      = useState('');

  // Mobile
  const [mobileNumber, setMobileNumber] = useState('');
  const [simLabel,     setSimLabel]     = useState('');
  const [costCentre,   setCostCentre]   = useState('');
  const [contactId,    setContactId]    = useState('');

  // Broadband
  const [siteId,          setSiteId]          = useState('');
  const [postcode,        setPostcode]        = useState('');
  const [accessTech,      setAccessTech]      = useState('');
  const [uprn,            setUprn]            = useState('');
  const [circuitLabel,    setCircuitLabel]    = useState('');

  // Energy
  const [fuelType,        setFuelType]        = useState<FuelType>('ELECTRICITY');
  const [meterRef,        setMeterRef]        = useState('');
  const [priceDesc,       setPriceDesc]       = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (kind === 'MOBILE') {
        const res = await servicesApi.createMobile({
          accountId,
          displayName,
          retailPricePence: parseInt(retailPence, 10) || 0,
          contactId:        contactId    || undefined,
          catalogueItemId:  catalogueItemId || undefined,
          contractStartDate: contractStart || undefined,
          contractEndDate:   contractEnd   || undefined,
          mobileNumber:     mobileNumber  || undefined,
          simLabel:         simLabel      || undefined,
          costCentre:       costCentre    || undefined,
        });
        router.push(`/records/${res.data.id}`);
      } else if (kind === 'BROADBAND') {
        const res = await servicesApi.createBroadband({
          accountId,
          siteId,
          displayName,
          postcode,
          retailPricePence: parseInt(retailPence, 10) || 0,
          catalogueItemId:  catalogueItemId || undefined,
          contractStartDate: contractStart || undefined,
          contractEndDate:   contractEnd   || undefined,
          accessTechnology: accessTech   || undefined,
          uprn:             uprn          || undefined,
          circuitLabel:     circuitLabel  || undefined,
        });
        router.push(`/records/${res.data.id}`);
      } else {
        const res = await servicesApi.createEnergy({
          accountId,
          siteId,
          displayName,
          fuelType,
          catalogueItemId:  catalogueItemId  || undefined,
          contractStartDate: contractStart   || undefined,
          contractEndDate:   contractEnd     || undefined,
          meterPointReference:    meterRef   || undefined,
          retailPriceDescription: priceDesc  || undefined,
        });
        router.push(`/records/${res.data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
      setSaving(false);
    }
  }

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }}>
      <div className="p-5 max-w-2xl mx-auto space-y-4">

        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/records" className="hover:text-foreground">Service Records</Link>
          <span>/</span>
          <span className="text-foreground">New Service</span>
        </div>

        <h1 className="text-lg font-bold text-foreground">New Service Record</h1>

        {/* Service type selector */}
        <div className="flex items-center gap-2">
          {(['MOBILE', 'BROADBAND', 'ENERGY'] as ServiceKind[]).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                kind === k ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted hover:text-foreground hover:bg-surface-raised'
              }`}>
              {k}
            </button>
          ))}
        </div>

        {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</div>}

        <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Shared fields */}
            <div className="sm:col-span-2">
              <label className={LBL}>Account ID *</label>
              <input type="text" value={accountId} onChange={(e) => setAccountId(e.target.value)}
                required className={INP} placeholder="Account cuid" />
            </div>
            <div className="sm:col-span-2">
              <label className={LBL}>Display Name *</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                required className={INP} placeholder="e.g. John Smith Mobile — Sales" />
            </div>
            {kind !== 'ENERGY' && (
              <div>
                <label className={LBL}>Retail Price (pence)</label>
                <input type="number" value={retailPence} onChange={(e) => setRetailPence(e.target.value)}
                  min="0" step="1" className={INP} placeholder="e.g. 2999 = £29.99" />
              </div>
            )}
            <div>
              <label className={LBL}>Catalogue Item ID</label>
              <input type="text" value={catalogueItemId} onChange={(e) => setCatalogueItemId(e.target.value)}
                className={INP} placeholder="Optional" />
            </div>
            <div>
              <label className={LBL}>Contract Start</label>
              <input type="datetime-local" value={contractStart} onChange={(e) => setContractStart(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className={INP} />
            </div>
            <div>
              <label className={LBL}>Contract End</label>
              <input type="datetime-local" value={contractEnd} onChange={(e) => setContractEnd(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className={INP} />
            </div>

            {/* Mobile-specific */}
            {kind === 'MOBILE' && (<>
              <div>
                <label className={LBL}>Contact ID</label>
                <input type="text" value={contactId} onChange={(e) => setContactId(e.target.value)}
                  className={INP} placeholder="Optional" />
              </div>
              <div>
                <label className={LBL}>Mobile Number</label>
                <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                  className={INP} placeholder="e.g. 07700900000" />
              </div>
              <div>
                <label className={LBL}>SIM Label</label>
                <input type="text" value={simLabel} onChange={(e) => setSimLabel(e.target.value)}
                  className={INP} placeholder="Optional" />
              </div>
              <div>
                <label className={LBL}>Cost Centre</label>
                <input type="text" value={costCentre} onChange={(e) => setCostCentre(e.target.value)}
                  className={INP} placeholder="Optional" />
              </div>
            </>)}

            {/* Broadband-specific */}
            {kind === 'BROADBAND' && (<>
              <div>
                <label className={LBL}>Site ID *</label>
                <input type="text" value={siteId} onChange={(e) => setSiteId(e.target.value)}
                  required className={INP} placeholder="Site cuid" />
              </div>
              <div>
                <label className={LBL}>Postcode *</label>
                <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)}
                  required className={INP} placeholder="e.g. HU1 1AB" />
              </div>
              <div>
                <label className={LBL}>Access Technology</label>
                <input type="text" value={accessTech} onChange={(e) => setAccessTech(e.target.value)}
                  className={INP} placeholder="e.g. FTTP, FTTC, SoGEA" />
              </div>
              <div>
                <label className={LBL}>UPRN</label>
                <input type="text" value={uprn} onChange={(e) => setUprn(e.target.value)}
                  className={INP} placeholder="Optional" />
              </div>
              <div>
                <label className={LBL}>Circuit Label</label>
                <input type="text" value={circuitLabel} onChange={(e) => setCircuitLabel(e.target.value)}
                  className={INP} placeholder="Optional" />
              </div>
            </>)}

            {/* Energy-specific */}
            {kind === 'ENERGY' && (<>
              <div>
                <label className={LBL}>Site ID *</label>
                <input type="text" value={siteId} onChange={(e) => setSiteId(e.target.value)}
                  required className={INP} placeholder="Site cuid" />
              </div>
              <div>
                <label className={LBL}>Fuel Type *</label>
                <select value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)} className={SEL}>
                  <option value="ELECTRICITY">ELECTRICITY</option>
                  <option value="GAS">GAS</option>
                  <option value="DUAL_FUEL">DUAL_FUEL</option>
                </select>
              </div>
              <div>
                <label className={LBL}>Meter Point Reference</label>
                <input type="text" value={meterRef} onChange={(e) => setMeterRef(e.target.value)}
                  className={INP} placeholder="MPAN / MPRN" />
              </div>
              <div className="sm:col-span-2">
                <label className={LBL}>Retail Price Description</label>
                <input type="text" value={priceDesc} onChange={(e) => setPriceDesc(e.target.value)}
                  className={INP} placeholder="e.g. Fixed until 2026-03-31" />
              </div>
            </>)}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Link href="/records"
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : `Create ${kind} Service`}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
