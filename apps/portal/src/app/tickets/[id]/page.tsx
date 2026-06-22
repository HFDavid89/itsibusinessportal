'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel } from '../../../components/PortalPage';
import { portalApi, TICKET_STATUS_LABELS, type PortalTicketDetail } from '../../../lib/api';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<PortalTicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    if (!id) return;
    portalApi.ticket(id).then(setTicket).catch(() => setError('Ticket not found'));
  };

  useEffect(() => { load(); }, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !reply.trim()) return;
    setSaving(true);
    setError('');
    try {
      await portalApi.replyToTicket(id, reply.trim());
      setReply('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalPage title={ticket?.subject ?? 'Ticket'} subtitle={ticket?.ticketNumber}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/tickets" style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))' }}>← Back to tickets</Link>

        {error && !ticket && <p style={{ color: 'rgb(var(--danger))' }}>{error}</p>}
        {!ticket && !error && <p style={{ color: 'rgb(var(--muted))' }}>Loading…</p>}

        {ticket && (
          <>
            <Panel>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1rem', fontWeight: 700 }}>{ticket.subject}</h1>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted))', marginTop: 4 }}>{ticket.ticketNumber} · {ticket.category}</p>
                </div>
                <StatusPill tone="info">{TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}</StatusPill>
              </div>
              {ticket.description && <p style={{ fontSize: '0.85rem', marginTop: '1rem', lineHeight: 1.6 }}>{ticket.description}</p>}
            </Panel>

            <Panel>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Conversation</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ticket.threads.map((t) => (
                  <div key={t.id} style={{ padding: '0.75rem', borderRadius: 10, background: t.authorType === 'PORTAL_USER' ? 'rgb(var(--accent) / 0.08)' : 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <p style={{ fontSize: '0.65rem', color: 'rgb(var(--muted))', marginBottom: 4 }}>{t.authorType === 'PORTAL_USER' ? 'You' : 'Support'} · {new Date(t.createdAt).toLocaleString('en-GB')}</p>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{t.body}</p>
                  </div>
                ))}
              </div>
            </Panel>

            {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
              <Panel>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add reply</h2>
                {error && <p style={{ color: 'rgb(var(--danger))', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
                <form onSubmit={handleReply}>
                  <textarea required rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your message…" style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit', marginBottom: 8 }} />
                  <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', borderRadius: 10, background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    {saving ? 'Sending…' : 'Send reply'}
                  </button>
                </form>
              </Panel>
            )}
          </>
        )}
      </div>
    </PortalPage>
  );
}
