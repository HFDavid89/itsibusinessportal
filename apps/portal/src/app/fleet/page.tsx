'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompactKpiChip, DataTable, FilterBar, LoadErrorPanel, LoadingList } from '@itsi-business/ui';
import { PortalPage } from '../../components/PortalPage';
import { PortalHero } from '../../components/portal-ui/portal-cockpit';
import { ServiceStatusBadge } from '../../components/portal-ui/StatusBadges';
import { portalApi, fmtPence, type PortalFleetItem } from '../../lib/api';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'CEASED', label: 'Ceased' },
];

export default function FleetPage() {
  const router = useRouter();
  const [sims, setSims] = useState<PortalFleetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    portalApi.fleet()
      .then(setSims)
      .catch(() => setError('Unable to load mobile fleet.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sims.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!q) return true;
      return [
        s.displayName, s.mobileNumber, s.simLabel, s.costCentre, s.serviceReference,
        s.contact ? `${s.contact.firstName} ${s.contact.lastName}` : '',
        s.site?.name,
      ].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [sims, statusFilter, search]);

  const counts = useMemo(() => ({
    active: sims.filter((s) => s.status === 'ACTIVE').length,
    requested: sims.filter((s) => s.status === 'REQUESTED').length,
    suspended: sims.filter((s) => s.status === 'SUSPENDED').length,
    ceased: sims.filter((s) => s.status === 'CEASED').length,
  }), [sims]);

  return (
    <PortalPage title="Mobile fleet & SIMs" subtitle={`${sims.length} lines on your account`}>
      <div className="max-w-6xl mx-auto space-y-5">
        <PortalHero
          eyebrow="Mobile fleet"
          title="SIMs & mobile lines"
          subtitle="View and label your business mobile services. Network changes are request-based until live provisioning is available."
        />

        {error && <LoadErrorPanel message={error} onRetry={() => window.location.reload()} />}

        {loading ? (
          <LoadingList rows={5} />
        ) : sims.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-raised px-6 py-14 text-center">
            <p className="text-sm font-semibold text-foreground">No mobile lines</p>
            <p className="text-xs text-muted mt-1">Your account does not have any mobile services yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CompactKpiChip label="Active" value={counts.active} />
              <CompactKpiChip label="Requested" value={counts.requested} />
              <CompactKpiChip label="Suspended" value={counts.suspended} />
              <CompactKpiChip label="Ceased" value={counts.ceased} />
            </div>

            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search number, label, cost centre, contact…"
              filters={[{
                id: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: STATUS_FILTERS,
              }]}
            />

            <DataTable
              rows={filtered}
              rowKey={(s) => s.id}
              emptyMessage="No SIMs match your filters."
              onRowClick={(s) => router.push(`/fleet/${s.id}`)}
              columns={[
                {
                  key: 'label',
                  header: 'Line',
                  cell: (s) => (
                    <div>
                      <p className="font-semibold text-foreground">{s.displayName}</p>
                      <p className="text-[11px] text-muted font-mono">{s.serviceReference}</p>
                    </div>
                  ),
                },
                { key: 'number', header: 'Number', cell: (s) => s.mobileNumber ?? '—' },
                { key: 'sim', header: 'SIM label', cell: (s) => s.simLabel ?? '—' },
                { key: 'cost', header: 'Cost centre', cell: (s) => s.costCentre ?? '—' },
                {
                  key: 'contact',
                  header: 'Contact',
                  cell: (s) => s.contact ? `${s.contact.firstName} ${s.contact.lastName}` : '—',
                },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (s) => <ServiceStatusBadge status={s.status} label={s.statusLabel} />,
                },
                { key: 'price', header: 'Price', cell: (s) => fmtPence(s.retailPricePence) },
                {
                  key: 'actions',
                  header: '',
                  cell: (s) => (
                    <Link href={`/fleet/${s.id}`} className="text-xs font-semibold text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
                      Details →
                    </Link>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    </PortalPage>
  );
}
