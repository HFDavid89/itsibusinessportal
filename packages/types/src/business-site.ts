export interface BusinessSite {
  id: string;
  accountId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
  uprn?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}
