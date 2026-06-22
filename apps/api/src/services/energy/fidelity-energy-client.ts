/**
 * Fidelity Energy integration client — placeholder boundary.
 *
 * RULE: Energy fulfilment uses Fidelity Energy, separate from Itsi Mobile wholesale.
 * Do NOT put Fidelity inside the Itsi Mobile wholesale client.
 * Do NOT invent endpoints or payload shapes until Fidelity confirms API documentation.
 */
import {
  type FidelityEnergyClientConfig,
  FidelityEnergyDisabledError,
  FidelityEnergyNotConfiguredError,
  FidelityEnergyNotReadyError,
  getFidelityEnergyReadiness,
  isFidelityEnergyEnabled,
  loadFidelityEnergyConfig,
} from './fidelity-energy-config';

export {
  FidelityEnergyDisabledError,
  FidelityEnergyNotConfiguredError,
  FidelityEnergyNotReadyError,
  isFidelityEnergyEnabled,
  getFidelityEnergyReadiness,
  loadFidelityEnergyConfig,
};

export interface FidelityEnergyPingResult {
  ok: boolean;
  latencyMs: number;
  message?: string;
}

/** Placeholder — real quote params TBD when Fidelity API docs are confirmed. */
export interface FidelityEnergyQuoteParams {
  meterPointReference?: string;
  fuelType?: 'ELECTRICITY' | 'GAS' | 'DUAL_FUEL';
  postcode?: string;
}

/** Placeholder — real order payload TBD. */
export interface FidelityEnergyOrderPayload {
  businessAccountId: string;
  businessServiceReference: string;
  quoteId?: string;
  notes?: string;
}

function assertClientReady(_config: FidelityEnergyClientConfig): void {
  const readiness = getFidelityEnergyReadiness();
  if (readiness === 'AWAITING_API_DOCUMENTATION') {
    throw new FidelityEnergyNotReadyError();
  }
}

export const fidelityEnergyClient = {
  /**
   * Connectivity check — placeholder until Fidelity endpoint is confirmed.
   */
  async ping(_config: FidelityEnergyClientConfig): Promise<FidelityEnergyPingResult> {
    assertClientReady(_config);
    throw new FidelityEnergyNotReadyError();
  },

  /** Placeholder — quote API TBD. */
  async getQuote(_config: FidelityEnergyClientConfig, _params: FidelityEnergyQuoteParams): Promise<never> {
    assertClientReady(_config);
    throw new FidelityEnergyNotReadyError();
  },

  /** Placeholder — order submission API TBD. */
  async submitOrder(_config: FidelityEnergyClientConfig, _payload: FidelityEnergyOrderPayload): Promise<never> {
    assertClientReady(_config);
    throw new FidelityEnergyNotReadyError();
  },

  /** Placeholder — order retrieval API TBD. */
  async getOrder(_config: FidelityEnergyClientConfig, _orderId: string): Promise<never> {
    assertClientReady(_config);
    throw new FidelityEnergyNotReadyError();
  },

  /** Placeholder — order status API TBD. */
  async getOrderStatus(_config: FidelityEnergyClientConfig, _orderId: string): Promise<never> {
    assertClientReady(_config);
    throw new FidelityEnergyNotReadyError();
  },

  /** Placeholder — escalation API TBD. */
  async raiseEscalation(_config: FidelityEnergyClientConfig, _payload: { subject: string; description: string; orderId?: string }): Promise<never> {
    assertClientReady(_config);
    throw new FidelityEnergyNotReadyError();
  },
};

export function getFidelityEnergyIntegrationStatus() {
  const enabled = isFidelityEnergyEnabled();
  const readiness = getFidelityEnergyReadiness();
  const configured = readiness !== 'DISABLED' && readiness !== 'NOT_CONFIGURED';

  const statusLabel: Record<string, string> = {
    DISABLED: 'Disabled',
    NOT_CONFIGURED: 'Not configured',
    AWAITING_API_DOCUMENTATION: 'Awaiting API documentation',
    READY_FOR_INTEGRATION: 'Ready for integration',
  };

  return {
    provider: 'Fidelity Energy',
    enabled,
    configured,
    readiness,
    statusLabel: statusLabel[readiness],
    message: readiness === 'DISABLED'
      ? 'Live API integration is not currently used. Sales and contract processing are completed directly in the Fidelity portal. Itsi Business tracks relationship and renewals only.'
      : readiness === 'NOT_CONFIGURED'
        ? 'Configure credentials only if business process changes. Tracking is CRM-managed today.'
        : 'Live API integration is not currently planned. Sales and contracts are completed in the Fidelity portal. Itsi Business tracks renewals only.',
    liveIntegrationAvailable: false,
  };
}
