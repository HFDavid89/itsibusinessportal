/**
 * Itsi Mobile Wholesale API Client
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * Mobile and Broadband use separate upstream route families.
 * This client does NOT call Gamma, KCOM, MS3, OTS Hero, or any provider API directly.
 */

import {
  orderCreatePath,
  orderGetPath,
  orderStatusPath,
  productsPath,
  quotePath,
  WHOLESALE_API_PATHS,
  type WholesaleServiceFamily,
} from './wholesale-paths';

export type { WholesaleServiceFamily };

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

export interface WholesaleProduct {
  productCode: string;
  name: string;
  description?: string;
  contractTermMonths?: number;
  accessTechnology?: string;
}

export interface WholesaleBroadbandAvailabilityResult {
  postcode: string;
  uprn?: string;
  available: boolean;
  accessTechnologies: string[];
  leadTimeDays?: number;
}

export interface MobileWholesaleQuoteParams {
  productCode?: string;
  contractTermMonths?: number;
  simType?: string;
  simQuantity?: number;
  userCount?: number;
}

export interface BroadbandWholesaleQuoteParams {
  postcode: string;
  uprn?: string;
  productCode?: string;
  contractTermMonths?: number;
  accessTechnology?: string;
}

export interface WholesaleQuoteResult {
  quoteId: string;
  serviceType: WholesaleServiceFamily;
  wholesalePricePence: number;
  setupCostPence: number;
  contractTermMonths: number;
  expiresAt: string;
}

export interface MobileWholesaleOrderPayload {
  businessAccountId: string;
  businessServiceReference: string;
  quoteId?: string;
  productCode?: string;
  contractTermMonths?: number;
  simType?: string;
  simQuantity?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface BroadbandWholesaleOrderPayload {
  businessAccountId: string;
  businessServiceReference: string;
  quoteId?: string;
  postcode: string;
  uprn?: string;
  productCode?: string;
  accessTechnology?: string;
  installContactName?: string;
  installContactPhone?: string;
  installContactEmail?: string;
  notes?: string;
}

export interface WholesaleOrderResult {
  orderId: string;
  serviceType: WholesaleServiceFamily;
  status: string;
  serviceOrderId?: string;
  safeProviderReference?: string;
  message?: string;
  estimatedProvisionDate?: string;
}

export interface WholesaleOrderStatus {
  orderId: string;
  serviceType: WholesaleServiceFamily;
  status: string;
  safeProviderReference?: string;
  lastUpdatedAt: string;
  events: { occurredAt: string; status: string; note?: string }[];
}

export interface MaskedUpstreamError {
  upstreamStatus: number;
  upstreamCode?: string;
  upstreamMessage?: string;
  requestId?: string;
}

export interface WholesaleEscalationPayload {
  serviceType: WholesaleServiceFamily;
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

// ─── Circuit breaker ──────────────────────────────────────────────────────────

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

export class WholesaleConfigError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'WholesaleConfigError';
  }
}

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

// ─── Config ───────────────────────────────────────────────────────────────────

export function isWholesaleEnabled(): boolean {
  return (process.env.ITSI_MOBILE_WHOLESALE_ENABLED ?? 'false') === 'true';
}

export function loadWholesaleConfig(): WholesaleClientConfig {
  const timeoutMs     = parseInt(process.env.ITSI_MOBILE_WHOLESALE_TIMEOUT_MS ?? '10000', 10);
  const retryAttempts = parseInt(process.env.ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS ?? '3', 10);

  if (isWholesaleEnabled()) {
    if (!process.env.ITSI_MOBILE_API_BASE_URL) {
      throw new WholesaleConfigError('ITSI_MOBILE_API_BASE_URL', 'ITSI_MOBILE_API_BASE_URL is required when ITSI_MOBILE_WHOLESALE_ENABLED=true');
    }
    if (!process.env.ITSI_MOBILE_WHOLESALE_API_KEY) {
      throw new WholesaleConfigError('ITSI_MOBILE_WHOLESALE_API_KEY', 'ITSI_MOBILE_WHOLESALE_API_KEY is required when ITSI_MOBILE_WHOLESALE_ENABLED=true');
    }
    if (isNaN(timeoutMs) || timeoutMs < 100) {
      throw new WholesaleConfigError('ITSI_MOBILE_WHOLESALE_TIMEOUT_MS', 'ITSI_MOBILE_WHOLESALE_TIMEOUT_MS must be a number >= 100');
    }
    if (isNaN(retryAttempts) || retryAttempts < 0 || retryAttempts > 10) {
      throw new WholesaleConfigError('ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS', 'ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS must be 0–10');
    }
  }

  return {
    baseUrl:               process.env.ITSI_MOBILE_API_BASE_URL   ?? '',
    apiKey:                process.env.ITSI_MOBILE_WHOLESALE_API_KEY ?? '',
    timeoutMs:             isNaN(timeoutMs)     ? 10000 : timeoutMs,
    retryAttempts:         isNaN(retryAttempts) ? 3     : retryAttempts,
    circuitBreakerEnabled: (process.env.ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED ?? 'true') === 'true',
  };
}

