'use client';
import { AuthProvider, LoginPage } from '@itsi-business/staff-shell';

export default function AdminLoginPage() {
  return (
    <AuthProvider>
      <LoginPage appName="Admin Console" redirectTo="/" />
    </AuthProvider>
  );
}
