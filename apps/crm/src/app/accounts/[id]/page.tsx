'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@itsi-business/staff-shell';
import { crmApi, type BusinessAccount } from '../../../lib/api';
import type { AccountOverviewData, AccountTab } from './_components/account-types';
import { computeAccountHealth, primaryContact } from './_components/account-types';
import { BusinessAccountHero } from './_components/BusinessAccountHero';
import { BusinessAccountHealthSummary, buildBusinessHealthMetrics } from './_components/BusinessAccountHealthSummary';
import { BusinessAccountTabBar } from './_components/BusinessAccountTabBar';
import { BusinessAccountProfileRail } from './_components/BusinessAccountProfileRail';
import { BusinessAccountOverviewDashboard } from './_components/BusinessAccountOverviewDashboard';
import {
  ContactsPanel,
  SitesPanel,
  InvoicesPanel,
  ServicesPanel,
  EnergyPanel,
  TimelinePanel,
} from './_components/account-tab-panels';

const NAV_GROUPS = [
  {
    label: 'CRM',
    items: [
      { href: '/', label: 'Dashboard' },
      { href: '/accounts', label: 'Business Accounts' },
    ],
  },
];

function TabPanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cockpit-card">
      <div className="cockpit-card-header">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [account, setAccount] = useState<BusinessAccount | null>(null);
  const [overview, setOverview] = useState<AccountOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<AccountTab>('overview');
  const [copyToast, setCopyToast] = useState('');

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.account(id);
      setAccount(res.data);
    } catch {
      setError('Account not found or failed to load');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadOverview = useCallback(async () => {
    try {
      const [invoicesRes, servicesRes, timelineRes] = await Promise.all([
        crmApi.accountInvoices(id),
        crmApi.accountServices(id),
        crmApi.timeline(id),
      ]);
      setOverview({
        invoices: invoicesRes.data,
        services: servicesRes.data,
        timelineCount: timelineRes.data.length,
        recentTimeline: timelineRes.data.slice(0, 5).map((ev) => ({
          id: ev.id,
          type: ev.type,
          occurredAt: ev.occurredAt,
        })),
      });
    } catch {
      setOverview(null);
    }
  }, [id]);

  useEffect(() => { loadAccount(); }, [loadAccount]);
  useEffect(() => { if (account) loadOverview(); }, [account, loadOverview]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyToast('Copied');
      setTimeout(() => setCopyToast(''), 2000);
    }).catch(() => {});
  }, []);

  const health = useMemo(
    () => (account ? computeAccountHealth(account, overview) : null),
    [account, overview],
  );

  const healthMetrics = useMemo(() => {
    if (!account) return [];
    const services = overview?.services ?? [];
    const invoices = overview?.invoices ?? [];
    return buildBusinessHealthMetrics({
      serviceCount: services.length,
      activeServiceCount: services.filter((s) => s.status === 'ACTIVE').length,
      invoiceCount: invoices.length,
      overdueCount: invoices.filter((i) => i.status === 'OVERDUE').length,
      openTickets: account._count?.tickets ?? 0,
      contactCount: account._count?.contacts ?? account.contacts?.length ?? 0,
      siteCount: account._count?.sites ?? account.sites?.length ?? 0,
      accountStatus: account.status,
    });
  }, [account, overview]);

  const contact = account ? primaryContact(account) : null;

  const primaryTabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'contacts' as const, label: 'Contacts', count: account?._count?.contacts },
    { key: 'sites' as const, label: 'Sites', count: account?._count?.sites },
    { key: 'invoices' as const, label: 'Invoices', count: account?._count?.invoices },
    { key: 'services' as const, label: 'Services', count: overview?.services.length },
  ];

  const moreTabs = [
    { key: 'energy' as const, label: 'Energy' },
    { key: 'timeline' as const, label: 'Timeline', count: overview?.timelineCount },
  ];

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'CRM' }} workspace="crm">
      <div className="flex flex-col min-h-0 h-full">
        {loading ? (
          <div className="account-header-band shrink-0 px-6 py-8">
            <div className="max-w-[1400px] mx-auto space-y-3">
              <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
              <div className="h-8 w-64 bg-surface-raised rounded animate-pulse" />
            </div>
          </div>
        ) : account && health ? (
          <>
            <BusinessAccountHero
              accountId={account.id}
              companyName={account.companyName}
              tradingName={account.tradingName}
              accountNumber={account.accountNumber}
              accountStatus={account.status}
              customerSince={new Date(account.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              contact={contact ? { email: contact.email, phone: contact.phone, name: `${contact.firstName} ${contact.lastName}` } : null}
              healthLabel={health.label}
              onTabChange={setTab}
            />
            <BusinessAccountHealthSummary
              metrics={healthMetrics}
              healthScore={health.score}
              healthLabel={health.label}
              onTabChange={setTab}
            />
            <BusinessAccountTabBar
              tabs={primaryTabs}
              moreTabs={moreTabs}
              activeTab={tab}
              onTabChange={setTab}
            />
          </>
        ) : (
          <div className="account-header-band shrink-0 px-6 py-8">
            <div className="max-w-[1400px] mx-auto rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
          </div>
        )}

        {copyToast && (
          <div className="fixed bottom-6 right-6 z-50 px-3 py-2 rounded-lg bg-surface-overlay border border-border text-xs font-semibold text-foreground shadow-lg">
            {copyToast}
          </div>
        )}

        {account && (
          <div className="flex-1 overflow-auto account-cockpit-canvas">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
              {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-3">
                    <BusinessAccountProfileRail account={account} onTabChange={setTab} onCopy={handleCopy} />
                  </div>
                  <div className="lg:col-span-9">
                    <BusinessAccountOverviewDashboard account={account} overview={overview} onTabChange={setTab} />
                  </div>
                </div>
              )}
              {tab === 'contacts' && (
                <TabPanelShell title="Contacts">
                  <ContactsPanel accountId={id} />
                </TabPanelShell>
              )}
              {tab === 'sites' && (
                <TabPanelShell title="Sites">
                  <SitesPanel accountId={id} />
                </TabPanelShell>
              )}
              {tab === 'invoices' && (
                <TabPanelShell title="Invoices">
                  <InvoicesPanel accountId={id} />
                </TabPanelShell>
              )}
              {tab === 'services' && (
                <TabPanelShell title="Services">
                  <ServicesPanel accountId={id} />
                </TabPanelShell>
              )}
              {tab === 'energy' && (
                <TabPanelShell title="Energy">
                  <EnergyPanel accountId={id} />
                </TabPanelShell>
              )}
              {tab === 'timeline' && (
                <TabPanelShell title="Timeline">
                  <TimelinePanel accountId={id} />
                </TabPanelShell>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
