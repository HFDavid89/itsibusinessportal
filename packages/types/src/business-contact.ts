export type ContactRole = 'BILLING' | 'TECHNICAL' | 'GENERAL' | 'PRIMARY';

export interface BusinessContact {
  id: string;
  accountId: string;
  siteId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: ContactRole;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}
