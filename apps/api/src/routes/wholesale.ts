import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/authenticate';
import { requirePermission } from '../middleware/rbac';
import {
  itsiMobileClient,
  loadWholesaleConfig,
  isWholesaleEnabled,
  maskUpstreamError,
  WholesaleConfigError,
  WholesaleDisabledError,
  WholesaleCircuitOpenError,
  WholesaleApiError,
  WholesaleTimeoutError,
} from '../services/wholesale/itsi-mobile-client';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const AvailabilityQuerySchema = z.object({
  postcode: z.string().min(1, 'postcode is required').max(10),
  uprn:     z.string().max(20).optional(),
});

const QuoteBodySchema = z.object({
  serviceType:       z.enum(['MOBILE', 'BROADBAND', 'ENERGY']),
  postcode:          z.string().max(10).optional(),
  uprn:              z.string().max(20).optional(),
  productCode:       z.string().max(100).optional(),
  contractTermMonths: z.number().int().positive().optional(),
});

const OrderBodySchema = z.object({
  serviceType:             z.enum(['MOBILE', 'BROADBAND']),
  businessAccountId:       z.string().min(1),
  businessServiceReference: z.string().min(1),
  quoteId:                 z.string().optional(),
  postcode:                z.string().max(10).optional(),
  uprn:                    z.string().max(20).optional(),
  productCode:             z.string().max(100).optional(),
  contactName:             z.string().max(200).optional(),
  contactPhone:            z.string().max(30).optional(),
  contractTermMonths:      z.number().int().positive().optional(),
  notes:                   z.string().max(2000).optional(),
});

const EscalationBodySchema = z.object({
  orderId:                 z.string().optional(),
  businessServiceReference: z.string().min(1),
  subject:                 z.string().min(1).max(300),
  description:             z.string().min(1).max(5000),
  priority:                z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
});

/**
 * Wholesale routes expose the Itsi Mobile API boundary to internal staff.
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * These routes delegate ALL provider interactions to Itsi Mobile wholesale APIs.
 * They do NOT call Gamma, KCOM, MS3, or OTS Hero directly — ever.
 */

function handleWholesaleError(err: unknown, reply: any): void {
  if (err instanceof WholesaleConfigError) {
    reply.code(503).send({ success: false, error: { code: 'WHOLESALE_CONFIG_ERROR', message: err.message, field: err.field } });
  } else if (err instanceof WholesaleDisabledError) {
    reply.code(503).send({ success: false, error: { code: 'WHOLESALE_DISABLED', message: err.message } });
  } else if (err instanceof WholesaleCircuitOpenError) {
    reply.code(503).send({ success: false, error: { code: 'CIRCUIT_OPEN', message: err.message } });
  } else if (err instanceof WholesaleTimeoutError) {
    reply.code(504).send({ success: false, error: { code: 'WHOLESALE_TIMEOUT', message: err.message } });
  } else if (err instanceof WholesaleApiError) {
    reply.code(502).send({ success: false, error: { code: 'WHOLESALE_API_ERROR', message: err.message, upstream: maskUpstreamError(err.statusCode, err.body) } });
  } else {
    reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error calling Itsi Mobile wholesale API' } });
  }
}

export async function wholesaleRoutes(app: FastifyInstance) {
  const readGuard  = requirePermission('wholesale.read');
  const writeGuard = requirePermission('wholesale.write');

  /**
   * GET /api/v1/wholesale/status
   * Connectivity check — pings Itsi Mobile wholesale API.
   */
  app.get('/status', { preHandler: [requireAuth, readGuard] }, async (_req: any, reply: any) => {
    const config = loadWholesaleConfig();
    if (!isWholesaleEnabled()) {
      return reply.send({
        success: true,
        data: { enabled: false, message: 'Wholesale API is disabled (ITSI_MOBILE_WHOLESALE_ENABLED=false)' },
      });
    }
    const result = await itsiMobileClient.ping(config);
    return reply.send({ success: true, data: { enabled: true, ...result } });
  });

  /**
   * GET /api/v1/wholesale/availability?postcode=XX1+1XX&uprn=...
   * Check service availability at a postcode/UPRN via Itsi Mobile.
   * Itsi Mobile proxies Gamma/KCOM/MS3 — we never call them directly.
   */
  app.get('/availability', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const parsed = AvailabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
    }
    const { postcode, uprn } = parsed.data;
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.getAvailability(config, postcode, uprn);
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * POST /api/v1/wholesale/quotes
   * Request a wholesale price quote from Itsi Mobile.
   */
  app.post('/quotes', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const parsed = QuoteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
    }
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.getQuote(config, parsed.data);
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * POST /api/v1/wholesale/orders
   * Submit a service order to Itsi Mobile for provider provisioning.
   */
  app.post('/orders', { preHandler: [requireAuth, writeGuard] }, async (req: any, reply: any) => {
    const parsed = OrderBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
    }
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.createOrder(config, parsed.data);
      return reply.code(201).send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * GET /api/v1/wholesale/orders/:id
   * Get a wholesale order by ID.
   */
  app.get('/orders/:id', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.getOrder(config, id);
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * GET /api/v1/wholesale/orders/:id/status
   * Poll the live status of a wholesale order from Itsi Mobile.
   */
  app.get('/orders/:id/status', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.getOrderStatus(config, id);
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * POST /api/v1/wholesale/escalations
   * Raise an escalation with Itsi Mobile.
   */
  app.post('/escalations', { preHandler: [requireAuth, writeGuard] }, async (req: any, reply: any) => {
    const parsed = EscalationBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
    }
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.createEscalation(config, parsed.data);
      return reply.code(201).send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * GET /api/v1/wholesale/escalations/:id
   * Get an escalation by ID.
   */
  app.get('/escalations/:id', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.getEscalation(config, id);
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });
}
