'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell, WORKSPACE_URLS } from '@itsi-business/staff-shell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

const NAV_GROUPS = [
  {
    label: 'Admin',
    items: [
      { href: '/', label: 'Overview', exactMatch: true },
      { href: '/settings', label: 'Settings' },
      { href: '/staff', label: 'Staff' },
      { href: '/wholesale', label: 'Wholesale Connection' },
    ],
  },
  {
    label: 'Workspaces',
    items: [
      { href: WORKSPACE_URLS.crm, label: 'CRM', external: true },
      { href: WORKSPACE_URLS.billing, label: 'Billing', external: true },
      { href: WORKSPACE_URLS.desk, label: 'Desk', external: true },
    ],
  },
];

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  realm: string;
  isActive: boolean;
  createdAt: string;
  roles: { id: string; name: string; permissions: string[] }[];
}

interface CreateUserForm {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  realm: 'staff' | 'platform';
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as any)?.error?.message ?? `HTTP ${res.status}`);
  return json as T;
}

const REALM_COLOURS: Record<string, string> = {
  platform: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  staff:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const EMPTY_FORM: CreateUserForm = { email: '', firstName: '', lastName: '', password: '', realm: 'staff' };

export default function StaffManagementPage() {
  const [users, setUsers]         = useState<StaffUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState<CreateUserForm>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActive, setEditActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiFetch<{ success: true; data: StaffUser[] }>(`/api/v1/admin/staff${q}`);
      setUsers(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load staff users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await apiFetch('/api/v1/admin/staff', { method: 'POST', body: JSON.stringify(form) });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: StaffUser) {
    try {
      await apiFetch(`/api/v1/admin/staff/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      await load();
    } catch { /* silently reload */ load(); }
  }

  const filtered = users.filter((u) =>
    !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell navGroups={NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">Staff Users</h1>
            <p className="text-sm text-muted mt-0.5">Manage staff access to the Itsi Business platform.</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowCreate(true); setSaveError(''); setForm(EMPTY_FORM); }}
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + New Staff User
          </button>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
        />

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl">
              <h2 className="text-base font-bold text-foreground mb-4">Create Staff User</h2>
              {saveError && (
                <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger mb-3">{saveError}</div>
              )}
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">First Name</label>
                    <input required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">Last Name</label>
                    <input required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">Password</label>
                  <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wide mb-1">Realm</label>
                  <select value={form.realm} onChange={(e) => setForm((f) => ({ ...f, realm: e.target.value as 'staff' | 'platform' }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30">
                    <option value="staff">Staff</option>
                    <option value="platform">Platform (Super Admin)</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                    {saving ? 'Creating…' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users table */}
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-raised animate-pulse" />
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-sm text-muted">No staff users found.</div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
            {filtered.map((u) => (
              <div key={u.id} className="px-5 py-3.5 bg-surface flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[rgb(48_75_115)] flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-[11px] text-muted truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${REALM_COLOURS[u.realm] ?? 'bg-border text-muted border-border'}`}>
                    {u.realm}
                  </span>
                  {u.roles.length > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface-raised text-muted font-medium">
                      {u.roles.map((r) => r.name).join(', ')}
                    </span>
                  )}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                    u.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-border/40 text-muted/60 border-border/40'
                  }`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    title={u.isActive ? 'Deactivate' : 'Activate'}
                    className="text-[11px] px-2 py-1 rounded-lg border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted/50">
          {filtered.length} user{filtered.length !== 1 ? 's' : ''} · Passwords are hashed with bcrypt. Role assignment via API.
        </p>
      </div>
    </AppShell>
  );
}
