'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import { deskApi, type BusinessTicket, type BusinessTicketThread, type TicketStatus, type TicketPriority, type TicketCategory } from '../../../lib/api';

const NAV_GROUPS = [
  { label: 'Desk', items: [
    { href: '/', label: 'Dashboard', exactMatch: true },
    { href: '/tickets', label: 'Tickets' },
  ]},
];

const STATUS_CLS: Record<string, string> = {
  OPEN:                'bg-blue-500/10 text-blue-600 border-blue-500/20',
  WAITING_CUSTOMER:    'bg-amber-500/10 text-amber-700 border-amber-500/20',
  WAITING_INTERNAL:    'bg-purple-500/10 text-purple-600 border-purple-500/20',
  WAITING_ITSI_MOBILE: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  RESOLVED:            'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  CLOSED:              'bg-border text-muted border-border',
};

const PRIORITY_CLS: Record<string, string> = {
  URGENT: 'text-danger font-semibold',
  HIGH:   'text-warning font-semibold',
  NORMAL: 'text-muted',
  LOW:    'text-muted',
};

const ALL_STATUSES:    TicketStatus[]  = ['OPEN', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'WAITING_ITSI_MOBILE', 'RESOLVED', 'CLOSED'];
const ALL_PRIORITIES:  TicketPriority[] = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
const ALL_CATEGORIES:  TicketCategory[] = ['GENERAL', 'BILLING', 'MOBILE', 'BROADBAND', 'ENERGY', 'SOFTWARE', 'ACCOUNT'];

const INP = 'w-full rounded-lg border border-border bg-background text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30';
const SEL = `${INP} cursor-pointer`;

