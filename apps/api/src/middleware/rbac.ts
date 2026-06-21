import type { FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from './authenticate';

/**
 * RBAC middleware for Itsi Business staff routes.
 *
 * Roles are stored on the JWT payload (roles: string[]).
 * Platform-realm users bypass all permission checks (super-admin).
 * Staff-realm users must hold a matching role.
 * Portal-realm users are never permitted on staff/admin routes.
 */

/**
 * Require the caller to hold a specific role.
 * Platform realm bypasses — they are super-admins.
 */
export function requirePermission(permission: string) {
  return async function permissionGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const ctx = request.accessContext!;

    if (ctx.realm === 'platform') return; // platform bypasses all
    if (ctx.realm === 'portal') {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Portal users cannot access staff endpoints' } });
      return;
    }

    const hasPermission = ctx.roles.some(
      (r) => r === permission || r === 'staff_admin' || r.endsWith('.admin'),
    );

    if (!hasPermission) {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: `Missing required permission: ${permission}` } });
    }
  };
}

/**
 * Require the caller to hold at least one of the specified roles/permissions.
 */
export function requireAnyPermission(...permissions: string[]) {
  return async function anyPermissionGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const ctx = request.accessContext!;

    if (ctx.realm === 'platform') return;
    if (ctx.realm === 'portal') {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Portal users cannot access staff endpoints' } });
      return;
    }

    const hasAny = ctx.roles.some(
      (r) => r === 'staff_admin' || r.endsWith('.admin') || permissions.includes(r),
    );

    if (!hasAny) {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: `Requires one of: ${permissions.join(', ')}` } });
    }
  };
}
