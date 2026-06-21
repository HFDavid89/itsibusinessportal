'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isExternalHref } from './workspace-urls';

const AURORA_BAR = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 45%, #6366f1 100%)';

export interface NavItemDef {
  href: string;
  label: string;
  icon?: React.ReactNode;
  exactMatch?: boolean;
  external?: boolean;
}

export interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

export interface AppShellBrand {
  name: string;
  badge?: string;
}

export interface AppShellProps {
  navGroups: NavGroupDef[];
  brand: AppShellBrand;
  loginPath?: string;
  children: React.ReactNode;
}

function NavItem({ item }: { item: NavItemDef }) {
  const pathname = usePathname();
  const isActive = item.exactMatch
    ? pathname === item.href
    : pathname?.startsWith(item.href);
  const isExt = item.external || isExternalHref(item.href);

  const cls = [
    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-white/20 text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white',
  ].join(' ');

  if (isExt) {
    return (
      <a href={item.href} className={cls}>
        {item.icon}
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={cls}>
      {item.icon}
      {item.label}
    </Link>
  );
}

export function AppShell({ navGroups, brand, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="flex items-center gap-4 px-6 py-3 text-white shadow-md"
        style={{ background: AURORA_BAR }}
      >
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span>{brand.name}</span>
          {brand.badge && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{brand.badge}</span>
          )}
        </div>
        <nav className="flex items-center gap-1 ml-6">
          {navGroups.flatMap((g) => g.items).map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      </header>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
