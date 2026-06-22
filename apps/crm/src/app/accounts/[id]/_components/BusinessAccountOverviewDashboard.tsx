'use client';

import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import type { BusinessAccount, BusinessInvoice, BusinessService } from '../../../../lib/api';
import type { AccountOverviewData, AccountTab } from './account-types';
import { NextActionPanel } from './NextActionPanel';
import { RelatedRecordsPanel } from '@itsi-business/ui';

const EVENT_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: 'Account created',
  ACCOUNT_UPDATED: 'Account updated',
  CONTACT_ADDED: 'Contact added',
  CONTACT_UPDATED: 'Contact updated',
  SITE_ADDED: 'Site added',
  SITE_UPDATED: 'Site updated',
  ENERGY_REFERRED_TO_FIDELITY: 'Energy referred to Fidelity',
  ENERGY_CONTRACTED: 'Energy contract recorded',
  ENERGY_CHECK_IN_COMPLETED: 'Energy check-in completed',
  ENERGY_MARKED_LOST: 'Energy opportunity marked lost',
  ENERGY_RENEWAL_WINDOW_STARTED: 'Energy renewal window started',
  ENERGY_SERVICE_CREATED: 'Energy record created',
  ENERGY_SERVICE_UPDATED: 'Energy record updated',
};

function fmt(pence: number) { return `£${(pence / 100).toFixed(2)}`; }

interface SnapshotProps {
  title: string;
  icon: React.ReactNode;
  onViewAll: () => void;
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  emptyCta?: { label: string; onClick: () => void };
}

function SnapshotCard({ title, icon, onViewAll, children, empty, emptyMessage, emptyCta }: SnapshotProps) {
  return (
    <div className="cockpit-card h-full flex flex-col">
      <div className="cockpit-card-header">
        <div className="flex items-center gap-2.5">
          <span className="cockpit-card-icon">{icon}</span>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
        <button type="button" onClick={onViewAll} className="text-[11px] font-bold text-accent hover:underline shrink-0">
          View all →
        </button>
      </div>
      <div className="p-4 flex-1">
        {empty ? (
          <div className="cockpit-empty-panel">
            <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
            {emptyCta && (
              <button type="button" onClick={emptyCta.onClick} className="btn-aurora text-xs font-bold px-4 py-2 rounded-lg">
                {emptyCta.label}
              </button>
            )}
          </div>
        ) : children}
      </div>
    </div>
  );
}

