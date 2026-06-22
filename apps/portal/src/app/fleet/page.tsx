'use client';

import { useEffect, useState } from 'react';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, EmptyState, DisabledAction } from '../../components/PortalPage';
import { portalApi, fmtPence, type PortalFleetItem } from '../../lib/api';

export default function FleetPage() {
  const [sims, setSims] = useState<PortalFleetItem[]>([]);

  useEffect(() => {
    portalApi.fleet().then(setSims);
  }, []);

  return (
    <PortalPage title="Mobile fleet & SIMs" subtitle={`${sims.length} lines`}>
      <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!sims.length ? (
          <EmptyState message="No mobile lines on your account." />
        ) : (
          <Panel>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'rgb(var(--muted))', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                  <th>Label</th><th>Number</th><th>SIM</th><th>Cost centre</th><th>Status</th><th>Price</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sims.map((s) => (
                  <tr key={s.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                    <td style={{ padding: '0.5rem 0' }}>{s.displayName}</td>
                    <td>{s.mobileNumber ?? '—'}</td>
                    <td>{s.simLabel ?? '—'}</td>
                    <td>{s.costCentre ?? '—'}</td>
                    <td><StatusPill tone={s.status === 'ACTIVE' ? 'success' : 'default'}>{s.status}</StatusPill></td>
                    <td>{fmtPence(s.retailPricePence)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <DisabledAction label="SIM swap" reason="Coming soon" />
                        <DisabledAction label="Spend cap" reason="Coming soon" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    </PortalPage>
  );
}
