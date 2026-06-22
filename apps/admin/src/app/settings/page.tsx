import { AppShell, ADMIN_NAV_GROUPS, DeferredSettingsPanel } from '@itsi-business/staff-shell';

export default function AdminSettingsPage() {
  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <DeferredSettingsPanel />
    </AppShell>
  );
}