type TabId = 'thread' | 'notes' | 'timeline';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${STATUS_CLS[status] ?? 'bg-border text-muted border-border'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Thread panel ──────────────────────────────────────────────────────────────

function ThreadPanel({ ticketId, accountId }: { ticketId: string; accountId: string }) {
  const [threads, setThreads] = useState<BusinessTicketThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    try {
      const res = await deskApi.threads(ticketId);
      setThreads(res.data.filter((t) => !t.isInternal));
    } catch {
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await deskApi.addThread(ticketId, body.trim());
      setThreads((prev) => [...prev, res.data]);
      setBody('');
    } catch {
      setError('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted">Loading thread…</div>;

  return (
    <div className="flex flex-col gap-4">
      {threads.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => (
            <div key={t.id} className={`rounded-xl border p-3 text-sm ${
              t.authorType === 'STAFF'
                ? 'bg-accent/5 border-accent/20 ml-8'
                : 'bg-surface border-border mr-8'
            }`}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {t.authorType === 'STAFF' ? 'Staff' : 'Customer'}
                </span>
                <span className="text-xs text-muted">{fmt(t.createdAt)}</span>
              </div>
              <p className="text-foreground whitespace-pre-wrap">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="border border-border rounded-xl overflow-hidden">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
          placeholder="Type a customer-visible reply…"
          className="w-full px-3 py-2.5 text-sm bg-background text-foreground resize-none focus:outline-none border-b border-border" />
        <div className="flex items-center justify-end px-3 py-2 bg-surface">
          <button onClick={send} disabled={sending || !body.trim()}
            className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Internal notes panel ──────────────────────────────────────────────────────

function NotesPanel({ ticketId }: { ticketId: string }) {
  const [notes, setNotes]   = useState<BusinessTicketThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    try {
      const res = await deskApi.threads(ticketId);
      setNotes(res.data.filter((t) => t.isInternal));
    } catch {
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await deskApi.addInternalNote(ticketId, body.trim());
      setNotes((prev) => [...prev, res.data]);
      setBody('');
    } catch {
      setError('Failed to save note');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted">Loading notes…</div>;

  return (
    <div className="flex flex-col gap-4">
      {notes.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">No internal notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-3 text-sm">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs font-semibold text-amber-700">Internal Note</span>
                <span className="text-xs text-muted">{fmt(n.createdAt)}</span>
              </div>
              <p className="text-foreground whitespace-pre-wrap">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="border border-amber-500/30 rounded-xl overflow-hidden">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
          placeholder="Add an internal note — not visible to the customer…"
          className="w-full px-3 py-2.5 text-sm bg-amber-50/30 dark:bg-amber-500/5 text-foreground resize-none focus:outline-none border-b border-amber-500/30" />
        <div className="flex items-center justify-end px-3 py-2 bg-surface">
          <button onClick={save} disabled={saving || !body.trim()}
            className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline panel ────────────────────────────────────────────────────────────

function TimelinePanel({ ticket }: { ticket: BusinessTicket }) {
  const [threads, setThreads] = useState<BusinessTicketThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deskApi.threads(ticket.id)
      .then((res) => setThreads(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticket.id]);

  if (loading) return <div className="p-6 text-sm text-muted">Loading timeline…</div>;

  const events = [
    { id: 'created', at: ticket.createdAt, label: 'Ticket created', note: ticket.ticketNumber },
    ...threads.map((t) => ({
      id: t.id,
      at: t.createdAt,
      label: t.isInternal ? 'Internal note added' : 'Reply posted',
      note: t.body.slice(0, 80) + (t.body.length > 80 ? '…' : ''),
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="relative pl-5 space-y-4">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
      {events.map((ev) => (
        <div key={ev.id} className="relative">
          <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-surface" />
          <p className="text-xs font-semibold text-foreground">{ev.label}</p>
          <p className="text-xs text-muted">{fmt(ev.at)}</p>
          {ev.note && <p className="text-xs text-muted mt-0.5 italic">{ev.note}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams();
  const id     = params?.id as string;

  const [ticket, setTicket]   = useState<BusinessTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [activeTab, setTab]   = useState<TabId>('thread');
  const [patching, setPatching] = useState(false);
  const [patchError, setPatchError] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalateMsg, setEscalateMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    deskApi.ticket(id)
      .then((res) => setTicket(res.data))
      .catch(() => setError('Ticket not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function patch(data: Partial<Pick<BusinessTicket, 'status' | 'priority' | 'category'>>) {
    if (!ticket) return;
    setPatching(true);
    setPatchError('');
    try {
      const res = await deskApi.updateTicket(ticket.id, data);
      setTicket((prev) => prev ? { ...prev, ...res.data } : prev);
    } catch {
      setPatchError('Failed to update ticket');
    } finally {
      setPatching(false);
    }
  }

  async function escalate() {
    if (!ticket) return;
    setEscalating(true);
    setEscalateMsg('');
    try {
      await deskApi.escalateToItsiMobile(ticket.id);
      setTicket((prev) => prev ? { ...prev, status: 'WAITING_ITSI_MOBILE' } : prev);
      setEscalateMsg('Escalation recorded. Status updated to WAITING_ITSI_MOBILE.');
    } catch (err: unknown) {
      setEscalateMsg(err instanceof Error ? err.message : 'Escalation not available.');
    } finally {
      setEscalating(false);
    }
  }

  if (loading) {
    return (
      <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Desk' }}>
        <div className="p-8 flex items-center justify-center text-sm text-muted">Loading ticket…</div>
      </AppShell>
    );
  }

  if (error || !ticket) {
    return (
      <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Desk' }}>
        <div className="p-8">
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error || 'Ticket not found'}</div>
          <Link href="/tickets" className="mt-4 inline-block text-xs text-accent hover:underline">← Back to Tickets</Link>
        </div>
      </AppShell>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'thread',   label: 'Customer Thread' },
    { id: 'notes',    label: 'Internal Notes' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Desk' }}>
      <div className="p-5 space-y-4 max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted">
          <Link href="/tickets" className="hover:text-foreground">Tickets</Link>
          <span>/</span>
          <span className="text-foreground font-mono font-semibold">{ticket.ticketNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground">{ticket.subject}</h1>
            <p className="text-xs text-muted mt-0.5">{ticket.account?.companyName} · {ticket.account?.accountNumber}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={ticket.status} />
            <span className={`text-xs font-semibold ${PRIORITY_CLS[ticket.priority] ?? 'text-muted'}`}>{ticket.priority}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Main: tabs */}
          <div className="lg:col-span-2 space-y-3">

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border pb-2">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setTab(tab.id)} type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:text-foreground hover:bg-surface-raised'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[300px]">
              {activeTab === 'thread'   && <ThreadPanel   ticketId={ticket.id} accountId={ticket.accountId} />}
              {activeTab === 'notes'    && <NotesPanel    ticketId={ticket.id} />}
              {activeTab === 'timeline' && <TimelinePanel ticket={ticket} />}
            </div>
          </div>

          {/* Sidebar: properties */}
          <div className="space-y-4">

            {/* Ticket properties */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Properties</h2>

              {patchError && <p className="text-xs text-danger">{patchError}</p>}

              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Status</p>
                <select value={ticket.status} disabled={patching}
                  onChange={(e) => patch({ status: e.target.value as TicketStatus })}
                  className={SEL}>
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Priority</p>
                <select value={ticket.priority} disabled={patching}
                  onChange={(e) => patch({ priority: e.target.value as TicketPriority })}
                  className={SEL}>
                  {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Category</p>
                <select value={ticket.category} disabled={patching}
                  onChange={(e) => patch({ category: e.target.value as TicketCategory })}
                  className={SEL}>
                  {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Ticket Number</p>
                <p className="text-sm font-mono text-foreground">{ticket.ticketNumber}</p>
              </div>

              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Created</p>
                <p className="text-xs text-foreground">{fmt(ticket.createdAt)}</p>
              </div>

              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Updated</p>
                <p className="text-xs text-foreground">{fmt(ticket.updatedAt)}</p>
              </div>

              {ticket.site && (
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Site</p>
                  <p className="text-xs text-foreground">{ticket.site.name}</p>
                  <p className="text-xs text-muted">{ticket.site.addressLine1}, {ticket.site.postcode}</p>
                </div>
              )}

              {ticket.description && (
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Description</p>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{ticket.description}</p>
                </div>
              )}
            </div>

            {/* Escalation — placeholder */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Escalation</h2>
              <p className="text-xs text-muted">
                Escalate to Itsi Mobile wholesale desk when a provider-side fault requires intervention.
                The escalation route is a placeholder until <code className="text-[10px] bg-surface-raised px-1 rounded">ITSI_MOBILE_WHOLESALE_ENABLED=true</code>.
              </p>
              {escalateMsg && (
                <p className={`text-xs ${escalateMsg.startsWith('Failed') || escalateMsg.includes('not available') ? 'text-danger' : 'text-emerald-600'}`}>
                  {escalateMsg}
                </p>
              )}
              <button onClick={escalate} disabled={escalating || ticket.status === 'WAITING_ITSI_MOBILE' || ticket.status === 'CLOSED'}
                className="w-full py-2 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-600 text-xs font-bold hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {escalating ? 'Escalating…' : ticket.status === 'WAITING_ITSI_MOBILE' ? 'Already Escalated' : 'Escalate to Itsi Mobile'}
              </button>
            </div>

            {/* CRM link */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Account</h2>
              <p className="text-sm font-semibold text-foreground">{ticket.account?.companyName}</p>
              <p className="text-xs text-muted font-mono">{ticket.account?.accountNumber}</p>
              <a href={`http://localhost:4006/accounts/${ticket.accountId}`} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-accent hover:underline">
                View in CRM →
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
