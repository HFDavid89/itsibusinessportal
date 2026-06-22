'use client';

import type { BusinessAccount } from '../../../../lib/api';
import type { AccountTab } from './account-types';
import { primaryContact, primarySite } from './account-types';
import { StatusBadge } from './status-badge';

interface BusinessAccountProfileRailProps {
  account: BusinessAccount;
  onTabChange: (tab: AccountTab) => void;
  onCopy: (text: string) => void;
}

const FIELD_ICONS = {
  email: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  phone: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  address: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  default: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

function ProfileSection({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cockpit-card profile-rail-section">
      <div className="cockpit-card-header">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="cockpit-card-icon">{icon}</span>
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
        </div>
        {action}
      </div>
      <div className="px-4 py-3.5 space-y-0">{children}</div>
    </div>
  );
}

function ProfileField({
  label, value, href, onCopy, emptyLabel, iconKey = 'default',
}: {
  label: string; value?: string | null; href?: string; onCopy?: () => void; emptyLabel?: string; iconKey?: keyof typeof FIELD_ICONS;
}) {
  const display = value?.trim() || null;
  const icon = FIELD_ICONS[iconKey] ?? FIELD_ICONS.default;

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-border last:border-0">
      <span className="w-7 h-7 rounded-md bg-surface-raised border border-border flex items-center justify-center shrink-0 text-muted mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">{label}</p>
        {!display ? (
          <span className="profile-empty-pill">{emptyLabel ?? 'Not provided'}</span>
        ) : href ? (
          <a href={href} className="text-sm font-medium text-accent hover:underline break-all">{display}</a>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground break-all">{display}</p>
            {onCopy && (
              <button type="button" onClick={onCopy} className="text-[10px] font-semibold text-accent hover:underline shrink-0 px-1.5 py-0.5 rounded border border-accent/25 bg-accent/5">
                Copy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BusinessAccountProfileRail({ account, onTabChange, onCopy }: BusinessAccountProfileRailProps) {
  const contact = primaryContact(account);
  const site = primarySite(account);
  const siteAddress = site
    ? [site.addressLine1, site.addressLine2, site.city, site.postcode].filter(Boolean).join(', ')
    : null;

  return (
    <div className="space-y-4">
      <ProfileSection
        title="Primary contact"
        icon={FIELD_ICONS.email}
        action={<button type="button" onClick={() => onTabChange('contacts')} className="text-xs font-semibold text-accent hover:underline">View all</button>}
      >
        {contact ? (
          <>
            <ProfileField label="Name" value={`${contact.firstName} ${contact.lastName}`} />
            <ProfileField label="Email" value={contact.email} href={`mailto:${contact.email}`} iconKey="email" />
            <ProfileField label="Phone" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} emptyLabel="No phone" iconKey="phone" />
            <ProfileField label="Role" value={contact.role.replace(/_/g, ' ')} />
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted mb-2">No contacts on file</p>
            <button type="button" onClick={() => onTabChange('contacts')} className="btn-aurora text-xs font-bold px-4 py-2 rounded-lg">Add contact</button>
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        title="Primary site"
        icon={FIELD_ICONS.address}
        action={<button type="button" onClick={() => onTabChange('sites')} className="text-xs font-semibold text-accent hover:underline">View all</button>}
      >
        {site ? (
          <>
            <ProfileField label="Site name" value={site.name} />
            <ProfileField label="Address" value={siteAddress} iconKey="address" />
            {site.uprn && <ProfileField label="UPRN" value={site.uprn} onCopy={() => onCopy(site.uprn!)} />}
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted mb-2">No sites on file</p>
            <button type="button" onClick={() => onTabChange('sites')} className="btn-aurora text-xs font-bold px-4 py-2 rounded-lg">Add site</button>
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Company" icon={FIELD_ICONS.default}>
        <ProfileField label="Legal name" value={account.companyName} />
        <ProfileField label="Trading name" value={account.tradingName} emptyLabel="Same as legal name" />
        <div className="flex gap-2.5 py-2.5 border-b border-border">
          <span className="w-7 h-7 rounded-md bg-surface-raised border border-border flex items-center justify-center shrink-0 text-muted">{FIELD_ICONS.default}</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Status</p>
            <StatusBadge status={account.status} />
          </div>
        </div>
        <ProfileField label="Companies House" value={account.companyNumber} emptyLabel="Not registered" onCopy={account.companyNumber ? () => onCopy(account.companyNumber!) : undefined} />
        <ProfileField label="VAT number" value={account.vatNumber} emptyLabel="Not registered" />
        <ProfileField label="Account number" value={account.accountNumber} onCopy={() => onCopy(account.accountNumber)} />
      </ProfileSection>

      <ProfileSection title="Record" icon={FIELD_ICONS.default}>
        <ProfileField
          label="Created"
          value={new Date(account.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        />
        <ProfileField
          label="Last updated"
          value={new Date(account.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        />
        <ProfileField label="Account ID" value={account.id} onCopy={() => onCopy(account.id)} />
      </ProfileSection>
    </div>
  );
}
