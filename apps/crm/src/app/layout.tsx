import type { Metadata } from 'next';
import { AuthProvider } from '@itsi-business/staff-shell';
import { ToastProvider } from '@itsi-business/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Itsi Business — CRM',
  description: 'Itsi Business CRM — Business Account Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