export function maskUpstreamError(statusCode: number, body: unknown): MaskedUpstreamError {
  const safe: MaskedUpstreamError = { upstreamStatus: statusCode };
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b['code'] === 'string')      safe.upstreamCode    = b['code'];
    if (typeof b['message'] === 'string')   safe.upstreamMessage = b['message'];
    if (typeof b['requestId'] === 'string') safe.requestId       = b['requestId'];
  }
  return safe;
}

function normalizeOrderResult(
  serviceType: WholesaleServiceFamily,
  data: Record<string, unknown>,
): WholesaleOrderResult {
  return {
    orderId: String(data.orderId ?? data.id ?? ''),
    serviceType: (data.serviceType as WholesaleServiceFamily) ?? serviceType,
    status: String(data.status ?? 'UNKNOWN'),
    serviceOrderId: typeof data.serviceOrderId === 'string' ? data.serviceOrderId
      : typeof data.itsiMobileServiceOrderId === 'string' ? data.itsiMobileServiceOrderId
      : undefined,
    safeProviderReference: typeof data.safeProviderReference === 'string' ? data.safeProviderReference : undefined,
    message: typeof data.message === 'string' ? data.message : undefined,
    estimatedProvisionDate: typeof data.estimatedProvisionDate === 'string' ? data.estimatedProvisionDate : undefined,
  };
}

