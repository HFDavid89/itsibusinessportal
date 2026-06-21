import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Itsi Business — CRM',
  description: 'Itsi Business CRM — Business Account Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
