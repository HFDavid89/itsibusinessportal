import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Itsi Business — Desk',
  description: 'Itsi Business Support Desk — Ticket Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