function normalizeOrderStatus(
  serviceType: WholesaleServiceFamily,
  orderId: string,
  data: Record<string, unknown>,
): WholesaleOrderStatus {
  const events = Array.isArray(data.events)
    ? data.events.map((e) => {
        const ev = e as Record<string, unknown>;
        return {
          occurredAt: String(ev.occurredAt ?? ev.createdAt ?? ''),
          status: String(ev.status ?? ''),
          note: typeof ev.note === 'string' ? ev.note : undefined,
        };
      })
    : [];

  return {
    orderId: String(data.orderId ?? orderId),
    serviceType: (data.serviceType as WholesaleServiceFamily) ?? serviceType,
    status: String(data.status ?? 'UNKNOWN'),
    safeProviderReference: typeof data.safeProviderReference === 'string' ? data.safeProviderReference : undefined,
    lastUpdatedAt: String(data.lastUpdatedAt ?? data.updatedAt ?? new Date().toISOString()),
    events,
  };
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
  async ping(config: WholesaleClientConfig): Promise<WholesalePingResult> {
    const start = Date.now();
    try {
      const data = await wholesaleFetch<{ version?: string; message?: string }>(config, 'GET', WHOLESALE_API_PATHS.health);
      return { ok: true, latencyMs: Date.now() - start, version: data.version, message: data.message };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  },

  async getProducts(config: WholesaleClientConfig, serviceType: WholesaleServiceFamily): Promise<WholesaleProduct[]> {
    const data = await wholesaleFetch<{ products?: WholesaleProduct[] } | WholesaleProduct[]>(
      config, 'GET', productsPath(serviceType),
    );
    return Array.isArray(data) ? data : (data.products ?? []);
  },

  async getBroadbandAvailability(
    config: WholesaleClientConfig,
    postcode: string,
    uprn?: string,
  ): Promise<WholesaleBroadbandAvailabilityResult> {
    const qs = new URLSearchParams({ postcode });
    if (uprn) qs.set('uprn', uprn);
    return wholesaleFetch<WholesaleBroadbandAvailabilityResult>(
      config, 'GET', `${WHOLESALE_API_PATHS.broadbandAvailability}?${qs}`,
    );
  },

  async getMobileQuote(config: WholesaleClientConfig, params: MobileWholesaleQuoteParams): Promise<WholesaleQuoteResult> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'POST', WHOLESALE_API_PATHS.mobileQuote, params);
    return {
      quoteId: String(data.quoteId ?? ''),
      serviceType: 'MOBILE',
      wholesalePricePence: Number(data.wholesalePricePence ?? 0),
      setupCostPence: Number(data.setupCostPence ?? 0),
      contractTermMonths: Number(data.contractTermMonths ?? 0),
      expiresAt: String(data.expiresAt ?? ''),
    };
  },

  async getBroadbandQuote(config: WholesaleClientConfig, params: BroadbandWholesaleQuoteParams): Promise<WholesaleQuoteResult> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'POST', WHOLESALE_API_PATHS.broadbandQuote, params);
    return {
      quoteId: String(data.quoteId ?? ''),
      serviceType: 'BROADBAND',
      wholesalePricePence: Number(data.wholesalePricePence ?? 0),
      setupCostPence: Number(data.setupCostPence ?? 0),
      contractTermMonths: Number(data.contractTermMonths ?? 0),
      expiresAt: String(data.expiresAt ?? ''),
    };
  },

  async getQuote(
    config: WholesaleClientConfig,
    serviceType: WholesaleServiceFamily,
    params: MobileWholesaleQuoteParams | BroadbandWholesaleQuoteParams,
  ): Promise<WholesaleQuoteResult> {
    return serviceType === 'MOBILE'
      ? this.getMobileQuote(config, params as MobileWholesaleQuoteParams)
      : this.getBroadbandQuote(config, params as BroadbandWholesaleQuoteParams);
  },

  async createMobileOrder(config: WholesaleClientConfig, payload: MobileWholesaleOrderPayload): Promise<WholesaleOrderResult> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'POST', WHOLESALE_API_PATHS.mobileOrders, payload);
    return normalizeOrderResult('MOBILE', data);
  },

  async createBroadbandOrder(config: WholesaleClientConfig, payload: BroadbandWholesaleOrderPayload): Promise<WholesaleOrderResult> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'POST', WHOLESALE_API_PATHS.broadbandOrders, payload);
    return normalizeOrderResult('BROADBAND', data);
  },

  async createOrder(
    config: WholesaleClientConfig,
    serviceType: WholesaleServiceFamily,
    payload: MobileWholesaleOrderPayload | BroadbandWholesaleOrderPayload,
  ): Promise<WholesaleOrderResult> {
    return serviceType === 'MOBILE'
      ? this.createMobileOrder(config, payload as MobileWholesaleOrderPayload)
      : this.createBroadbandOrder(config, payload as BroadbandWholesaleOrderPayload);
  },

  async getMobileOrder(config: WholesaleClientConfig, orderId: string): Promise<WholesaleOrderResult> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'GET', WHOLESALE_API_PATHS.mobileOrder(orderId));
    return normalizeOrderResult('MOBILE', data);
  },

  async getBroadbandOrder(config: WholesaleClientConfig, orderId: string): Promise<WholesaleOrderResult> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'GET', WHOLESALE_API_PATHS.broadbandOrder(orderId));
    return normalizeOrderResult('BROADBAND', data);
  },

  async getOrder(config: WholesaleClientConfig, serviceType: WholesaleServiceFamily, orderId: string): Promise<WholesaleOrderResult> {
    return serviceType === 'MOBILE'
      ? this.getMobileOrder(config, orderId)
      : this.getBroadbandOrder(config, orderId);
  },

  async getMobileOrderStatus(config: WholesaleClientConfig, orderId: string): Promise<WholesaleOrderStatus> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'GET', WHOLESALE_API_PATHS.mobileOrderStatus(orderId));
    return normalizeOrderStatus('MOBILE', orderId, data);
  },

  async getBroadbandOrderStatus(config: WholesaleClientConfig, orderId: string): Promise<WholesaleOrderStatus> {
    const data = await wholesaleFetch<Record<string, unknown>>(config, 'GET', WHOLESALE_API_PATHS.broadbandOrderStatus(orderId));
    return normalizeOrderStatus('BROADBAND', orderId, data);
  },

  async getOrderStatus(
    config: WholesaleClientConfig,
    serviceType: WholesaleServiceFamily,
    orderId: string,
  ): Promise<WholesaleOrderStatus> {
    return serviceType === 'MOBILE'
      ? this.getMobileOrderStatus(config, orderId)
      : this.getBroadbandOrderStatus(config, orderId);
  },

  async createEscalation(config: WholesaleClientConfig, payload: WholesaleEscalationPayload): Promise<WholesaleEscalationResult> {
    return wholesaleFetch<WholesaleEscalationResult>(config, 'POST', WHOLESALE_API_PATHS.escalations, payload);
  },

  async getEscalation(config: WholesaleClientConfig, escalationId: string): Promise<WholesaleEscalationResult> {
    return wholesaleFetch<WholesaleEscalationResult>(config, 'GET', WHOLESALE_API_PATHS.escalation(escalationId));
  },

  /** Resolve upstream path for a service family — exposed for contract tests. */
  resolveOrderCreatePath(serviceType: WholesaleServiceFamily): string {
    return orderCreatePath(serviceType);
  },

  resolveOrderStatusPath(serviceType: WholesaleServiceFamily, orderId: string): string {
    return orderStatusPath(serviceType, orderId);
  },

  resolveQuotePath(serviceType: WholesaleServiceFamily): string {
    return quotePath(serviceType);
  },
};
