import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Itsi Business Portal',
  description: 'Manage your Itsi Business account, services, and support tickets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
