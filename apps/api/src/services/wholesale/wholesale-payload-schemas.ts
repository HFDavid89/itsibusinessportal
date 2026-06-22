import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(200).optional(),
}).optional();

const PortingSchema = z.object({
  pac: z.string().max(20).optional(),
  stac: z.string().max(20).optional(),
  portingDate: z.string().max(30).optional(),
}).optional();

const AddressSchema = z.object({
  line1: z.string().max(200).optional(),
  line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postcode: z.string().min(1).max(10),
  uprn: z.string().max(20).optional(),
}).optional();

/** Phase 14W attribution fields — sent to Itsi Mobile; reseller account derived from API key. */
const SourceAttributionSchema = z.object({
  sourceOrderId: z.string().min(1).max(200),
  sourceCustomerReference: z.string().min(1).max(200),
  sourceServiceReference: z.string().min(1).max(200),
  businessServiceReference: z.string().min(1).max(200),
});

export const MobileQuoteBodySchema = z.object({
  productCode: z.string().max(100).optional(),
  tariffCode: z.string().max(100).optional(),
  contractTermMonths: z.number().int().positive().optional(),
  simType: z.string().max(50).optional(),
  simQuantity: z.number().int().positive().optional(),
  userCount: z.number().int().positive().optional(),
});

export const BroadbandAvailabilityQuerySchema = z.object({
  postcode: z.string().min(1).max(10),
  uprn: z.string().max(20).optional(),
});

export const BroadbandQuoteBodySchema = z.object({
  postcode: z.string().min(1).max(10),
  uprn: z.string().max(20).optional(),
  productCode: z.string().max(100).optional(),
  contractTermMonths: z.number().int().positive().optional(),
  accessTechnology: z.string().max(50).optional(),
});

export const MobileOrderBodySchema = SourceAttributionSchema.extend({
  quoteId: z.string().max(200).optional(),
  productCode: z.string().max(100).optional(),
  tariffCode: z.string().max(100).optional(),
  contractTermMonths: z.number().int().positive().optional(),
  simType: z.string().max(50).optional(),
  simQuantity: z.number().int().positive().optional(),
  contact: ContactSchema,
  porting: PortingSchema,
  notes: z.string().max(2000).optional(),
});

export const BroadbandOrderBodySchema = SourceAttributionSchema.extend({
  quoteId: z.string().max(200).optional(),
  postcode: z.string().min(1).max(10),
  uprn: z.string().max(20).optional(),
  address: AddressSchema,
  productCode: z.string().max(100).optional(),
  accessTechnology: z.string().max(50).optional(),
  installContact: ContactSchema,
  appointmentWindow: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const EscalationBodySchema = z.object({
  serviceType: z.enum(['MOBILE', 'BROADBAND']),
  businessServiceReference: z.string().min(1),
  sourceOrderId: z.string().max(200).optional(),
  orderId: z.string().max(200).optional(),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
});

/** Staff-only deprecated proxy — maps legacy body to 14W attribution before upstream call. */
export const LegacyGenericOrderBodySchema = z.object({
  serviceType: z.enum(['MOBILE', 'BROADBAND']),
  sourceOrderId: z.string().min(1).max(200).optional(),
  sourceCustomerReference: z.string().min(1).max(200).optional(),
  businessServiceReference: z.string().min(1),
  quoteId: z.string().optional(),
  postcode: z.string().max(10).optional(),
  uprn: z.string().max(20).optional(),
  productCode: z.string().max(100).optional(),
  contactName: z.string().max(200).optional(),
  contactPhone: z.string().max(30).optional(),
  contractTermMonths: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
}).superRefine((data, ctx) => {
  if (data.serviceType === 'BROADBAND' && !data.postcode?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'postcode is required for BROADBAND orders', path: ['postcode'] });
  }
});
