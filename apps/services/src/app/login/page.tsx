'use client';
import { AuthProvider, LoginPage } from '@itsi-business/staff-shell';

export default function ServicesLoginPage() {
  return (
    <AuthProvider>
      <LoginPage appName="Services" redirectTo="/" />
    </AuthProvider>
  );
}
