'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { deskApi, type TicketCategory, type TicketPriority } from '../../../lib/api';

const NAV_GROUPS = [
  { label: 'Desk', items: [
    { href: '/', label: 'Dashboard', exactMatch: true },
    { href: '/tickets', label: 'Tickets' },
  ]},
];

const PRIORITIES: TicketPriority[] = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
const CATEGORIES: TicketCategory[] = ['GENERAL', 'BILLING', 'MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'ACCOUNT'];

const INP  = 'w-full rounded-xl border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30';
const SEL  = `${INP} cursor-pointer`;
const LBL  = 'block text-xs font-semibold text-foreground mb-1';

export default function NewTicketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    accountId:   '',
    contactId:   '',
    siteId:      '',
    subject:     '',
    description: '',
    category:    'GENERAL' as TicketCategory,
    priority:    'NORMAL' as TicketPriority,
    message:     '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await deskApi.createTicket({
        accountId:   form.accountId,
        contactId:   form.contactId || undefined,
        siteId:      form.siteId    || undefined,
        subject:     form.subject,
        description: form.description || undefined,
        category:    form.category,
        priority:    form.priority,
        message:     form.message || undefined,
      });
      router.push(`/tickets/${res.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Desk' }} workspace="desk">
      <div className="p-5 max-w-2xl mx-auto space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted">
          <Link href="/tickets" className="hover:text-foreground">Tickets</Link>
          <span>/</span>
          <span className="text-foreground font-medium">New Ticket</span>
        </nav>

        <div>
          <h1 className="text-lg font-bold text-foreground">Create Support Ticket</h1>
          <p className="text-xs text-muted mt-0.5">Raise a new support ticket for a business account.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">

          {/* Account ID */}
          <div>
            <label className={LBL} htmlFor="accountId">Account ID <span className="text-danger">*</span></label>
            <input id="accountId" required value={form.accountId} onChange={(e) => set('accountId', e.target.value)}
              placeholder="cuid..." className={INP} />
            <p className="text-xs text-muted mt-1">Paste the BusinessAccount ID from the CRM.</p>
          </div>

          {/* Contact + Site (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL} htmlFor="contactId">Contact ID</label>
              <input id="contactId" value={form.contactId} onChange={(e) => set('contactId', e.target.value)}
                placeholder="Optional" className={INP} />
            </div>
            <div>
              <label className={LBL} htmlFor="siteId">Site ID</label>
              <input id="siteId" value={form.siteId} onChange={(e) => set('siteId', e.target.value)}
                placeholder="Optional" className={INP} />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className={LBL} htmlFor="subject">Subject <span className="text-danger">*</span></label>
            <input id="subject" required value={form.subject} onChange={(e) => set('subject', e.target.value)}
              placeholder="Brief description of the issue" className={INP} />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL} htmlFor="category">Category</label>
              <select id="category" value={form.category} onChange={(e) => set('category', e.target.value)} className={SEL}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL} htmlFor="priority">Priority</label>
              <select id="priority" value={form.priority} onChange={(e) => set('priority', e.target.value)} className={SEL}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LBL} htmlFor="description">Description</label>
            <textarea id="description" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Full details about the issue (optional)…" className={INP} />
          </div>

          {/* First message */}
          <div>
            <label className={LBL} htmlFor="message">Initial Message</label>
            <textarea id="message" rows={4} value={form.message} onChange={(e) => set('message', e.target.value)}
              placeholder="First reply / customer-visible message (optional)…" className={INP} />
            <p className="text-xs text-muted mt-1">This will be posted as the first customer-visible thread entry.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 gap-3">
            <Link href="/tickets" className="text-xs text-muted hover:text-foreground">Cancel</Link>
            <button type="submit" disabled={saving || !form.accountId || !form.subject}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
