'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell, SERVICES_NAV_GROUPS, WORKSPACE_URLS } from '@itsi-business/staff-shell';
import { useAuth } from '@itsi-business/staff-shell';
import { workItemsApi, type WorkItem } from '../../../lib/api';

const SLA_CLS: Record<string, string> = {
  ON_TRACK: 'text-success border-success/30 bg-success/10',
  DUE_SOON: 'text-warning border-warning/30 bg-warning/10',
  BREACHED: 'text-danger border-danger/30 bg-danger/10',
  COMPLETED: 'text-muted border-border bg-surface-raised',
};

export default function WorkItemDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await workItemsApi.get(params.id);
      setItem(res.data);
    } catch {
      setError('Work item not found');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function act(action: 'start' | 'resolve' | 'assign') {
    if (!item) return;
    setActing(action);
    try {
      if (action === 'start') await workItemsApi.start(item.id);
      if (action === 'resolve') await workItemsApi.resolve(item.id);
      if (action === 'assign' && user?.id) await workItemsApi.assign(item.id, user.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing('');
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !comment.trim()) return;
    setActing('comment');
    try {
      await workItemsApi.comment(item.id, comment.trim());
      setComment('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setActing('');
    }
  }

  if (loading) {
    return (
      <AppShell navGroups={SERVICES_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
        <div className="p-8 text-sm text-muted">Loading work item…</div>
      </AppShell>
    );
  }

  if (error || !item) {
    return (
      <AppShell navGroups={SERVICES_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
        <div className="p-8">
          <p className="text-sm text-danger">{error || 'Not found'}</p>
          <Link href="/work-queue" className="text-xs text-accent hover:underline mt-2 inline-block">← Work Queue</Link>
        </div>
      </AppShell>
    );
  }

  const sla = item.slaStatus ?? 'ON_TRACK';

  return (
    <AppShell navGroups={SERVICES_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }} workspace="services">
      <div className="p-5 max-w-4xl mx-auto space-y-5">
        <nav className="text-xs text-muted flex items-center gap-2">
          <Link href="/work-queue" className="hover:text-foreground">Work Queue</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{item.title}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">{item.title}</h1>
            <p className="text-sm text-muted mt-1">{item.type.replace(/_/g, ' ')} · {item.source}</p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${SLA_CLS[sla]}`}>{sla.replace('_', ' ')}</span>
        </div>

        {item.description && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">{item.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-border p-3"><p className="text-muted">Status</p><p className="font-semibold text-foreground mt-1">{item.status.replace(/_/g, ' ')}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-muted">Priority</p><p className="font-semibold text-foreground mt-1">{item.priority}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-muted">Due</p><p className="font-semibold text-foreground mt-1">{item.dueAt ? new Date(item.dueAt).toLocaleString('en-GB') : '—'}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-muted">Account</p><p className="font-semibold text-foreground mt-1">{item.account?.companyName ?? '—'}</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.status !== 'RESOLVED' && item.status !== 'CANCELLED' && (
            <>
              <button type="button" disabled={!!acting} onClick={() => act('start')} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-surface-raised disabled:opacity-50">Start</button>
              <button type="button" disabled={!!acting} onClick={() => act('assign')} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/5 text-accent disabled:opacity-50">Assign to me</button>
              <button type="button" disabled={!!acting} onClick={() => act('resolve')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-accent-foreground disabled:opacity-50">Resolve</button>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Related links</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {item.account && (
              <a href={`${WORKSPACE_URLS.crm}/accounts/${item.accountId}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">CRM account →</a>
            )}
            {item.ticket && (
              <a href={`${WORKSPACE_URLS.desk}/tickets/${item.ticket.id}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Desk ticket {item.ticket.ticketNumber} →</a>
            )}
            {item.serviceId && (
              <Link href={`/records/${item.serviceId}`} className="text-accent hover:underline">Service record →</Link>
            )}
          </div>
          {item.wholesaleLink && (
            <p className="text-xs text-muted">
              Wholesale link: {item.wholesaleLink.status} · {item.wholesaleLink.businessServiceReference}
              {item.wholesaleLink.itsiMobileWholesaleOrderId && ` · Order ${item.wholesaleLink.itsiMobileWholesaleOrderId}`}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Internal comments</p>
          {(item.comments ?? []).length === 0 ? (
            <p className="text-sm text-muted">No internal comments yet.</p>
          ) : (
            <div className="space-y-2">
              {item.comments!.map((c) => (
                <div key={c.id} className="rounded-lg bg-surface-raised px-3 py-2">
                  <p className="text-sm text-foreground">{c.body}</p>
                  <p className="text-[10px] text-muted mt-1">{new Date(c.createdAt).toLocaleString('en-GB')}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={sendComment} className="flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add internal note…" className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background" />
            <button type="submit" disabled={acting === 'comment' || !comment.trim()} className="text-xs font-semibold px-3 py-2 rounded-lg bg-accent text-accent-foreground disabled:opacity-50">Add</button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
