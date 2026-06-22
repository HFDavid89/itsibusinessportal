import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { FORBIDDEN_UPSTREAM_WHOLESALE_FIELDS } from './wholesale-payload-sanitize';

export interface MockRequestRecord {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  body: unknown;
  sourceOrderId?: string;
  serviceType?: 'MOBILE' | 'BROADBAND';
  hadForbiddenFields: boolean;
  hadAuthorization: boolean;
  hadXClient: boolean;
}

export interface MockRouteResponse {
  status: number;
  body: unknown;
}

type RouteKey =
  | 'POST /api/v1/wholesale/orders/mobile'
  | 'POST /api/v1/wholesale/orders/broadband'
  | 'GET /api/v1/wholesale/orders/mobile/:id/status'
  | 'GET /api/v1/wholesale/orders/broadband/:id/status'
  | 'GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status'
  | 'GET /api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status'
  | 'POST /api/v1/wholesale/escalations'
  | 'GET /api/v1/health'
  | 'GET /api/v1/wholesale/products/mobile'
  | 'GET /api/v1/wholesale/products/broadband'
  | 'GET /api/v1/wholesale/availability/broadband'
  | 'POST /api/v1/wholesale/quotes/mobile'
  | 'POST /api/v1/wholesale/quotes/broadband';

const ROUTE_PATTERNS: Array<{ key: RouteKey; method: string; pattern: RegExp }> = [
  { key: 'POST /api/v1/wholesale/orders/mobile', method: 'POST', pattern: /^\/api\/v1\/wholesale\/orders\/mobile$/ },
  { key: 'POST /api/v1/wholesale/orders/broadband', method: 'POST', pattern: /^\/api\/v1\/wholesale\/orders\/broadband$/ },
  { key: 'GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status', method: 'GET', pattern: /^\/api\/v1\/wholesale\/orders\/mobile\/by-source\/[^/]+\/status$/ },
  { key: 'GET /api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status', method: 'GET', pattern: /^\/api\/v1\/wholesale\/orders\/broadband\/by-source\/[^/]+\/status$/ },
  { key: 'GET /api/v1/wholesale/orders/mobile/:id/status', method: 'GET', pattern: /^\/api\/v1\/wholesale\/orders\/mobile\/[^/]+\/status$/ },
  { key: 'GET /api/v1/wholesale/orders/broadband/:id/status', method: 'GET', pattern: /^\/api\/v1\/wholesale\/orders\/broadband\/[^/]+\/status$/ },
  { key: 'POST /api/v1/wholesale/escalations', method: 'POST', pattern: /^\/api\/v1\/wholesale\/escalations$/ },
  { key: 'GET /api/v1/health', method: 'GET', pattern: /^\/api\/v1\/health$/ },
  { key: 'GET /api/v1/wholesale/products/mobile', method: 'GET', pattern: /^\/api\/v1\/wholesale\/products\/mobile$/ },
  { key: 'GET /api/v1/wholesale/products/broadband', method: 'GET', pattern: /^\/api\/v1\/wholesale\/products\/broadband$/ },
  { key: 'GET /api/v1/wholesale/availability/broadband', method: 'GET', pattern: /^\/api\/v1\/wholesale\/availability\/broadband/ },
  { key: 'POST /api/v1/wholesale/quotes/mobile', method: 'POST', pattern: /^\/api\/v1\/wholesale\/quotes\/mobile$/ },
  { key: 'POST /api/v1/wholesale/quotes/broadband', method: 'POST', pattern: /^\/api\/v1\/wholesale\/quotes\/broadband$/ },
];

function inferServiceType(path: string): 'MOBILE' | 'BROADBAND' | undefined {
  if (path.includes('/orders/mobile') || path.includes('/products/mobile') || path.includes('/quotes/mobile')) return 'MOBILE';
  if (path.includes('/orders/broadband') || path.includes('/products/broadband') || path.includes('/quotes/broadband') || path.includes('/availability/broadband')) return 'BROADBAND';
  return undefined;
}