function SnapshotStat({ label, value, status }: { label: string; value: number | string; status: 'healthy' | 'warning' | 'danger' }) {
  return (
    <div className={`snapshot-stat snapshot-stat--${status}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

export interface BusinessAccountOverviewDashboardProps {
  account: BusinessAccount;
  overview: AccountOverviewData | null;
  onTabChange: (tab: AccountTab) => void;
}

export function BusinessAccountOverviewDashboard({ account, overview, onTabChange }: BusinessAccountOverviewDashboardProps) {
  const services = overview?.services ?? [];
  const invoices = overview?.invoices ?? [];
  const activeServices = services.filter((s) => s.status === 'ACTIVE');
  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
  const openTicketCount = overview?.openTickets.length ?? account._count?.tickets ?? 0;
  const openWorkItems = overview?.openWorkItems ?? [];
  const contactCount = account._count?.contacts ?? account.contacts?.length ?? 0;
  const siteCount = account._count?.sites ?? account.sites?.length ?? 0;

  const paidTotal = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalPence, 0);
  const latestInvoice = invoices[0];

  return (
    <div className="space-y-5">
      <NextActionPanel
        accountId={account.id}
        accountStatus={account.status}
        overdueInvoices={{
          count: overdueInvoices.length,
          totalPence: overdueInvoices.reduce((s, i) => s + i.totalPence, 0),
        }}
        openTickets={openTicketCount}
        contactCount={contactCount}
        siteCount={siteCount}
        serviceCount={services.length}
        activeServiceCount={activeServices.length}
        onTabChange={onTabChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SnapshotCard
          title="Service snapshot"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          onViewAll={() => onTabChange('services')}
          empty={services.length === 0}
          emptyMessage="No services on this account"
          emptyCta={{ label: 'View services →', onClick: () => onTabChange('services') }}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <SnapshotStat label="Active" value={activeServices.length} status={activeServices.length > 0 ? 'healthy' : 'warning'} />
              <SnapshotStat label="Total" value={services.length} status={services.length > 0 ? 'healthy' : 'warning'} />
            </div>
            {services.slice(0, 3).map((svc) => (
              <ServiceRow key={svc.id} svc={svc} />
            ))}
            {services.length > 3 && (
              <button type="button" onClick={() => onTabChange('services')} className="text-xs font-semibold text-accent hover:underline">
                + {services.length - 3} more services
              </button>
            )}
          </div>
        </SnapshotCard>

        <SnapshotCard
          title="Billing snapshot"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
          onViewAll={() => onTabChange('invoices')}
          empty={invoices.length === 0}
          emptyMessage="No invoices issued yet"
          emptyCta={{ label: 'View invoices →', onClick: () => onTabChange('invoices') }}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <SnapshotStat label="Overdue" value={overdueInvoices.length} status={overdueInvoices.length > 0 ? 'danger' : 'healthy'} />
              <SnapshotStat label="Paid total" value={paidTotal > 0 ? fmt(paidTotal) : '—'} status={paidTotal > 0 ? 'healthy' : 'warning'} />
            </div>
            {latestInvoice && (
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <p className="text-xs font-semibold text-foreground font-mono">{latestInvoice.invoiceNumber}</p>
                <p className="text-[11px] text-muted mt-0.5">{fmt(latestInvoice.totalPence)} · {latestInvoice.status.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </SnapshotCard>

        <SnapshotCard
          title="Activity snapshot"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          onViewAll={() => onTabChange('timeline')}
          empty={(overview?.recentTimeline.length ?? 0) === 0}
          emptyMessage="No activity recorded yet"
          emptyCta={{ label: 'View timeline →', onClick: () => onTabChange('timeline') }}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <SnapshotStat label="Open tickets" value={openTicketCount} status={openTicketCount > 0 ? 'warning' : 'healthy'} />
              <SnapshotStat label="Events" value={overview?.timelineCount ?? 0} status="healthy" />
            </div>
            {(overview?.recentTimeline ?? []).slice(0, 3).map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border bg-surface px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{EVENT_LABELS[ev.type] ?? ev.type}</p>
                <p className="text-[11px] text-muted mt-0.5">
                  {new Date(ev.occurredAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </SnapshotCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RelatedRecordsPanel
          title="Open tickets"
          actionLabel="View in Desk →"
          actionHref={`${WORKSPACE_URLS.desk}/tickets?accountId=${account.id}`}
          emptyMessage="No open support tickets for this account."
          items={(overview?.openTickets ?? []).map((t) => ({
            id: t.id,
            title: t.subject,
            meta: `${t.ticketNumber} · ${t.status.replace(/_/g, ' ')} · ${t.priority}`,
            href: `${WORKSPACE_URLS.desk}/tickets/${t.id}`,
          }))}
        />
        <RelatedRecordsPanel
          title="Open work items"
          actionLabel="View work queue →"
          actionHref={`${WORKSPACE_URLS.services}/work-queue?accountId=${account.id}`}
          emptyMessage="No open staff work items for this account."
          items={openWorkItems.map((w) => ({
            id: w.id,
            title: w.title,
            meta: `${w.type.replace(/_/g, ' ')} · ${w.status.replace(/_/g, ' ')}${w.dueAt ? ` · due ${new Date(w.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}`,
            href: `${WORKSPACE_URLS.services}/work-queue/${w.id}`,
            badge: w.slaStatus === 'BREACHED' ? (
              <span className="text-[10px] font-bold text-danger">SLA breached</span>
            ) : w.slaStatus === 'DUE_SOON' ? (
              <span className="text-[10px] font-bold text-warning">Due soon</span>
            ) : undefined,
          }))}
        />
      </div>
    </div>
  );
}

function ServiceRow({ svc }: { svc: BusinessService }) {
  const statusCls = svc.status === 'ACTIVE'
    ? 'border-success/40 text-success bg-success/10'
    : 'border-muted/40 text-muted bg-muted/10';

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <span className="text-xs font-semibold text-foreground truncate">{svc.displayName}</span>
      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCls}`}>{svc.status}</span>
    </div>
  );
}
