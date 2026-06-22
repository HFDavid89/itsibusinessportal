import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verifyToken } from '@itsi-business/auth';
import type { JwtPayload } from '../lib/jwt';

/**
 * Access context attached to authenticated requests.
 * Used by route handlers to access the calling user.
 */
export interface AccessContext {
  userId: string;
  email: string;
  realm: 'platform' | 'staff' | 'portal';
  roles: string[];
  permissions?: string[];
  accountId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    accessContext?: AccessContext;
  }
}

/**
 * Extract and verify the Bearer JWT from Authorization header.
 * Returns null if missing or invalid — callers decide how to respond.
 */
async function extractPayload(request: FastifyRequest): Promise<JwtPayload | null> {
  const auth = request.headers.authorization;
  const token = auth?.startsWith('Bearer ')
    ? auth.slice(7)
    : (request.cookies as Record<string, string>)?.['itsi_biz_token'];

  if (!token) return null;
  try {
    const secret  = process.env.JWT_SECRET ?? '';
    const payload = verifyToken(token, secret) as unknown as JwtPayload;
    return payload ?? null;
  } catch {
    return null;
  }
}

/**
 * Fastify preHandler: require a valid JWT of any realm.
 * Sets request.accessContext on success.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const payload = await extractPayload(request);
  if (!payload) {
    reply.code(401).send({ success: false, error: { code: 'UNAUTHORISED', message: 'Authentication required' } });
    return;
  }
  request.accessContext = {
    userId: payload.userId ?? (payload as { sub?: string }).sub ?? '',
    email: payload.email,
    realm: payload.realm,
    roles: payload.roles ?? [],
    permissions: (payload as { permissions?: string[] }).permissions ?? [],
    accountId: payload.accountId,
  };
}

/**
 * Fastify preHandler factory: require a specific realm.
 */
export function requireRealm(...realms: Array<'platform' | 'staff' | 'portal'>) {
  return async function realmGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;
    const ctx = request.accessContext!;
    if (!realms.includes(ctx.realm)) {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: `Realm '${ctx.realm}' is not permitted for this endpoint` } });
    }
  };
}