function extractSourceOrderId(path: string, body: unknown): string | undefined {
  const bySource = path.match(/\/by-source\/([^/]+)\/status$/);
  if (bySource) return decodeURIComponent(bySource[1]);
  if (body && typeof body === 'object' && typeof (body as Record<string, unknown>).sourceOrderId === 'string') {
    return (body as Record<string, unknown>).sourceOrderId as string;
  }
  return undefined;
}

function bodyHadForbiddenFields(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const record = body as Record<string, unknown>;
  return FORBIDDEN_UPSTREAM_WHOLESALE_FIELDS.some((field) => field in record);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function defaultResponse(key: RouteKey): MockRouteResponse {
  switch (key) {
    case 'POST /api/v1/wholesale/orders/mobile':
      return { status: 201, body: { orderId: 'mock-mobile-ord-1', serviceType: 'MOBILE', status: 'SUBMITTED', serviceOrderId: 'mock-svc-ord-1' } };
    case 'POST /api/v1/wholesale/orders/broadband':
      return { status: 201, body: { orderId: 'mock-bb-ord-1', serviceType: 'BROADBAND', status: 'SUBMITTED', serviceOrderId: 'mock-bb-svc-ord-1' } };
    case 'GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status':
    case 'GET /api/v1/wholesale/orders/mobile/:id/status':
      return { status: 200, body: { orderId: 'mock-mobile-ord-1', serviceType: 'MOBILE', status: 'PROVISIONED', lastUpdatedAt: new Date().toISOString(), events: [] } };
    case 'GET /api/v1/wholesale/orders/broadband/by-source/:sourceOrderId/status':
    case 'GET /api/v1/wholesale/orders/broadband/:id/status':
      return { status: 200, body: { orderId: 'mock-bb-ord-1', serviceType: 'BROADBAND', status: 'PROVISIONED', lastUpdatedAt: new Date().toISOString(), events: [] } };
    case 'POST /api/v1/wholesale/escalations':
      return { status: 201, body: { escalationId: 'mock-esc-1', status: 'OPEN', createdAt: new Date().toISOString() } };
    case 'GET /api/v1/health':
      return { status: 200, body: { version: '14W-mock', message: 'ok' } };
    case 'GET /api/v1/wholesale/products/mobile':
      return { status: 200, body: { products: [{ code: 'MOB-TRIO', name: 'Mobile Trio' }] } };
    case 'GET /api/v1/wholesale/products/broadband':
      return { status: 200, body: { products: [{ code: 'BB-FTTP', name: 'FTTP 100' }] } };
    case 'GET /api/v1/wholesale/availability/broadband':
      return { status: 200, body: { postcode: 'EC1A1BB', technologies: ['FTTP'] } };
    case 'POST /api/v1/wholesale/quotes/mobile':
      return { status: 200, body: { quoteId: 'mock-mob-quote-1', wholesalePricePence: 1000, setupCostPence: 0, contractTermMonths: 24, expiresAt: new Date().toISOString() } };
    case 'POST /api/v1/wholesale/quotes/broadband':
      return { status: 200, body: { quoteId: 'mock-bb-quote-1', wholesalePricePence: 2000, setupCostPence: 0, contractTermMonths: 24, expiresAt: new Date().toISOString() } };
    default:
      return { status: 404, body: { code: 'NOT_FOUND', message: 'No mock handler' } };
  }
}

export class MockItsiMobileServer {
  readonly requests: MockRequestRecord[] = [];
  private readonly handlers = new Map<RouteKey, MockRouteResponse>();
  private server: http.Server | null = null;
  port = 0;

  constructor() {
    for (const route of ROUTE_PATTERNS) {
      this.handlers.set(route.key, defaultResponse(route.key));
    }
  }

  setResponse(key: RouteKey, response: MockRouteResponse): void {
    this.handlers.set(key, response);
  }

  reset(): void {
    this.requests.length = 0;
    this.handlers.clear();
    for (const route of ROUTE_PATTERNS) {
      this.handlers.set(route.key, defaultResponse(route.key));
    }
  }

  lastRequest(): MockRequestRecord | undefined {
    return this.requests.at(-1);
  }

  requestsForPath(pathFragment: string): MockRequestRecord[] {
    return this.requests.filter((r) => r.path.includes(pathFragment));
  }

  async start(): Promise<string> {
    if (this.server) return `http://127.0.0.1:${this.port}`;

    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const path = url.pathname;
      const method = req.method ?? 'GET';
      const body = method === 'GET' || method === 'HEAD' ? null : await readJsonBody(req);

      const record: MockRequestRecord = {
        method,
        path: `${path}${url.search}`,
        headers: {
          authorization: req.headers.authorization,
          'x-client': req.headers['x-client'] as string | undefined,
          'content-type': req.headers['content-type'] as string | undefined,
        },
        body,
        sourceOrderId: extractSourceOrderId(path, body),
        serviceType: inferServiceType(path),
        hadForbiddenFields: bodyHadForbiddenFields(body),
        hadAuthorization: typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer '),
        hadXClient: req.headers['x-client'] === 'itsi-business',
      };
      this.requests.push(record);

      const route = ROUTE_PATTERNS.find((r) => r.method === method && r.pattern.test(path));
      const response = route ? this.handlers.get(route.key) ?? defaultResponse(route.key) : { status: 404, body: { code: 'NOT_FOUND', message: `Unmocked ${method} ${path}` } };
      sendJson(res, response.status, response.body);
    });

    await new Promise<void>((resolve) => {
      this.server!.listen(0, '127.0.0.1', () => {
        const addr = this.server!.address();
        this.port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });

    return `http://127.0.0.1:${this.port}`;
  }

  async close(): Promise<void> {
    if (!this.server) return;
    await new Promise<void>((resolve, reject) => {
      this.server!.close((err) => (err ? reject(err) : resolve()));
    });
    this.server = null;
    this.port = 0;
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function applyWholesaleTestEnv(baseUrl: string, overrides?: Partial<NodeJS.ProcessEnv>): void {
  process.env.ITSI_MOBILE_WHOLESALE_ENABLED = 'true';
  process.env.ITSI_MOBILE_API_BASE_URL = baseUrl;
  process.env.ITSI_MOBILE_WHOLESALE_API_KEY = overrides?.ITSI_MOBILE_WHOLESALE_API_KEY ?? 'test-wholesale-key-13b1';
  process.env.ITSI_MOBILE_WHOLESALE_TIMEOUT_MS = overrides?.ITSI_MOBILE_WHOLESALE_TIMEOUT_MS ?? '5000';
  process.env.ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS = overrides?.ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS ?? '0';
  process.env.ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED = overrides?.ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED ?? 'false';
}

export function restoreWholesaleTestEnv(snapshot: NodeJS.ProcessEnv): void {
  for (const key of [
    'ITSI_MOBILE_WHOLESALE_ENABLED',
    'ITSI_MOBILE_API_BASE_URL',
    'ITSI_MOBILE_WHOLESALE_API_KEY',
    'ITSI_MOBILE_WHOLESALE_TIMEOUT_MS',
    'ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS',
    'ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED',
  ]) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
}

export function snapshotWholesaleEnv(): NodeJS.ProcessEnv {
  return {
    ITSI_MOBILE_WHOLESALE_ENABLED: process.env.ITSI_MOBILE_WHOLESALE_ENABLED,
    ITSI_MOBILE_API_BASE_URL: process.env.ITSI_MOBILE_API_BASE_URL,
    ITSI_MOBILE_WHOLESALE_API_KEY: process.env.ITSI_MOBILE_WHOLESALE_API_KEY,
    ITSI_MOBILE_WHOLESALE_TIMEOUT_MS: process.env.ITSI_MOBILE_WHOLESALE_TIMEOUT_MS,
    ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS: process.env.ITSI_MOBILE_WHOLESALE_RETRY_ATTEMPTS,
    ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED: process.env.ITSI_MOBILE_WHOLESALE_CIRCUIT_BREAKER_ENABLED,
  };
}
