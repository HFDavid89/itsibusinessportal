/**
 * Itsi Mobile Wholesale API Client
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * This client calls Itsi Mobile wholesale APIs ONLY.
 * It does NOT call Gamma, KCOM, MS3, OTS Hero, or any provider API directly.
 */

export interface WholesaleClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  retryAttempts: number;
  circuitBreakerEnabled: boolean;
}

export interface WholesalePingResult {
  ok: boolean;
  latencyMs: number;
  version?: string;
  message?: string;
}

export interface WholesaleAvailabilityResult {
  postcode: string;
  uprn?: string;
  available: boolean;
  serviceTypes: string[];
  leadTimeDays?: number;
  raw?: unknown;
}

export interface WholesaleQuoteParams {
  serviceType: 'MOBILE' | 'BROADBAND' | 'ENERGY';
  postcode?: string;
  uprn?: string;
  productCode?: string;
  contractTermMonths?: number;
}

export interface WholesaleQuoteResult {
  quoteId: string;
  serviceType: string;
  wholesalePricePence: number;
  setupCostPence: number;
  contractTermMonths: number;
  expiresAt: string;
  raw?: unknown;
}

export interface WholesaleOrderPayload {
  serviceType: 'MOBILE' | 'BROADBAND';
  businessAccountId: string;
  businessServiceReference: string;
  quoteId?: string;
  postcode?: string;
  uprn?: string;
  productCode?: string;
  contactName?: string;
  contactPhone?: string;
  contractTermMonths?: number;
  notes?: string;
}

export interface WholesaleOrderResult {
  orderId: string;
  status: string;
  estimatedProvisionDate?: string;
  raw?: unknown;
}

export interface WholesaleOrderStatus {
  orderId: string;
  status: string;
  providerReference?: string;
  lastUpdatedAt: string;
  events: { occurredAt: string; status: string; note?: string }[];
}

export interface WholesaleEscalationPayload {
  orderId?: string;
  businessServiceReference: string;
  subject: string;
  description: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface WholesaleEscalationResult {
  escalationId: string;
  status: string;
  createdAt: string;
}

// ─── Circuit breaker state ────────────────────────────────────────────────────

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

const CIRCUIT_OPEN_DURATION_MS = 30_000;
const CIRCUIT_FAILURE_THRESHOLD = 5;

let circuitState: CircuitState = 'CLOSED';
let circuitFailureCount = 0;
let circuitOpenedAt: number | null = null;

function checkCircuit(): void {
  if (circuitState === 'OPEN') {
    const elapsed = Date.now() - (circuitOpenedAt ?? 0);
    if (elapsed > CIRCUIT_OPEN_DURATION_MS) {
      circuitState = 'HALF_OPEN';
    } else {
      throw new WholesaleCircuitOpenError();
    }
  }
}

function onSuccess(): void {
  circuitFailureCount = 0;
  circuitState = 'CLOSED';
  circuitOpenedAt = null;
}

function onFailure(enabled: boolean): void {
  if (!enabled) return;
  circuitFailureCount++;
  if (circuitFailureCount >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitState = 'OPEN';
    circuitOpenedAt = Date.now();
  }
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class WholesaleDisabledError extends Error {
  constructor() {
    super('Itsi Mobile wholesale API is disabled (ITSI_MOBILE_WHOLESALE_ENABLED=false)');
    this.name = 'WholesaleDisabledError';
  }
}

export class WholesaleCircuitOpenError extends Error {
  constructor() {
    super('Wholesale API circuit breaker is OPEN — too many recent failures');
    this.name = 'WholesaleCircuitOpenError';
  }
}

export class WholesaleApiError extends Error {
  constructor(public statusCode: number, public body: unknown) {
    super(`Itsi Mobile wholesale API error: HTTP ${statusCode}`);
    this.name = 'WholesaleApiError';
  }
}

export class WholesaleTimeoutError extends Error {
  constructor() {
    super('Itsi Mobile wholesale API request timed out');
    this.name = 'WholesaleTimeoutError';
  }
}

// ─── Config loader ────────────────────────────────────────────────────────────

export function loadWholesaleConfig(): WholesaleClientConfig {
  return {
    baseUrl:               process.env.ITSI_MOBILE_API_BASE_URL   ?? '',
    apiKey:                process.env.ITSI_MOBILE_WHOLESALE_API_KEY ?? '',
    timeoutMs:             parseInt(process.env.ITSI_MOBILE_WHOLESALE_TIMEOUT_MS ?? '10000', 10),
    retryAttempts:         parseInt(process.env.ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS ?? '3', 10),
    circuitBreakerEnabled: (process.env.ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED ?? 'true') === 'true',
  };
}

export function isWholesaleEnabled(): boolean {
  return (process.env.ITSI_MOBILE_WHOLESALE_ENABLED ?? 'false') === 'true';
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function wholesaleFetch<T>(
  config: WholesaleClientConfig,
  method: string,
  path: string,
  body?: unknown,
  attemptsLeft?: number,
): Promise<T> {
  if (!isWholesaleEnabled()) throw new WholesaleDisabledError();
  if (config.circuitBreakerEnabled) checkCircuit();

  const attempts = attemptsLeft ?? config.retryAttempts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Client': 'itsi-business',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      onFailure(config.circuitBreakerEnabled);
      // Retry on 5xx only
      if (res.status >= 500 && attempts > 1) {
        return wholesaleFetch<T>(config, method, path, body, attempts - 1);
      }
      throw new WholesaleApiError(res.status, errorBody);
    }

    onSuccess();
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') {
      onFailure(config.circuitBreakerEnabled);
      throw new WholesaleTimeoutError();
    }
    if (err instanceof WholesaleDisabledError || err instanceof WholesaleCircuitOpenError ||
        err instanceof WholesaleApiError || err instanceof WholesaleTimeoutError) {
      throw err;
    }
    onFailure(config.circuitBreakerEnabled);
    if (attempts > 1) {
      return wholesaleFetch<T>(config, method, path, body, attempts - 1);
    }
    throw err;
  }
}

