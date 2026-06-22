import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/authenticate';
import { requirePermission } from '../middleware/rbac';
import {
  getFidelityEnergyIntegrationStatus,
  fidelityEnergyClient,
  loadFidelityEnergyConfig,
  isFidelityEnergyEnabled,
  FidelityEnergyDisabledError,
  FidelityEnergyNotConfiguredError,
  FidelityEnergyNotReadyError,
} from '../services/energy/fidelity-energy-client';

/**
 * Phase 11 — Fidelity Energy integration readiness routes (staff-only).
 * Separate boundary from Itsi Mobile wholesale. No live API calls until Phase 12A.
 */
export async function energyIntegrationRoutes(app: FastifyInstance) {
  const readGuard = requirePermission('wholesale.read');

  app.get('/status', { preHandler: [requireAuth, readGuard] }, async (_req, reply) => {
    return reply.send({ success: true, data: getFidelityEnergyIntegrationStatus() });
  });

  app.get('/ping', { preHandler: [requireAuth, readGuard] }, async (_req, reply) => {
    if (!isFidelityEnergyEnabled()) {
      return reply.send({
        success: true,
        data: { enabled: false, message: 'Fidelity Energy integration is disabled' },
      });
    }

    try {
      const config = loadFidelityEnergyConfig();
      const result = await fidelityEnergyClient.ping(config);
      return reply.send({ success: true, data: { enabled: true, ...result } });
    } catch (err) {
      if (err instanceof FidelityEnergyDisabledError) {
        return reply.send({ success: true, data: { enabled: false, message: err.message } });
      }
      if (err instanceof FidelityEnergyNotConfiguredError) {
        return reply.code(503).send({ success: false, error: { code: 'FIDELITY_NOT_CONFIGURED', message: err.message, field: err.field } });
      }
      if (err instanceof FidelityEnergyNotReadyError) {
        return reply.code(503).send({ success: false, error: { code: 'FIDELITY_NOT_READY', message: err.message } });
      }
      return reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected Fidelity Energy integration error' } });
    }
  });
}
