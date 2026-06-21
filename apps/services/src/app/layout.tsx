import type { Metadata } from 'next';
import { AuthProvider } from '@itsi-business/staff-shell';
import { ToastProvider } from '@itsi-business/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Itsi Business — Services',
  description: 'Itsi Business Services — Retail Service Catalogue and Service Records',
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
