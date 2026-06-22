'use client';

import { useEffect, useState } from 'react';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import { RelatedRecordsPanel } from '@itsi-business/ui';
import { workItemsApi, type WorkItem } from '../lib/api';

const SLA_CLS: Record<string, string> = {
  ON_TRACK: 'text-success',
  DUE_SOON: 'text-warning',
  BREACHED: 'text-danger',
};

export function WorkItemsPanel({
  accountId,
  serviceId,
  ticketId,
  title = 'Work items',
}: {
  accountId?: string;
  serviceId?: string;
  ticketId?: string;
  title?: string;
}) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string> = { limit: '10' };
    if (accountId) params.accountId = accountId;
    if (serviceId) params.serviceId = serviceId;
    if (ticketId) params.ticketId = ticketId;
    workItemsApi.list(params)
      .then((res) => setItems(res.data.filter((w) => !['RESOLVED', 'CANCELLED'].includes(w.status))))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [accountId, serviceId, ticketId]);

  const queueHref = accountId
    ? `${WORKSPACE_URLS.services}/work-queue?accountId=${accountId}`
    : `${WORKSPACE_URLS.services}/work-queue`;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface-raised p-4 text-sm text-muted text-center">
        Loading work items…
      </div>
    );
  }

  return (
    <RelatedRecordsPanel
      title={title}
      actionLabel="View queue →"
      actionHref={queueHref}
      emptyMessage="No open work items linked to this record."
      items={items.map((w) => ({
        id: w.id,
        title: w.title,
        meta: `${w.type.replace(/_/g, ' ')} · ${w.status.replace(/_/g, ' ')}`,
        href: `/work-queue/${w.id}`,
        badge: w.slaStatus ? (
          <span className={`text-[10px] font-bold ${SLA_CLS[w.slaStatus] ?? 'text-muted'}`}>{w.slaStatus.replace(/_/g, ' ')}</span>
        ) : undefined,
      }))}
    />
  );
}
