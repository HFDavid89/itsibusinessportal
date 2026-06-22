import type { FastifyInstance } from 'fastify';
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
import {
  MobileQuoteBodySchema,
  BroadbandAvailabilityQuerySchema,
  BroadbandQuoteBodySchema,
  MobileOrderBodySchema,
  BroadbandOrderBodySchema,
  EscalationBodySchema,
  LegacyGenericOrderBodySchema,
} from '../services/wholesale/wholesale-payload-schemas';

/**
 * Wholesale routes expose the Itsi Mobile API boundary to internal staff.
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * These routes delegate ALL provider interactions to Itsi Mobile wholesale APIs.
 * They do NOT call Gamma, KCOM, MS3, or OTS Hero directly — ever.
 */

function deprecated(reply: any): void {
  reply.header('X-Deprecated', 'true');
  reply.header('Deprecation', 'true');
}

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
   * GET /api/v1/wholesale/availability/broadband?postcode=&uprn=
   */
  app.get('/availability/broadband', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const parsed = BroadbandAvailabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
    }
    try {
      const config = loadWholesaleConfig();
      const data = await itsiMobileClient.getBroadbandAvailability(config, parsed.data.postcode, parsed.data.uprn);
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * GET /api/v1/wholesale/products/mobile
   * GET /api/v1/wholesale/products/broadband
   */
  app.get('/products/:family', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const family = req.params.family as string;
    if (family !== 'mobile' && family !== 'broadband') {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Unknown product family' } });
    }
    const serviceType = family === 'mobile' ? 'MOBILE' : 'BROADBAND';
    try {
      const config = loadWholesaleConfig();
      const data = await itsiMobileClient.getProducts(config, serviceType);
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * POST /api/v1/wholesale/quotes/mobile
   * POST /api/v1/wholesale/quotes/broadband
   */
  app.post('/quotes/:family', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const family = req.params.family as string;
    if (family === 'mobile') {
      const parsed = MobileQuoteBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
      }
      try {
        const config = loadWholesaleConfig();
        const data = await itsiMobileClient.getMobileQuote(config, parsed.data);
        return reply.send({ success: true, data });
      } catch (err) {
        handleWholesaleError(err, reply);
      }
      return;
    }
    if (family === 'broadband') {
      const parsed = BroadbandQuoteBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
      }
      try {
        const config = loadWholesaleConfig();
        const data = await itsiMobileClient.getBroadbandQuote(config, parsed.data);
        return reply.send({ success: true, data });
      } catch (err) {
        handleWholesaleError(err, reply);
      }
      return;
    }
    return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Unknown quote family' } });
  });

  /**
   * POST /api/v1/wholesale/orders/mobile
   * POST /api/v1/wholesale/orders/broadband
   */
  app.post('/orders/:family', { preHandler: [requireAuth, writeGuard] }, async (req: any, reply: any) => {
    const family = req.params.family as string;
    const config = loadWholesaleConfig();

    if (family === 'mobile') {
      const parsed = MobileOrderBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
      }
      try {
        const data = await itsiMobileClient.createMobileOrder(config, parsed.data);
        return reply.code(201).send({ success: true, data });
      } catch (err) {
        handleWholesaleError(err, reply);
      }
      return;
    }

    if (family === 'broadband') {
      const parsed = BroadbandOrderBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
      }
      try {
        const data = await itsiMobileClient.createBroadbandOrder(config, parsed.data);
        return reply.code(201).send({ success: true, data });
      } catch (err) {
        handleWholesaleError(err, reply);
      }
      return;
    }

    return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Unknown order family' } });
  });

  /**
   * GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status
   * GET /api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status
   */
  app.get('/orders/:family/by-source/:sourceOrderId/status', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { family, sourceOrderId } = req.params as { family: string; sourceOrderId: string };
    const config = loadWholesaleConfig();
    try {
      const data = family === 'mobile'
        ? await itsiMobileClient.getMobileOrderStatusBySource(config, sourceOrderId)
        : family === 'broadband'
          ? await itsiMobileClient.getBroadbandOrderStatusBySource(config, sourceOrderId)
          : null;
      if (!data) {
        return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Unknown order family' } });
      }
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * GET /api/v1/wholesale/orders/mobile/:id
   * GET /api/v1/wholesale/orders/broadband/:id
   * GET /api/v1/wholesale/orders/mobile/:id/status
   * GET /api/v1/wholesale/orders/broadband/:id/status
   */
  app.get('/orders/:family/:id/status', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { family, id } = req.params as { family: string; id: string };
    const config = loadWholesaleConfig();
    try {
      const data = family === 'mobile'
        ? await itsiMobileClient.getMobileOrderStatus(config, id)
        : family === 'broadband'
          ? await itsiMobileClient.getBroadbandOrderStatus(config, id)
          : null;
      if (!data) {
        return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Unknown order family' } });
      }
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  app.get('/orders/:family/:id', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { family, id } = req.params as { family: string; id: string };
    const config = loadWholesaleConfig();
    try {
      const data = family === 'mobile'
        ? await itsiMobileClient.getMobileOrder(config, id)
        : family === 'broadband'
          ? await itsiMobileClient.getBroadbandOrder(config, id)
          : null;
      if (!data) {
        return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Unknown order family' } });
      }
      return reply.send({ success: true, data });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  // ─── Deprecated generic routes (route to family-specific upstream paths) ───

  /**
   * @deprecated Use GET /api/v1/wholesale/availability/broadband
   */
  app.get('/availability', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    deprecated(reply);
    const parsed = BroadbandAvailabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
    }
    try {
      const config = loadWholesaleConfig();
      const data = await itsiMobileClient.getBroadbandAvailability(config, parsed.data.postcode, parsed.data.uprn);
      return reply.send({ success: true, data, _deprecated: 'Use GET /api/v1/wholesale/availability/broadband' });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * @deprecated Use POST /api/v1/wholesale/quotes/mobile or /quotes/broadband
   */
  app.post('/quotes', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    deprecated(reply);
    const body = req.body as Record<string, unknown>;
    const serviceType = body.serviceType;
    if (serviceType !== 'MOBILE' && serviceType !== 'BROADBAND') {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'serviceType MOBILE or BROADBAND required' } });
    }
    try {
      const config = loadWholesaleConfig();
      const data = await itsiMobileClient.getQuote(config, serviceType, body as any);
      return reply.send({ success: true, data, _deprecated: `Use POST /api/v1/wholesale/quotes/${serviceType.toLowerCase()}` });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * @deprecated Use POST /api/v1/wholesale/orders/mobile or /orders/broadband
   */
  app.post('/orders', { preHandler: [requireAuth, writeGuard] }, async (req: any, reply: any) => {
    deprecated(reply);
    const parsed = LegacyGenericOrderBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors } });
    }
    const { serviceType, ...rest } = parsed.data;
    const sourceOrderId = rest.sourceOrderId ?? rest.businessServiceReference;
    const sourceCustomerReference = rest.sourceCustomerReference ?? rest.businessServiceReference;
    const attribution = {
      sourceOrderId,
      sourceCustomerReference,
      sourceServiceReference: rest.businessServiceReference,
      businessServiceReference: rest.businessServiceReference,
      quoteId: rest.quoteId,
      productCode: rest.productCode,
      contractTermMonths: rest.contractTermMonths,
      notes: rest.notes,
    };
    try {
      const config = loadWholesaleConfig();
      const data = serviceType === 'MOBILE'
        ? await itsiMobileClient.createMobileOrder(config, {
            ...attribution,
            contact: rest.contactName || rest.contactPhone
              ? { name: rest.contactName, phone: rest.contactPhone }
              : undefined,
          })
        : await itsiMobileClient.createBroadbandOrder(config, {
            ...attribution,
            postcode: rest.postcode!,
            uprn: rest.uprn,
            installContact: rest.contactName || rest.contactPhone
              ? { name: rest.contactName, phone: rest.contactPhone }
              : undefined,
          });
      return reply.code(201).send({
        success: true,
        data,
        _deprecated: `Use POST /api/v1/wholesale/orders/${serviceType.toLowerCase()}`,
      });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * @deprecated Use GET /api/v1/wholesale/orders/:family/:id — requires ?serviceType=MOBILE|BROADBAND
   */
  app.get('/orders/:id', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const serviceType = (req.query as { serviceType?: string }).serviceType;
    if (serviceType !== 'MOBILE' && serviceType !== 'BROADBAND') {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'serviceType query param MOBILE or BROADBAND required on deprecated route' },
      });
    }
    deprecated(reply);
    try {
      const config = loadWholesaleConfig();
      const data = await itsiMobileClient.getOrder(config, serviceType, id);
      return reply.send({
        success: true,
        data,
        _deprecated: `Use GET /api/v1/wholesale/orders/${serviceType.toLowerCase()}/${id}`,
      });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * @deprecated Use GET /api/v1/wholesale/orders/:family/:id/status — requires ?serviceType=
   */
  app.get('/orders/:id/status', { preHandler: [requireAuth, readGuard] }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const serviceType = (req.query as { serviceType?: string }).serviceType;
    if (serviceType !== 'MOBILE' && serviceType !== 'BROADBAND') {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'serviceType query param MOBILE or BROADBAND required on deprecated route' },
      });
    }
    deprecated(reply);
    try {
      const config = loadWholesaleConfig();
      const data = await itsiMobileClient.getOrderStatus(config, serviceType, id);
      return reply.send({
        success: true,
        data,
        _deprecated: `Use GET /api/v1/wholesale/orders/${serviceType.toLowerCase()}/${id}/status`,
      });
    } catch (err) {
      handleWholesaleError(err, reply);
    }
  });

  /**
   * POST /api/v1/wholesale/escalations
   * Shared route — serviceType required in body.
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
