'use client';

import { useState } from 'react';
import { Panel } from './PortalPage';

export function RequestSupportModal({
  title,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (message: string) => Promise<{ ticketNumber?: string }>;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    setError('');
    try {
      const result = await onSubmit(message.trim());
      setDone(result.ticketNumber ? `Request submitted (${result.ticketNumber})` : 'Request submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480 }}>
        <Panel>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title}</h2>
          {done ? (
            <>
              <p style={{ fontSize: '0.85rem', color: 'rgb(var(--success, 34 197 94))' }}>{done}</p>
              <button type="button" onClick={onClose} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <p style={{ color: 'rgb(var(--danger))', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what you need help with…"
                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
                <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Submitting…' : submitLabel}
                </button>
                <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'transparent', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}

export const PORTAL_ROLE_LABELS: Record<string, string> = {
  ACCOUNT_ADMIN: 'Account admin',
  BILLING_CONTACT: 'Billing contact',
  TECHNICAL_CONTACT: 'Technical contact',
  READ_ONLY: 'Read only',
};

export const NETWORK_CONTROL_ACTIONS = [
  { label: 'Bar SIM', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
  { label: 'Unbar SIM', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
  { label: 'SIM swap', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
  { label: 'Enable roaming', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
  { label: 'Change spend cap', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
  { label: 'PAC / STAC', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
  { label: 'Replacement SIM', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
  { label: 'Tariff change', reason: 'Live network changes are blocked until staging E2E passes — raise a support ticket to request this change.' },
] as const;
