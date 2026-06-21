import type { FastifyReply } from 'fastify';

/**
 * Refresh-token cookie for cross-subdomain SSO across all Itsi Business staff apps
 * (admin.itsi.business, crm.itsi.business, billing.itsi.business, desk.itsi.business).
 *
 * Adapted from Itsi Mobile: removed provider/tenant SSO concepts, scoped to itsi.business domain.
 */

const COOKIE_NAME = 'itsi_biz_refresh';

/** Cookie domain — covers all *.itsi.business subdomains in production. */
function cookieDomain(): string | undefined {
  return process.env.NODE_ENV === 'production' ? '.itsi.business' : undefined;
}

export function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    path: '/',
    domain: cookieDomain(),
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function clearRefreshCookie(reply: FastifyReply): void {
  reply.setCookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain(),
    maxAge: 0,
  });
}

export function getRefreshCookie(cookies: Record<string, string>): string | undefined {
  return cookies[COOKIE_NAME];
}
