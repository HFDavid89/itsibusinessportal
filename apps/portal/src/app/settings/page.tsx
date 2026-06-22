'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@itsi-business/staff-shell';
import { PortalPage, Panel, DisabledAction } from '../../components/PortalPage';
import { portalApi } from '../../lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName || '', lastName: user.lastName || '' });
    portalApi.me().then((me) => setForm({ firstName: me.user.firstName, lastName: me.user.lastName }));
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await portalApi.updateContactDetails(form);
      setMessage('Your details have been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalPage title="Settings" subtitle="Manage your portal profile">
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Panel>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Your contact details</h2>
          {message && <p style={{ color: 'rgb(var(--success))', fontSize: '0.8rem', marginBottom: 8 }}>{message}</p>}
          {error && <p style={{ color: 'rgb(var(--danger))', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
            <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'inherit' }} />
            <button type="submit" disabled={saving} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', borderRadius: 10, background: 'rgb(var(--accent))', color: 'rgb(var(--accent-foreground))', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Panel>

        <Panel>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Account settings</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgb(var(--muted))', marginBottom: '0.75rem' }}>
            Company profile changes must be requested through your account manager.
          </p>
          <DisabledAction label="Edit company details" reason="Contact your account manager to update company information" />
        </Panel>
      </div>
    </PortalPage>
  );
}
