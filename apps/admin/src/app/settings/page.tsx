import { AppShell, ADMIN_NAV_GROUPS, SettingsPlaceholder } from '@itsi-business/staff-shell';

export default function AdminSettingsPage() {
  return (
    <AppShell navGroups={ADMIN_NAV_GROUPS} brand={{ name: 'Itsi Business', badge: 'Admin' }} workspace="admin">
      <SettingsPlaceholder
        title="Platform Settings"
        description="Configure platform-wide settings, integrations, and operational defaults."
        detail="Full settings UI is deferred. Wholesale connection is available under Admin → Wholesale Connection."
      />
    </AppShell>
  );
}
