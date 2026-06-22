'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LoadErrorPanel, LoadingList, StatusPill } from '@itsi-business/ui';
import { PortalPage } from '../../../components/PortalPage';
import { PortalHero, PortalPanel } from '../../../components/portal-ui/portal-cockpit';
import { portalApi, TICKET_STATUS_LABELS, type PortalTicketDetail } from '../../../lib/api';
import { TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, ticketContextLabel } from '../../../lib/labels';

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (status === 'OPEN' || status === 'WAITING_CUSTOMER') return 'warning';
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'WAITING_ITSI_MOBILE') return 'info';
  return 'default';
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<PortalTicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    setLoading(true);
    portalApi.ticket(id)
      .then(setTicket)
      .catch(() => setError('Ticket not found'))
      .finally(() => setLoading(false));
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

  const context = ticket ? ticketContextLabel(ticket.subject, ticket.category) : null;

  return (
    <PortalPage title={ticket?.subject ?? 'Ticket'} subtitle={ticket?.ticketNumber}>
      <div className="max-w-3xl mx-auto space-y-5">
        <Link href="/tickets" className="text-xs text-muted hover:text-foreground">← Back to tickets</Link>

        {error && !ticket && <LoadErrorPanel message={error} />}
        {loading && <LoadingList rows={3} />}

        {ticket && (
          <>
            <PortalHero
              eyebrow="Support ticket"
              title={ticket.subject}
              subtitle={ticket.ticketNumber}
              badges={<StatusPill tone={statusTone(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}</StatusPill>}
            />

            <PortalPanel title="Ticket details">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[10px] uppercase text-muted font-bold">Category</dt><dd className="mt-1">{TICKET_CATEGORY_LABELS[ticket.category ?? 'GENERAL'] ?? ticket.category}</dd></div>
                <div><dt className="text-[10px] uppercase text-muted font-bold">Priority</dt><dd className="mt-1">{TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</dd></div>
                {context && (
                  <div className="col-span-2">
                    <dt className="text-[10px] uppercase text-muted font-bold">Context</dt>
                    <dd className="mt-1">{context}</dd>
                  </div>
                )}
              </dl>
              {ticket.description && (
                <p className="text-sm text-foreground mt-4 leading-relaxed whitespace-pre-wrap border-t border-border pt-4">{ticket.description}</p>
              )}
            </PortalPanel>

            <PortalPanel title="Conversation">
              {ticket.threads.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {ticket.threads.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-xl border px-4 py-3 ${
                        t.authorType === 'PORTAL_USER'
                          ? 'border-accent/25 bg-accent/5'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase text-muted mb-1">
                        {t.authorType === 'PORTAL_USER' ? 'You' : 'Support team'} · {new Date(t.createdAt).toLocaleString('en-GB')}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{t.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </PortalPanel>

            {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
              <PortalPanel title="Add reply">
                {error && <p className="text-sm text-danger mb-2">{error}</p>}
                <form onSubmit={handleReply} className="space-y-3">
                  <textarea
                    required
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your message…"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground"
                  />
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold disabled:opacity-50">
                    {saving ? 'Sending…' : 'Send reply'}
                  </button>
                </form>
              </PortalPanel>
            )}
          </>
        )}
      </div>
    </PortalPage>
  );
}
