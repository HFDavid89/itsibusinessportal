/**
 * Fidelity Energy integration configuration.
 *
 * RULE: Energy fulfilment uses Fidelity Energy — NOT the Itsi Mobile wholesale bridge.
 * Do not call Fidelity APIs until documentation and credentials are confirmed.
 */

export interface FidelityEnergyClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  retryAttempts: number;
}

export type FidelityEnergyReadiness =
  | 'DISABLED'
  | 'NOT_CONFIGURED'
  | 'AWAITING_API_DOCUMENTATION'
  | 'READY_FOR_INTEGRATION';

export function isFidelityEnergyEnabled(): boolean {
  return (process.env.FIDELITY_ENERGY_ENABLED ?? 'false') === 'true';
}

export function getFidelityEnergyReadiness(): FidelityEnergyReadiness {
  if (!isFidelityEnergyEnabled()) return 'DISABLED';
  if (!process.env.FIDELITY_ENERGY_API_BASE_URL?.trim()) return 'NOT_CONFIGURED';
  if (!process.env.FIDELITY_ENERGY_API_KEY?.trim()) return 'NOT_CONFIGURED';
  // Real endpoints are not confirmed — remain in discovery until Phase 12A.
  return 'AWAITING_API_DOCUMENTATION';
}

export function loadFidelityEnergyConfig(): FidelityEnergyClientConfig {
  const timeoutMs = parseInt(process.env.FIDELITY_ENERGY_TIMEOUT_MS ?? '10000', 10);
  const retryAttempts = parseInt(process.env.FIDELITY_ENERGY_RETRY_ATTEMPTS ?? '3', 10);

  if (!isFidelityEnergyEnabled()) {
    throw new FidelityEnergyDisabledError();
  }
  if (!process.env.FIDELITY_ENERGY_API_BASE_URL?.trim()) {
    throw new FidelityEnergyNotConfiguredError('FIDELITY_ENERGY_API_BASE_URL');
  }
  if (!process.env.FIDELITY_ENERGY_API_KEY?.trim()) {
    throw new FidelityEnergyNotConfiguredError('FIDELITY_ENERGY_API_KEY');
  }
  if (isNaN(timeoutMs) || timeoutMs < 100) {
    throw new FidelityEnergyNotConfiguredError('FIDELITY_ENERGY_TIMEOUT_MS');
  }
  if (isNaN(retryAttempts) || retryAttempts < 0 || retryAttempts > 10) {
    throw new FidelityEnergyNotConfiguredError('FIDELITY_ENERGY_RETRY_ATTEMPTS');
  }

  return {
    baseUrl: process.env.FIDELITY_ENERGY_API_BASE_URL.replace(/\/$/, ''),
    apiKey: process.env.FIDELITY_ENERGY_API_KEY,
    timeoutMs,
    retryAttempts,
  };
}

export class FidelityEnergyDisabledError extends Error {
  constructor() {
    super('Fidelity Energy integration is disabled (FIDELITY_ENERGY_ENABLED=false)');
    this.name = 'FidelityEnergyDisabledError';
  }
}

export class FidelityEnergyNotConfiguredError extends Error {
  constructor(public field: string) {
    super(`Fidelity Energy integration is not configured (${field} missing or invalid)`);
    this.name = 'FidelityEnergyNotConfiguredError';
  }
}

export class FidelityEnergyNotReadyError extends Error {
  constructor() {
    super('Fidelity Energy API integration is not ready — awaiting confirmed API documentation');
    this.name = 'FidelityEnergyNotReadyError';
  }
}
