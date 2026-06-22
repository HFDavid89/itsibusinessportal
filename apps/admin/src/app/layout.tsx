import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@itsi-business/staff-shell';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Itsi Business — Admin',
  description: 'Itsi Business Platform Administration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-product="itsi-business">
      <body style={{ background: 'rgb(3 3 3)', color: 'rgb(248 250 252)', margin: 0 }}><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
