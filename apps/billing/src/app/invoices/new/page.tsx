'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import { billingApi } from '../../../lib/api';

const NAV_GROUPS = [
  { label: 'Billing', items: [
    { href: '/', label: 'Dashboard', exactMatch: true },
    { href: '/invoices', label: 'Invoices' },
  ]},
];

const INP = 'w-full rounded-xl border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30';
const LBL = 'block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5';

export default function NewInvoicePage() {
  const router = useRouter();

  const [accountId, setAccountId] = useState('');
  const [dueDate,   setDueDate]   = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId.trim()) { setError('Account ID is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await billingApi.createInvoice({
        accountId: accountId.trim(),
        dueDate:   dueDate ? new Date(dueDate).toISOString() : undefined,
        notes:     notes.trim() || undefined,
      });
      router.push(`/invoices/${res.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create invoice');
      setSaving(false);
    }
  }

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Billing' }}>
      <div className="p-5 max-w-xl mx-auto">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-foreground">New Invoice</h1>
          <p className="text-xs text-muted mt-0.5">
            Creates a DRAFT invoice. Add line items on the next screen before issuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">{error}</div>
          )}

          <div>
            <label className={LBL} htmlFor="accountId">Business Account ID *</label>
            <input id="accountId" type="text" value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className={INP} placeholder="cuid of the BusinessAccount (e.g. cl…)" required />
            <p className="text-[11px] text-muted mt-1">The account this invoice belongs to.</p>
          </div>

          <div>
            <label className={LBL} htmlFor="dueDate">Due Date</label>
            <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className={INP} />
            <p className="text-[11px] text-muted mt-1">Leave blank to set later. Required before issuing.</p>
          </div>

          <div>
            <label className={LBL} htmlFor="notes">Notes (internal)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
              className={`${INP} resize-none`} rows={3} placeholder="Optional internal note…" />
          </div>

          <div className="pt-1 flex items-center justify-end gap-3 border-t border-border">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Draft Invoice'}
            </button>
          </div>
        </form>

        <div className="mt-4 bg-surface border border-border/50 rounded-xl px-4 py-3 text-xs text-muted space-y-1">
          <p className="font-semibold text-foreground">Invoice lifecycle</p>
          <p><span className="font-semibold">DRAFT</span> → add line items → <span className="font-semibold">Issue</span> → <span className="font-semibold">Mark Paid</span></p>
          <p>Void is available for issued invoices that have not been paid.</p>
          <p>Line items can only be added/edited/deleted while the invoice is DRAFT.</p>
        </div>
      </div>
    </AppShell>
  );
}
