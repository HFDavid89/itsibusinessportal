import { z } from 'zod';

export const MobileQuoteBodySchema = z.object({
  productCode: z.string().max(100).optional(),
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

export const MobileOrderBodySchema = z.object({
  businessAccountId: z.string().min(1),
  businessServiceReference: z.string().min(1),
  quoteId: z.string().max(200).optional(),
  productCode: z.string().max(100).optional(),
  contractTermMonths: z.number().int().positive().optional(),
  simType: z.string().max(50).optional(),
  simQuantity: z.number().int().positive().optional(),
  contactName: z.string().max(200).optional(),
  contactPhone: z.string().max(30).optional(),
  contactEmail: z.string().email().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const BroadbandOrderBodySchema = z.object({
  businessAccountId: z.string().min(1),
  businessServiceReference: z.string().min(1),
  quoteId: z.string().max(200).optional(),
  postcode: z.string().min(1).max(10),
  uprn: z.string().max(20).optional(),
  productCode: z.string().max(100).optional(),
  accessTechnology: z.string().max(50).optional(),
  installContactName: z.string().max(200).optional(),
  installContactPhone: z.string().max(30).optional(),
  installContactEmail: z.string().email().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const EscalationBodySchema = z.object({
  serviceType: z.enum(['MOBILE', 'BROADBAND']),
  orderId: z.string().max(200).optional(),
  businessServiceReference: z.string().min(1),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
});

/** @deprecated — requires serviceType and routes to family-specific upstream paths */
export const LegacyGenericOrderBodySchema = z.object({
  serviceType: z.enum(['MOBILE', 'BROADBAND']),
  businessAccountId: z.string().min(1),
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
