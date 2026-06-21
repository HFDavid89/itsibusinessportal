export type ServiceStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export interface BusinessMobileService {
  id: string;
  accountId: string;
  siteId?: string;
  msisdn?: string;
  tariffName: string;
  status: ServiceStatus;
  wholesaleServiceLinkId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessBroadbandService {
  id: string;
  accountId: string;
  siteId: string;
  productName: string;
  status: ServiceStatus;
  wholesaleServiceLinkId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessEnergyService {
  id: string;
  accountId: string;
  siteId: string;
  mpan?: string;
  mprn?: string;
  supplierName?: string;
  status: ServiceStatus;
  contractStartDate?: string;
  contractEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleServiceLink {
  id: string;
  itsiMobileServiceOrderId: string;
  itsiMobileServiceInstanceId?: string;
  serviceType: 'MOBILE' | 'BROADBAND';
  createdAt: string;
  updatedAt: string;
}
