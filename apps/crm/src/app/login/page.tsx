'use client';
import { AuthProvider, LoginPage } from '@itsi-business/staff-shell';

export default function CrmLoginPage() {
  return (
    <AuthProvider>
      <LoginPage appName="CRM" redirectTo="/" />
    </AuthProvider>
  );
}
