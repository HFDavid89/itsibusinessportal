'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import {
  crmApi,
  type BusinessAccount,
  type BusinessContact,
  type BusinessSite,
  type TimelineEvent,
  type CreateContactInput,
  type CreateSiteInput,
} from '../../../lib/api';

const NAV_GROUPS = [
  {
    label: 'CRM',
    items: [
      { href: '/', label: 'Dashboard' },
      { href: '/accounts', label: 'Business Accounts' },
    ],
  },
];

const STATUS_COLOURS: Record<string, string> = {
  PROSPECT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  SUSPENDED: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  CLOSED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const INP = 'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30';

type TabId = 'overview' | 'contacts' | 'sites' | 'timeline';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOURS[status] ?? 'bg-border text-muted border-border'}`}>
      {status}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold text-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-foreground mt-0.5">{value || <span className="text-muted">—</span>}</dd>
    </div>
  );
}

// ── Contacts Panel ────────────────────────────────────────────────────────────

function ContactsPanel({ accountId }: { accountId: string }) {
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

function SitesPanel({ accountId }: { accountId: string }) {
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

// ── Timeline Panel ────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: 'Account created',
  ACCOUNT_UPDATED: 'Account updated',
  CONTACT_ADDED: 'Contact added',
  CONTACT_UPDATED: 'Contact updated',
  SITE_ADDED: 'Site added',
  SITE_UPDATED: 'Site updated',
};

function TimelinePanel({ accountId }: { accountId: string }) {
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

// ── Account 360 ───────────────────────────────────────────────────────────────

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [account, setAccount] = useState<BusinessAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabId>('overview');

  useEffect(() => {
    crmApi.account(id)
      .then((r) => setAccount(r.data))
      .catch(() => setError('Account not found or failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: 'Contacts', count: account?._count?.contacts },
    { id: 'sites', label: 'Sites', count: account?._count?.sites },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'CRM' }}>
      <div className="flex flex-col min-h-0 h-full">

        {/* Account header */}
        <div className="shrink-0 border-b border-border bg-surface px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-muted mb-2">
            <Link href="/accounts" className="hover:text-accent transition-colors">Business Accounts</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{loading ? '…' : (account?.companyName ?? 'Not found')}</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-48 bg-surface-raised rounded animate-pulse" />
              <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
            </div>
          ) : account ? (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-foreground">{account.companyName}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs font-mono text-muted">{account.accountNumber}</span>
                  {account.tradingName && account.tradingName !== account.companyName && (
                    <span className="text-xs text-muted">t/a {account.tradingName}</span>
                  )}
                  <StatusBadge status={account.status} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{account._count?.contacts ?? 0} contacts · {account._count?.sites ?? 0} sites</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          {/* Tab bar */}
          {account && (
            <div className="flex gap-1 mt-4 -mb-[1px]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-muted font-medium">{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab content */}
        {account && (
          <div className="flex-1 overflow-auto p-5">
            {tab === 'overview' && (
              <div className="max-w-[720px] space-y-6">
                <div className="bg-surface border border-border rounded-xl p-5">
                  <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Company Details</h2>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                    <Field label="Company Name" value={account.companyName} />
                    <Field label="Trading Name" value={account.tradingName} />
                    <Field label="Status" value={account.status} />
                    <Field label="Companies House" value={account.companyNumber} />
                    <Field label="VAT Number" value={account.vatNumber} />
                    <Field label="Account Number" value={account.accountNumber} />
                    <Field label="Created" value={new Date(account.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
                    <Field label="Last Updated" value={new Date(account.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
                  </dl>
                </div>

                {/* Service counts summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Open Tickets', value: account._count?.tickets ?? 0 },
                    { label: 'Invoices', value: account._count?.invoices ?? 0 },
                    { label: 'Mobile Lines', value: account._count?.mobileServices ?? 0 },
                    { label: 'Broadband', value: account._count?.broadbandServices ?? 0 },
                  ].map((s) => (
                    <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
                      <p className="text-xs text-muted">{s.label}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'contacts' && <ContactsPanel accountId={id} />}
            {tab === 'sites' && <SitesPanel accountId={id} />}
            {tab === 'timeline' && <TimelinePanel accountId={id} />}
          </div>
        )}
      </div>
    </AppShell>
  );
}
