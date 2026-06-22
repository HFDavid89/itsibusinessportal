'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, EmptyState } from '../../components/PortalPage';
import { portalApi, TICKET_STATUS_LABELS, type PortalTicketSummary } from '../../lib/api';

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showNew = searchParams.get('new') === '1';

  const [tickets, setTickets] = useState<PortalTicketSummary[]>([]);
  const [showForm, setShowForm] = useState(showNew);
  const [form, setForm] = useState({ subject: '', description: '', category: 'GENERAL', priority: 'NORMAL' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => portalApi.tickets().then((r) => setTickets(r.data));

  useEffect(() => { load(); }, []);
  useEffect(() => { setShowForm(showNew); }, [showNew]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const ticket = await portalApi.createTicket({ ...form, message: form.description });
      setShowForm(false);
      setForm({ subject: '', description: '', category: 'GENERAL', priority: 'NORMAL' });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalPage title="Support tickets" subtitle={`${tickets.length} tickets`}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            style={{ padding: '0.5rem 1rem', borderRadius: 10, background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
          >
            {showForm ? 'Cancel' : '+ Raise ticket'}
          </button>
        </div>

        {showForm && (
          <Panel>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>New support ticket</h2>
            {error && <p style={{ color: 'rgb(var(--danger))', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
              <textarea required placeholder="Describe your issue" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ padding: '0.4rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }}>
                  {['GENERAL', 'BILLING', 'MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'ACCOUNT'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ padding: '0.4rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }}>
                  {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', borderRadius: 10, background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                {saving ? 'Submitting…' : 'Submit ticket'}
              </button>
            </form>
          </Panel>
        )}

        {!tickets.length ? (
          <EmptyState message="No support tickets yet." />
        ) : (
          <Panel>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'rgb(var(--muted))', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                  <th>Ticket</th><th>Subject</th><th>Status</th><th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                    <td style={{ padding: '0.5rem 0' }}>
                      <Link href={`/tickets/${t.id}`} style={{ color: 'rgb(var(--accent))', fontWeight: 600, textDecoration: 'none' }}>{t.ticketNumber}</Link>
                    </td>
                    <td>{t.subject}</td>
                    <td><StatusPill tone={t.status === 'OPEN' ? 'warning' : t.status === 'CLOSED' ? 'default' : 'info'}>{TICKET_STATUS_LABELS[t.status] ?? t.status}</StatusPill></td>
                    <td>{t.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    </PortalPage>
  );
}
