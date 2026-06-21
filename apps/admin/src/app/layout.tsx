import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Itsi Business — Admin',
  description: 'Itsi Business Platform Administration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
