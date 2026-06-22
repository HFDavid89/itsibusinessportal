'use client';

import { useEffect, useState } from 'react';
import { PortalPage, Panel, EmptyState } from '../../components/PortalPage';
import { portalApi, type PortalAccountDetail } from '../../lib/api';

export default function AccountPage() {
  const [data, setData] = useState<PortalAccountDetail | null>(null);

  useEffect(() => {
    portalApi.account().then(setData);
  }, []);

  return (
    <PortalPage title="Account" subtitle={data?.account.companyName}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!data ? (
          <p style={{ color: 'rgb(var(--muted))' }}>Loading…</p>
        ) : (
          <>
            <Panel>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{data.account.companyName}</h1>
              <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <dt style={{ color: 'rgb(var(--muted))' }}>Account number</dt><dd>{data.account.accountNumber}</dd>
                <dt style={{ color: 'rgb(var(--muted))' }}>Trading name</dt><dd>{data.account.tradingName ?? '—'}</dd>
                <dt style={{ color: 'rgb(var(--muted))' }}>Status</dt><dd>{data.account.status}</dd>
                <dt style={{ color: 'rgb(var(--muted))' }}>Company number</dt><dd>{data.account.companyNumber ?? '—'}</dd>
                <dt style={{ color: 'rgb(var(--muted))' }}>VAT number</dt><dd>{data.account.vatNumber ?? '—'}</dd>
              </dl>
            </Panel>

            <Panel>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Sites</h2>
              {!data.sites.length ? <EmptyState message="No sites on record." /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.sites.map((s) => (
                    <div key={s.id} style={{ fontSize: '0.85rem' }}>
                      <strong>{s.name}</strong>{s.isPrimary ? ' (primary)' : ''}
                      <div style={{ color: 'rgb(var(--muted))', fontSize: '0.75rem' }}>{s.addressLine1}, {s.city}, {s.postcode}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Contacts</h2>
              {!data.contacts.length ? <EmptyState message="No contacts on record." /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.contacts.map((c) => (
                    <div key={c.id} style={{ fontSize: '0.85rem' }}>
                      <strong>{c.firstName} {c.lastName}</strong>{c.isPrimary ? ' (primary)' : ''}
                      <div style={{ color: 'rgb(var(--muted))', fontSize: '0.75rem' }}>{c.email}{c.phone ? ` · ${c.phone}` : ''} · {c.role}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </PortalPage>
  );
}
