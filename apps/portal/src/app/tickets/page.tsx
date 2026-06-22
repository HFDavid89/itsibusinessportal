'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable, FilterBar, LoadErrorPanel, LoadingList, StatusPill } from '@itsi-business/ui';
import { PortalPage } from '../../components/PortalPage';
import { PortalHero } from '../../components/portal-ui/portal-cockpit';
import { portalApi, TICKET_STATUS_LABELS, type PortalTicketSummary } from '../../lib/api';
import { TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, ticketContextLabel } from '../../lib/labels';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'WAITING_CUSTOMER', label: 'Awaiting you' },
  { value: 'WAITING_INTERNAL', label: 'Being reviewed' },
  { value: 'WAITING_ITSI_MOBILE', label: 'With provisioning' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  ...Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  ...Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
];

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (status === 'OPEN' || status === 'WAITING_CUSTOMER') return 'warning';
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'WAITING_ITSI_MOBILE') return 'info';
  return 'default';
}

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showNew = searchParams.get('new') === '1';
  const defaultCategory = searchParams.get('category') ?? 'GENERAL';

  const [tickets, setTickets] = useState<PortalTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(showNew);
  const [form, setForm] = useState({ subject: '', description: '', category: defaultCategory, priority: 'NORMAL' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    portalApi.tickets({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      priority: priorityFilter || undefined,
    })
      .then((r) => setTickets(r.data))
      .catch(() => setError('Unable to load tickets.'))
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, priorityFilter]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      t.subject.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q),
    );
  }, [tickets, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setShowForm(showNew); }, [showNew]);

  const openCount = useMemo(() => tickets.filter((t) => !['CLOSED', 'RESOLVED'].includes(t.status)).length, [tickets]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const ticket = await portalApi.createTicket({ ...form, message: form.description });
      setShowForm(false);
      setForm({ subject: '', description: '', category: 'GENERAL', priority: 'NORMAL' });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalPage title="Support tickets" subtitle={`${tickets.length} tickets`}>
      <div className="max-w-6xl mx-auto space-y-5">
        <PortalHero
          eyebrow="Help centre"
          title="Support tickets"
          subtitle="Raise a request or follow up on an existing conversation."
          badges={openCount > 0 ? <StatusPill tone="warning" dot>{openCount} open</StatusPill> : undefined}
          actions={
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold"
            >
              {showForm ? 'Cancel' : '+ Raise ticket'}
            </button>
          }
        />

        {error && <LoadErrorPanel message={error} onRetry={load} />}

        {showForm && (
          <div className="rounded-2xl border border-border bg-surface-raised p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">New support ticket</h2>
            {formError && <p className="text-sm text-danger mb-2">{formError}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              <textarea required placeholder="Describe your issue" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              <div className="flex flex-wrap gap-2">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  {CATEGORY_OPTIONS.filter((o) => o.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  {PRIORITY_OPTIONS.filter((o) => o.value).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold disabled:opacity-50">
                {saving ? 'Submitting…' : 'Submit ticket'}
              </button>
            </form>
          </div>
        )}

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search ticket number or subject…"
          filters={[
            { id: 'status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
            { id: 'category', value: categoryFilter, onChange: setCategoryFilter, options: CATEGORY_OPTIONS },
            { id: 'priority', value: priorityFilter, onChange: setPriorityFilter, options: PRIORITY_OPTIONS },
          ]}
        />

        {loading ? (
          <LoadingList rows={5} />
        ) : (
          <DataTable
            rows={displayed}
            rowKey={(t) => t.id}
            emptyMessage="No support tickets yet. Raise one above if you need help."
            onRowClick={(t) => router.push(`/tickets/${t.id}`)}
            columns={[
              {
                key: 'ticket',
                header: 'Ticket',
                cell: (t) => (
                  <Link href={`/tickets/${t.id}`} className="font-mono font-semibold text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
                    {t.ticketNumber}
                  </Link>
                ),
              },
              {
                key: 'subject',
                header: 'Subject',
                cell: (t) => (
                  <div>
                    <p className="font-medium text-foreground">{t.subject}</p>
                    {ticketContextLabel(t.subject, t.category) && (
                      <p className="text-[10px] text-muted mt-0.5">{ticketContextLabel(t.subject, t.category)}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (t) => <StatusPill tone={statusTone(t.status)}>{TICKET_STATUS_LABELS[t.status] ?? t.status}</StatusPill>,
              },
              {
                key: 'priority',
                header: 'Priority',
                cell: (t) => TICKET_PRIORITY_LABELS[t.priority] ?? t.priority,
              },
              {
                key: 'category',
                header: 'Category',
                cell: (t) => TICKET_CATEGORY_LABELS[t.category ?? 'GENERAL'] ?? t.category,
              },
            ]}
          />
        )}
      </div>
    </PortalPage>
  );
}
