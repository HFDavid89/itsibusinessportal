'use client';

import { useEffect, useState } from 'react';
import { StatusPill } from '@itsi-business/ui';
import { PortalPage, Panel, EmptyState } from '../../components/PortalPage';
import { portalApi, type PortalUser } from '../../lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => portalApi.users().then(setUsers);
  useEffect(() => { load(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await portalApi.createUser(form);
      setForm({ email: '', firstName: '', lastName: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalPage title="Portal users" subtitle={`${users.length} users`}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setShowForm((v) => !v)} style={{ padding: '0.5rem 1rem', borderRadius: 10, background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Invite user'}
          </button>
        </div>

        {showForm && (
          <Panel>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Invite portal user</h2>
            {error && <p style={{ color: 'rgb(var(--danger))', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
            <form onSubmit={handleInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ gridColumn: '1 / -1', padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
              <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
              <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
              <input required type="password" minLength={8} placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ gridColumn: '1 / -1', padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
              <button type="submit" disabled={saving} style={{ gridColumn: '1 / -1', justifySelf: 'start', padding: '0.5rem 1rem', borderRadius: 10, background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                {saving ? 'Inviting…' : 'Create portal user'}
              </button>
            </form>
          </Panel>
        )}

        {!users.length ? (
          <EmptyState message="No portal users on this account." />
        ) : (
          <Panel>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'rgb(var(--muted))', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                  <th>Name</th><th>Email</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                    <td style={{ padding: '0.5rem 0' }}>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td><StatusPill tone={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Active' : 'Inactive'}</StatusPill></td>
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
