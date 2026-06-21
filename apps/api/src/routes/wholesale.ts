import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/authenticate';
import { requirePermission } from '../middleware/rbac';
import {
  itsiMobileClient,
  loadWholesaleConfig,
  isWholesaleEnabled,
  WholesaleDisabledError,
  WholesaleCircuitOpenError,
  WholesaleApiError,
  WholesaleTimeoutError,
  type WholesaleOrderPayload,
  type WholesaleEscalationPayload,
  type WholesaleQuoteParams,
} from '../services/wholesale/itsi-mobile-client';

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
  if (err instanceof WholesaleDisabledError) {
    reply.code(503).send({ success: false, error: { code: 'WHOLESALE_DISABLED', message: err.message } });
  } else if (err instanceof WholesaleCircuitOpenError) {
    reply.code(503).send({ success: false, error: { code: 'CIRCUIT_OPEN', message: err.message } });
  } else if (err instanceof WholesaleTimeoutError) {
    reply.code(504).send({ success: false, error: { code: 'WHOLESALE_TIMEOUT', message: err.message } });
  } else if (err instanceof WholesaleApiError) {
    reply.code(502).send({ success: false, error: { code: 'WHOLESALE_API_ERROR', message: err.message, upstream: err.body } });
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
    const { postcode, uprn } = req.query as { postcode?: string; uprn?: string };
    if (!postcode) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'postcode is required' } });
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
    const body = req.body as WholesaleQuoteParams;
    if (!body?.serviceType) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'serviceType is required' } });
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.getQuote(config, body);
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
    const body = req.body as WholesaleOrderPayload;
    if (!body?.serviceType || !body?.businessAccountId || !body?.businessServiceReference) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'serviceType, businessAccountId and businessServiceReference are required' } });
    }
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.createOrder(config, body);
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
    const body = req.body as WholesaleEscalationPayload;
    if (!body?.businessServiceReference || !body?.subject || !body?.description) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'businessServiceReference, subject and description are required' } });
    }
    try {
      const config = loadWholesaleConfig();
      const data   = await itsiMobileClient.createEscalation(config, body);
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
