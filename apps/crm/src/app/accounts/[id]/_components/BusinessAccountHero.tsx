'use client';

import Link from 'next/link';
import { WORKSPACE_URLS } from '@itsi-business/staff-shell';
import type { AccountTab, HealthLabel } from './account-types';
import { StatusBadge } from './status-badge';

export interface BusinessAccountHeroProps {
  accountId: string;
  companyName: string;
  tradingName?: string | null;
  accountNumber: string;
  accountStatus: string;
  customerSince: string;
  contact?: { email?: string | null; phone?: string | null; name?: string } | null;
  healthLabel: HealthLabel;
  onTabChange: (tab: AccountTab) => void;
}

const actionBtn = 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent whitespace-nowrap';

export function BusinessAccountHero({
  accountId,
  companyName,
  tradingName,
  accountNumber,
  accountStatus,
  customerSince,
  contact,
  healthLabel,
  onTabChange,
}: BusinessAccountHeroProps) {
  const initials = companyName.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="account-header-band shrink-0">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/accounts" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-foreground transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Business Accounts
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 avatar-aurora" aria-hidden>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-lg font-bold text-foreground tracking-tight leading-tight">{companyName}</h1>
                <StatusBadge status={accountStatus} />
                <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-bold border ${healthLabel.color}`}>
                  {healthLabel.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-muted">
                {tradingName && tradingName !== companyName && (
                  <>
                    <span className="font-medium text-foreground/75 truncate max-w-[180px]">t/a {tradingName}</span>
                    <span aria-hidden>·</span>
                  </>
                )}
                <span className="font-mono font-semibold text-foreground/65">{accountNumber}</span>
                <span aria-hidden>·</span>
                <span>Since {customerSince}</span>
                {contact?.email && (
                  <>
                    <span aria-hidden>·</span>
                    <a href={`mailto:${contact.email}`} className="text-accent hover:underline truncate max-w-[180px]">{contact.email}</a>
                  </>
                )}
                {contact?.phone && (
                  <>
                    <span aria-hidden>·</span>
                    <a href={`tel:${contact.phone}`} className="hover:text-accent">{contact.phone}</a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hero-action-panel shrink-0 lg:max-w-[520px]">
            <div className="flex flex-wrap items-center gap-1">
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className={`${actionBtn} border-border bg-surface text-foreground hover:bg-surface-raised`}>
                  Email
                </a>
              )}
              <button type="button" onClick={() => onTabChange('contacts')} className={`${actionBtn} border-border bg-surface text-foreground hover:bg-surface-raised`}>
                Contacts
              </button>
              <button type="button" onClick={() => onTabChange('sites')} className={`${actionBtn} border-border bg-surface text-foreground hover:bg-surface-raised`}>
                Sites
              </button>
              <span className="w-px h-5 bg-border mx-0.5 hidden sm:block" aria-hidden />
              <a
                href={`${WORKSPACE_URLS.desk}/tickets?accountId=${accountId}`}
                className={`${actionBtn} border-border bg-surface text-foreground hover:bg-surface-raised`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Desk
              </a>
              <a
                href={`${WORKSPACE_URLS.billing}/invoices?accountId=${accountId}`}
                className={`${actionBtn} border-accent/40 bg-accent/5 text-accent hover:bg-accent/10`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Billing
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
