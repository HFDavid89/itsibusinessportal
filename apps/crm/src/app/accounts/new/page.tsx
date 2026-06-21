'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { crmApi, type CreateAccountInput } from '../../../lib/api';

const NAV_GROUPS = [
  {
    label: 'CRM',
    items: [
      { href: '/', label: 'Dashboard' },
      { href: '/accounts', label: 'Business Accounts' },
    ],
  },
];

const INP = 'w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30';

export default function NewAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateAccountInput>({
    companyName: '',
    tradingName: '',
    companyNumber: '',
    vatNumber: '',
    status: 'PROSPECT',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof CreateAccountInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError('Company name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await crmApi.createAccount({
        companyName: form.companyName.trim(),
        tradingName: form.tradingName?.trim() || undefined,
        companyNumber: form.companyNumber?.trim() || undefined,
        vatNumber: form.vatNumber?.trim() || undefined,
        status: form.status,
      });
      router.push(`/accounts/${res.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'CRM' }}>
      <div className="max-w-[640px] mx-auto p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted mb-6">
          <Link href="/accounts" className="hover:text-accent transition-colors">Business Accounts</Link>
          <span>/</span>
          <span className="text-foreground font-medium">New Account</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h1 className="text-base font-bold text-foreground">Create Business Account</h1>
            <p className="text-xs text-muted mt-0.5">Add a new business customer to the CRM</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
            )}

            {/* Company name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Company Name <span className="text-danger">*</span>
              </label>
              <input
                value={form.companyName}
                onChange={set('companyName')}
                placeholder="Acme Ltd"
                className={INP}
                autoFocus
              />
            </div>

            {/* Trading name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Trading Name <span className="text-muted font-normal normal-case">(if different)</span>
              </label>
              <input
                value={form.tradingName ?? ''}
                onChange={set('tradingName')}
                placeholder="Acme"
                className={INP}
              />
            </div>

            {/* Company number / VAT — two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                  Companies House No.
                </label>
                <input
                  value={form.companyNumber ?? ''}
                  onChange={set('companyNumber')}
                  placeholder="12345678"
                  className={INP}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                  VAT Number
                </label>
                <input
                  value={form.vatNumber ?? ''}
                  onChange={set('vatNumber')}
                  placeholder="GB123456789"
                  className={INP}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Initial Status
              </label>
              <select value={form.status} onChange={set('status')} className={INP}>
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE">Active</option>
              </select>
              <p className="text-[11px] text-muted">New accounts are usually Prospect until onboarding is complete.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <Link
                href="/accounts"
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-foreground text-center transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || !form.companyName.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              >
                {saving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating…
                  </>
                ) : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