// ─── Public client ────────────────────────────────────────────────────────────

export const itsiMobileClient = {
  /**
   * Ping the Itsi Mobile wholesale API. Used for connectivity tests.
   */
  async ping(config: WholesaleClientConfig): Promise<WholesalePingResult> {
    const start = Date.now();
    try {
      const data = await wholesaleFetch<{ version?: string; message?: string }>(config, 'GET', '/api/v1/health');
      return { ok: true, latencyMs: Date.now() - start, version: data.version, message: data.message };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  },

  /**
   * Check broadband / mobile availability at a postcode/UPRN via Itsi Mobile.
   * Itsi Mobile proxies Gamma/KCOM/MS3 — we never call them directly.
   */
  async getAvailability(
    config: WholesaleClientConfig,
    postcode: string,
    uprn?: string,
  ): Promise<WholesaleAvailabilityResult> {
    const qs = new URLSearchParams({ postcode });
    if (uprn) qs.set('uprn', uprn);
    return wholesaleFetch<WholesaleAvailabilityResult>(config, 'GET', `/api/v1/wholesale/availability?${qs}`);
  },

  /**
   * Request a wholesale quote from Itsi Mobile for a given service type.
   */
  async getQuote(
    config: WholesaleClientConfig,
    params: WholesaleQuoteParams,
  ): Promise<WholesaleQuoteResult> {
    return wholesaleFetch<WholesaleQuoteResult>(config, 'POST', '/api/v1/wholesale/quotes', params);
  },

  /**
   * Submit a wholesale service order to Itsi Mobile.
   * Itsi Mobile will handle provider provisioning (Gamma, KCOM, etc.).
   */
  async createOrder(
    config: WholesaleClientConfig,
    payload: WholesaleOrderPayload,
  ): Promise<WholesaleOrderResult> {
    return wholesaleFetch<WholesaleOrderResult>(config, 'POST', '/api/v1/wholesale/orders', payload);
  },

  /**
   * Get a wholesale order by ID.
   */
  async getOrder(
    config: WholesaleClientConfig,
    orderId: string,
  ): Promise<WholesaleOrderResult> {
    return wholesaleFetch<WholesaleOrderResult>(config, 'GET', `/api/v1/wholesale/orders/${orderId}`);
  },

  /**
   * Poll the live status of a wholesale order from Itsi Mobile.
   */
  async getOrderStatus(
    config: WholesaleClientConfig,
    orderId: string,
  ): Promise<WholesaleOrderStatus> {
    return wholesaleFetch<WholesaleOrderStatus>(config, 'GET', `/api/v1/wholesale/orders/${orderId}/status`);
  },

  /**
   * Raise a wholesale escalation with Itsi Mobile.
   */
  async createEscalation(
    config: WholesaleClientConfig,
    payload: WholesaleEscalationPayload,
  ): Promise<WholesaleEscalationResult> {
    return wholesaleFetch<WholesaleEscalationResult>(config, 'POST', '/api/v1/wholesale/escalations', payload);
  },

  /**
   * Get an escalation by ID.
   */
  async getEscalation(
    config: WholesaleClientConfig,
    escalationId: string,
  ): Promise<WholesaleEscalationResult> {
    return wholesaleFetch<WholesaleEscalationResult>(config, 'GET', `/api/v1/wholesale/escalations/${escalationId}`);
  },
};
