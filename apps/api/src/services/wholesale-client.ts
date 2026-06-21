/**
 * Itsi Mobile Wholesale API Client — Placeholder
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * This client bridges Itsi Business → Itsi Mobile wholesale APIs.
 *
 * It does NOT:
 *   - Call Gamma, KCOM, MS3, or OTS Hero directly
 *   - Implement consumer portal behaviour
 *   - Expose provider credentials
 *
 * Required environment variables (set in .env):
 *   ITSI_MOBILE_API_BASE_URL       — Base URL of the Itsi Mobile API
 *   ITSI_MOBILE_WHOLESALE_API_KEY  — Shared wholesale API key
 *   ITSI_MOBILE_WHOLESALE_ENABLED  — 'true' to enable live calls (default: false)
 *   ITSI_MOBILE_WHOLESALE_TIMEOUT_MS — Request timeout in ms (default: 10000)
 */

import type {
  WholesaleOrderRequest,
  WholesaleOrderResponse,
  WholesaleOrderStatusResponse,
  WholesaleAddressResult,
  WholesaleEscalationRequest,
  WholesaleEscalationResponse,
} from '@itsi-business/types';

function getConfig() {
  return {
    baseUrl: process.env.ITSI_MOBILE_API_BASE_URL ?? '',
    apiKey: process.env.ITSI_MOBILE_WHOLESALE_API_KEY ?? '',
    enabled: process.env.ITSI_MOBILE_WHOLESALE_ENABLED === 'true',
    timeoutMs: parseInt(process.env.ITSI_MOBILE_WHOLESALE_TIMEOUT_MS ?? '10000', 10),
  };
}

function assertEnabled() {
  const { enabled, baseUrl } = getConfig();
  if (!enabled || !baseUrl) {
    throw new Error(
      'Itsi Mobile wholesale API is not enabled. ' +
        'Set ITSI_MOBILE_WHOLESALE_ENABLED=true and ITSI_MOBILE_API_BASE_URL in your environment.'
    );
  }
}

async function wholesaleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, apiKey, timeoutMs } = getConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Wholesale-Api-Key': apiKey,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Wholesale API error ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export const wholesaleClient = {
  isEnabled(): boolean {
    const { enabled, baseUrl } = getConfig();
    return enabled && !!baseUrl;
  },

  async getStatus(): Promise<{ connected: boolean; timestamp: string }> {
    assertEnabled();
    return wholesaleFetch('/api/v1/wholesale/health');
  },

  async searchAddresses(postcode: string): Promise<WholesaleAddressResult[]> {
    assertEnabled();
    return wholesaleFetch(`/api/v1/wholesale/availability/addresses?postcode=${encodeURIComponent(postcode)}`);
  },

  async placeOrder(order: WholesaleOrderRequest): Promise<WholesaleOrderResponse> {
    assertEnabled();
    return wholesaleFetch('/api/v1/wholesale/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async getOrderStatus(orderId: string): Promise<WholesaleOrderStatusResponse> {
    assertEnabled();
    return wholesaleFetch(`/api/v1/wholesale/orders/${orderId}/status`);
  },

  async createEscalation(escalation: WholesaleEscalationRequest): Promise<WholesaleEscalationResponse> {
    assertEnabled();
    return wholesaleFetch('/api/v1/wholesale/escalations', {
      method: 'POST',
      body: JSON.stringify(escalation),
    });
  },

  async getEscalationStatus(escalationId: string): Promise<WholesaleEscalationResponse> {
    assertEnabled();
    return wholesaleFetch(`/api/v1/wholesale/escalations/${escalationId}`);
  },
};
