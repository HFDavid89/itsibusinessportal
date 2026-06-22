import type { FastifyInstance } from 'fastify';

/**
 * Security middleware for the Itsi Business API.
 *
 * Adapted from Itsi Mobile: adjusted CORS origins for business domains,
 * removed provider/consumer portal CORS entries, kept all security headers.
 */

const ALLOWED_ORIGINS_DEV = [
  'http://localhost:17005', // admin
  'http://localhost:17006', // crm
  'http://localhost:17007', // billing
  'http://localhost:17008', // desk
  'http://localhost:17009', // portal
  'http://localhost:17010', // services
];

const ALLOWED_ORIGINS_PROD_PATTERN = /^https:\/\/([a-z0-9-]+\.)?itsi\.business$/;

function getAllowedOrigins(): string[] {
  const env = process.env.CORS_ALLOWED_ORIGINS;
  if (env) return env.split(',').map((s) => s.trim()).filter(Boolean);
  return ALLOWED_ORIGINS_DEV;
}

export async function registerSecurity(app: FastifyInstance): Promise<void> {
  const allowedOrigins = getAllowedOrigins();

  // ── Cookies ───────────────────────────────────────────────────────────────
  await app.register(import('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET ?? 'itsi-business-dev-cookie-secret',
  });

  // ── CORS ────────────────────────────────────────────────────────────────────
  await app.register(import('@fastify/cors'), {
    origin: (origin, cb) => {
      if (!origin) { cb(null, true); return; }
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        cb(null, ALLOWED_ORIGINS_PROD_PATTERN.test(origin));
      } else {
        cb(null, allowedOrigins.includes(origin));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  // ── Rate limiting ─────────────────────────────────────────────────────────
  await app.register(import('@fastify/rate-limit'), {
    max: 300,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests — please slow down' },
    }),
  });

  // ── Security headers ──────────────────────────────────────────────────────
  app.addHook('onSend', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    if (process.env.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    const apiUrl = process.env.API_URL ?? "'self'";
    reply.header(
      'Content-Security-Policy',
      [
        "default-src 'none'",
        `connect-src 'self' ${apiUrl}`,
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
      ].join('; '),
    );
  });

  // ── Request ID ────────────────────────────────────────────────────────────
  app.addHook('onRequest', async (req, reply) => {
    const id = req.headers['x-request-id'] as string ?? crypto.randomUUID();
    req.headers['x-request-id'] = id;
    reply.header('X-Request-Id', id);
  });
}

// ── Input helpers ─────────────────────────────────────────────────────────────

export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x1f\x7f]/g, '');
}

export function assertNonEmpty(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} must not be empty`);
}
