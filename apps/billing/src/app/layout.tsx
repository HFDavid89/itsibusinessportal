import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Itsi Business — Billing',
  description: 'Itsi Business Billing — Invoices & Payments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
