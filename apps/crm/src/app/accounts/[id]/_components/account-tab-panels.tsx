'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  crmApi,
  type BusinessContact,
  type BusinessSite,
  type BusinessInvoice,
  type BusinessService,
  type TimelineEvent,
  type CreateContactInput,
  type CreateSiteInput,
} from '../../../../lib/api';

const INP = 'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30';

// ── Contacts Panel ────────────────────────────────────────────────────────────

export function ContactsPanel({ accountId }: { accountId: string }) {
  const [contacts, setContacts] = useState<BusinessContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateContactInput>({ firstName: '', lastName: '', email: '', phone: '', role: 'GENERAL', isPrimary: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.contacts(accountId);
      setContacts(res.data);
    } catch { setError('Failed to load contacts'); }
    finally { setLoading(false); }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await crmApi.createContact(accountId, { ...form, phone: form.phone || undefined });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'GENERAL', isPrimary: false });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally { setSaving(false); }
  };

  const set = (field: keyof CreateContactInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-accent hover:underline">
          {showForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-surface-raised/60 border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">New Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] text-muted block mb-1">First Name *</label><input value={form.firstName} onChange={set('firstName')} required className={INP} /></div>
            <div><label className="text-[11px] text-muted block mb-1">Last Name *</label><input value={form.lastName} onChange={set('lastName')} required className={INP} /></div>
          </div>
          <div><label className="text-[11px] text-muted block mb-1">Email *</label><input type="email" value={form.email} onChange={set('email')} required className={INP} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] text-muted block mb-1">Phone</label><input value={form.phone ?? ''} onChange={set('phone')} className={INP} /></div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Role</label>
              <select value={form.role} onChange={set('role')} className={INP}>
                <option value="GENERAL">General</option>
                <option value="PRIMARY">Primary</option>
                <option value="BILLING">Billing</option>
                <option value="TECHNICAL">Technical</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input type="checkbox" checked={form.isPrimary ?? false} onChange={set('isPrimary')} className="rounded border-border" />
            Set as primary contact
          </label>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-border text-xs text-muted hover:text-foreground">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Contact'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-surface-raised rounded-xl animate-pulse" />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted">No contacts yet. Add one above.</div>
      ) : (
        <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
          {contacts.map((c) => (
            <div key={c.id} className="px-4 py-3 bg-surface">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {c.firstName} {c.lastName}
                    {c.isPrimary && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Primary</span>}
                  </p>
                  <p className="text-xs text-muted">{c.email}</p>
                  {c.phone && <p className="text-xs text-muted">{c.phone}</p>}
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface-raised text-muted font-medium">{c.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sites Panel ───────────────────────────────────────────────────────────────

export function SitesPanel({ accountId }: { accountId: string }) {
  const [sites, setSites] = useState<BusinessSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateSiteInput>({ name: '', addressLine1: '', city: '', postcode: '', isPrimary: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.sites(accountId);
      setSites(res.data);
    } catch { setError('Failed to load sites'); }
    finally { setLoading(false); }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await crmApi.createSite(accountId, form);
      setShowForm(false);
      setForm({ name: '', addressLine1: '', city: '', postcode: '', isPrimary: false });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save site');
    } finally { setSaving(false); }
  };

  const set = (field: keyof CreateSiteInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{sites.length} site{sites.length !== 1 ? 's' : ''}</p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-accent hover:underline">
          {showForm ? 'Cancel' : '+ Add Site'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-surface-raised/60 border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">New Site</p>
          <div><label className="text-[11px] text-muted block mb-1">Site Name *</label><input value={form.name} onChange={set('name')} required placeholder="Head Office" className={INP} /></div>
          <div><label className="text-[11px] text-muted block mb-1">Address Line 1 *</label><input value={form.addressLine1} onChange={set('addressLine1')} required className={INP} /></div>
          <div><label className="text-[11px] text-muted block mb-1">Address Line 2</label><input value={form.addressLine2 ?? ''} onChange={set('addressLine2')} className={INP} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] text-muted block mb-1">City *</label><input value={form.city} onChange={set('city')} required className={INP} /></div>
            <div><label className="text-[11px] text-muted block mb-1">Postcode *</label><input value={form.postcode} onChange={set('postcode')} required className={INP} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] text-muted block mb-1">County</label><input value={form.county ?? ''} onChange={set('county')} className={INP} /></div>
            <div><label className="text-[11px] text-muted block mb-1">UPRN</label><input value={form.uprn ?? ''} onChange={set('uprn')} className={INP} /></div>
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input type="checkbox" checked={form.isPrimary ?? false} onChange={set('isPrimary')} className="rounded border-border" />
            Set as primary site
          </label>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-border text-xs text-muted hover:text-foreground">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Site'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-surface-raised rounded-xl animate-pulse" />)}
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted">No sites yet. Add one above.</div>
      ) : (
        <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
          {sites.map((s) => (
            <div key={s.id} className="px-4 py-3 bg-surface">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {s.name}
                    {s.isPrimary && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Primary</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {s.addressLine1}{s.addressLine2 ? `, ${s.addressLine2}` : ''}, {s.city}, {s.postcode}
                  </p>
                  {s.uprn && <p className="text-[11px] text-muted font-mono mt-0.5">UPRN: {s.uprn}</p>}
                </div>
                {s._count && <span className="text-[11px] text-muted shrink-0">{s._count.contacts} contact{s._count.contacts !== 1 ? 's' : ''}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Invoices Panel ────────────────────────────────────────────────────────────

const INV_STATUS_COLOURS: Record<string, string> = {
  DRAFT:     'bg-border/60 text-muted border-border',
  ISSUED:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PART_PAID: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PAID:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  OVERDUE:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
  VOID:      'bg-border/40 text-muted/60 border-border/40',
};

function fmt(pence: number) { return `£${(pence / 100).toFixed(2)}`; }

export function InvoicesPanel({ accountId }: { accountId: string }) {
  const [invoices, setInvoices] = useState<BusinessInvoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    crmApi.accountInvoices(accountId)
      .then((r) => setInvoices(r.data))
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [accountId]);

  return (
    <div className="space-y-3">
      {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div>}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-surface-raised rounded-xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted">No invoices for this account.</div>
      ) : (
        <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
          {invoices.map((inv) => (
            <div key={inv.id} className="px-4 py-3 bg-surface flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground font-mono">{inv.invoiceNumber}</p>
                <p className="text-[11px] text-muted">
                  {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {inv.dueDate && ` · Due ${new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-foreground">{fmt(inv.totalPence)}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${INV_STATUS_COLOURS[inv.status] ?? 'bg-border text-muted border-border'}`}>
                  {inv.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Services Panel ────────────────────────────────────────────────────────────

const SVC_STATUS_COLOURS: Record<string, string> = {
  DRAFT:     'bg-border/60 text-muted border-border',
  REQUESTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ACTIVE:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SUSPENDED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CEASED:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  CANCELLED: 'bg-border/40 text-muted/60 border-border/40',
};

const SVC_TYPE_ICON: Record<string, string> = {
  MOBILE:    '📱',
  BROADBAND: '🌐',
  ENERGY:    '⚡',
};

export function ServicesPanel({ accountId }: { accountId: string }) {
  const [services, setServices] = useState<BusinessService[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    crmApi.accountServices(accountId)
      .then((r) => setServices(r.data))
      .catch(() => setError('Failed to load services'))
      .finally(() => setLoading(false));
  }, [accountId]);

  return (
    <div className="space-y-3">
      {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div>}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-surface-raised rounded-xl animate-pulse" />)}</div>
      ) : services.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted">No services for this account.</div>
      ) : (
        <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
          {services.map((svc) => (
            <div key={svc.id} className="px-4 py-3 bg-surface">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">{SVC_TYPE_ICON[svc._serviceType] ?? '🔌'}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{svc.displayName}</p>
                    <p className="text-[11px] text-muted">
                      {svc._serviceType}
                      {svc.mobileNumber && ` · ${svc.mobileNumber}`}
                      {svc.site && ` · ${svc.site.name}`}
                      {svc.retailPricePence > 0 && ` · ${fmt(svc.retailPricePence)}/mo`}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-medium ${SVC_STATUS_COLOURS[svc.status] ?? 'bg-border text-muted border-border'}`}>
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Energy Panel ──────────────────────────────────────────────────────────────

interface EnergyRecord {
  id: string;
  displayName: string;
  status: string;
  fuelType: string;
  supplierName?: string | null;
  contractEndDate?: string | null;
  nextCheckInDate?: string | null;
  renewalWindowStartDate?: string | null;
  notes?: string | null;
  site?: { name: string } | null;
}

const ENERGY_STATUS_CLS: Record<string, string> = {
  PROSPECT: 'bg-border/60 text-muted border-border',
  REFERRED_TO_FIDELITY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  QUOTE_IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  CONTRACTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  RENEWAL_DUE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LOST: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  CEASED: 'bg-border/40 text-muted/60 border-border/40',
};

export function EnergyPanel({ accountId }: { accountId: string }) {
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.energyRecords(accountId);
      setRecords(res.data);
    } catch { setError('Failed to load energy records'); }
    finally { setLoading(false); }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: 'referred' | 'checkin' | 'lost') {
    setActing(id);
    try {
      if (action === 'referred') await crmApi.markEnergyReferred(id);
      if (action === 'checkin') await crmApi.completeEnergyCheckIn(id);
      if (action === 'lost') await crmApi.markEnergyLost(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally { setActing(''); }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Energy sales are completed in the Fidelity portal. Track referrals, renewals, and check-ins here.</p>
      {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div>}
      {loading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-surface-raised rounded-xl animate-pulse" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted">No energy records for this account.</div>
      ) : (
        <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
          {records.map((r) => (
            <div key={r.id} className="px-4 py-3 bg-surface space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.displayName}</p>
                  <p className="text-[11px] text-muted">{r.fuelType}{r.site ? ` · ${r.site.name}` : ''}{r.supplierName ? ` · ${r.supplierName}` : ''}</p>
                  <p className="text-[11px] text-muted">Contract end: {r.contractEndDate ? new Date(r.contractEndDate).toLocaleDateString('en-GB') : '—'} · Next check-in: {r.nextCheckInDate ? new Date(r.nextCheckInDate).toLocaleDateString('en-GB') : '—'}</p>
                </div>
                <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-medium ${ENERGY_STATUS_CLS[r.status] ?? ENERGY_STATUS_CLS.PROSPECT}`}>{r.status.replace(/_/g, ' ')}</span>
              </div>
              {r.notes && <p className="text-[11px] text-muted">{r.notes}</p>}
              <div className="flex flex-wrap gap-2">
                {r.status === 'PROSPECT' && (
                  <button type="button" disabled={acting === r.id} onClick={() => act(r.id, 'referred')} className="text-[11px] px-2 py-1 rounded border border-border hover:bg-surface-raised disabled:opacity-50">Mark Referred</button>
                )}
                {!['LOST','CEASED'].includes(r.status) && (
                  <button type="button" disabled={acting === r.id} onClick={() => act(r.id, 'checkin')} className="text-[11px] px-2 py-1 rounded border border-border hover:bg-surface-raised disabled:opacity-50">Complete Check-in</button>
                )}
                {!['LOST','CEASED'].includes(r.status) && (
                  <button type="button" disabled={acting === r.id} onClick={() => act(r.id, 'lost')} className="text-[11px] px-2 py-1 rounded border border-border hover:bg-surface-raised disabled:opacity-50">Mark Lost</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timeline Panel ────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: 'Account created',
  ACCOUNT_UPDATED: 'Account updated',
  CONTACT_ADDED: 'Contact added',
  CONTACT_UPDATED: 'Contact updated',
  SITE_ADDED: 'Site added',
  SITE_UPDATED: 'Site updated',
  ENERGY_REFERRED_TO_FIDELITY: 'Energy referred to Fidelity',
  ENERGY_CONTRACTED: 'Energy contract recorded',
  ENERGY_CHECK_IN_COMPLETED: 'Energy check-in completed',
  ENERGY_MARKED_LOST: 'Energy opportunity marked lost',
  ENERGY_RENEWAL_WINDOW_STARTED: 'Energy renewal window started',
  ENERGY_SERVICE_CREATED: 'Energy record created',
  ENERGY_SERVICE_UPDATED: 'Energy record updated',
};

export function TimelinePanel({ accountId }: { accountId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    crmApi.timeline(accountId)
      .then((r) => setEvents(r.data))
      .catch(() => setError('Failed to load timeline'))
      .finally(() => setLoading(false));
  }, [accountId]);

  return (
    <div className="space-y-2">
      {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</div>}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-surface-raised rounded-xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted">No timeline events yet.</div>
      ) : (
        <div className="relative pl-5 space-y-0">
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
          {events.map((ev) => (
            <div key={ev.id} className="relative flex gap-3 pb-5 last:pb-0">
              <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full border-2 border-accent bg-surface shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{EVENT_LABELS[ev.type] ?? ev.type}</p>
                <p className="text-[11px] text-muted">
                  {new Date(ev.occurredAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {ev.actorType === 'STAFF' && ' · Staff'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

