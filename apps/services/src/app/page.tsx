'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@itsi-business/staff-shell';
import { catalogueApi, servicesApi, money, type BusinessServiceCatalogueItem, type AnyService } from '../lib/api';

const NAV_GROUPS = [
  { label: 'Services', items: [
    { href: '/',          label: 'Dashboard',  exactMatch: true },
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/records',   label: 'Service Records' },
  ]},
];

const TYPE_CLS: Record<string, string> = {
  MOBILE:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
  BROADBAND: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  ENERGY:    'bg-amber-500/10 text-amber-700 border-amber-500/20',
  SOFTWARE:  'bg-violet-500/10 text-violet-600 border-violet-500/20',
  SUPPORT:   'bg-teal-500/10 text-teal-700 border-teal-500/20',
  OTHER:     'bg-border/40 text-muted border-border',
};

const STATUS_CLS: Record<string, string> = {
  DRAFT:       'bg-border/40 text-muted border-border',
  REQUESTED:   'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACTIVE:      'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  SUSPENDED:   'bg-amber-500/10 text-amber-700 border-amber-500/20',
  CEASED:      'bg-rose-500/10 text-rose-600 border-rose-500/20',
  CANCELLED:   'bg-border text-muted border-border',
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${TYPE_CLS[type] ?? TYPE_CLS.OTHER}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_CLS[status] ?? STATUS_CLS.DRAFT}`}>
      {status}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
}

function StatCard({ label, value, sub, href }: StatCardProps) {
  const inner = (
    <div className="bg-surface border border-border rounded-2xl px-5 py-4 hover:border-accent/30 transition-colors">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function ServicesHome() {
  const [catalogue,     setCatalogue]     = useState<BusinessServiceCatalogueItem[]>([]);
  const [recentServices, setRecentServices] = useState<AnyService[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      catalogueApi.list({ limit: 50 }),
      servicesApi.list({ limit: 10 }),
    ]).then(([cat, svc]) => {
      setCatalogue(cat.data);
      setRecentServices(svc.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeCatalogue = catalogue.filter((c) => c.status === 'ACTIVE');
  const mobileCount     = recentServices.filter((s) => s._serviceType === 'MOBILE').length;
  const broadbandCount  = recentServices.filter((s) => s._serviceType === 'BROADBAND').length;
  const energyCount     = recentServices.filter((s) => s._serviceType === 'ENERGY').length;

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Services' }}>
      <div className="p-5 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-foreground">Services</h1>
            <p className="text-xs text-muted">Retail service catalogue and business service records</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/catalogue/new"
              className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-90">
              + Catalogue Item
            </Link>
            <Link href="/records/new"
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-raised transition-colors">
              + Service Record
            </Link>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl px-5 py-4 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Active catalogue items" value={activeCatalogue.length} sub="across all types" href="/catalogue" />
            <StatCard label="Mobile services"    value={mobileCount}    href="/records?type=MOBILE" />
            <StatCard label="Broadband services" value={broadbandCount} href="/records?type=BROADBAND" />
            <StatCard label="Energy services"    value={energyCount}    href="/records?type=ENERGY" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Catalogue snapshot */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Catalogue</h2>
              <Link href="/catalogue" className="text-xs text-accent hover:underline">View all →</Link>
            </div>
            {loading ? (
              <div className="p-6 text-sm text-muted text-center">Loading…</div>
            ) : activeCatalogue.length === 0 ? (
              <div className="p-6 text-sm text-muted text-center">No active catalogue items yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {activeCatalogue.slice(0, 6).map((item) => (
                  <Link key={item.id} href={`/catalogue/${item.id}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-raised/40 transition-colors gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted font-mono">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <TypeBadge type={item.serviceType} />
                      <span className="text-sm font-semibold text-foreground">{money(item.retailPricePence)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent service records */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Recent Service Records</h2>
              <Link href="/records" className="text-xs text-accent hover:underline">View all →</Link>
            </div>
            {loading ? (
              <div className="p-6 text-sm text-muted text-center">Loading…</div>
            ) : recentServices.length === 0 ? (
              <div className="p-6 text-sm text-muted text-center">No service records yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentServices.slice(0, 6).map((svc) => (
                  <Link key={svc.id} href={`/records/${svc.id}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-raised/40 transition-colors gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{svc.displayName}</p>
                      <p className="text-[11px] text-muted font-mono">{svc.serviceReference}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <TypeBadge type={svc._serviceType} />
                      <StatusBadge status={svc.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
