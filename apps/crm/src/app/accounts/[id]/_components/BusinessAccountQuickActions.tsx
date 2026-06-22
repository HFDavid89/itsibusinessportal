'use client';

import { WORKSPACE_URLS } from '@itsi-business/staff-shell';

interface BusinessAccountQuickActionsProps {
  accountId: string;
  onTabChange: (tab: 'contacts' | 'sites' | 'services' | 'energy') => void;
}

const BTN = 'text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-raised transition-colors text-foreground';

export function BusinessAccountQuickActions({ accountId, onTabChange }: BusinessAccountQuickActionsProps) {
  const deskNew = `${WORKSPACE_URLS.desk}/tickets/new?accountId=${accountId}`;
  const deskFiltered = `${WORKSPACE_URLS.desk}/tickets?accountId=${accountId}`;
  const billingFiltered = `${WORKSPACE_URLS.billing}/invoices?accountId=${accountId}`;
  const workQueueFiltered = `${WORKSPACE_URLS.services}/work-queue?accountId=${accountId}`;
  const servicesNew = `${WORKSPACE_URLS.services}/records/new?accountId=${accountId}`;

  return (
    <div className="cockpit-card">
      <div className="cockpit-card-header">
        <h3 className="text-sm font-bold text-foreground">Quick actions</h3>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onTabChange('contacts')} className={BTN}>Add contact</button>
        <button type="button" onClick={() => onTabChange('sites')} className={BTN}>Add site</button>
        <a href={deskNew} className={BTN}>Create ticket</a>
        <a href={servicesNew} className={BTN}>Create service</a>
        <button type="button" onClick={() => onTabChange('energy')} className={BTN}>Energy review</button>
        <a href={workQueueFiltered} className={BTN}>Work queue</a>
        <a href={billingFiltered} className={BTN}>Billing</a>
        <a href={deskFiltered} className={BTN}>Open tickets</a>
      </div>
    </div>
  );
}
