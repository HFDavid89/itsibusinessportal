export type BusinessAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'PROSPECT';

export interface BusinessAccount {
  id: string;
  accountNumber: string;
  companyName: string;
  tradingName?: string;
  companyNumber?: string;
  vatNumber?: string;
  status: BusinessAccountStatus;
  createdAt: string;
  updatedAt: string;
}
