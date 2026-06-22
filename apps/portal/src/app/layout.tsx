import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Itsi Business Portal',
  description: 'Manage your Itsi Business account, services, and support tickets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-product="itsi-business">
      <body className="min-h-dvh bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
