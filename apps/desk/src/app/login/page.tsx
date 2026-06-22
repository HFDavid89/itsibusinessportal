'use client';
import { AuthProvider, LoginPage } from '@itsi-business/staff-shell';

export default function DeskLoginPage() {
  return (
    <AuthProvider>
      <LoginPage appName="Support Desk" redirectTo="/" />
    </AuthProvider>
  );
}
