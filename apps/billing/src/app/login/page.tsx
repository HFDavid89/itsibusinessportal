'use client';
import { AuthProvider, LoginPage } from '@itsi-business/staff-shell';

export default function BillingLoginPage() {
  return (
    <AuthProvider>
      <LoginPage appName="Billing" redirectTo="/" />
    </AuthProvider>
  );
}
