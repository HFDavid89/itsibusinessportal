import type { FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from './authenticate';

const SUPER_ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'staff_admin']);

function hasPermission(ctx: { realm: string; roles: string[]; permissions?: string[] }, permission: string): boolean {
  if (ctx.realm === 'platform') return true;
  if (ctx.roles.some((r) => SUPER_ADMIN_ROLES.has(r))) return true;

  const perms = ctx.permissions ?? [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;

  // Legacy: role name matches permission string
  if (ctx.roles.some((r) => r === permission || r === '*' || r.endsWith('.admin'))) return true;

  return false;
}

/**
 * RBAC middleware for Itsi Business staff routes.
 *
 * Roles and flattened permissions are stored on the JWT payload.
 * Platform-realm users and PLATFORM_ADMIN bypass all permission checks.
 * Portal-realm users are never permitted on staff/admin routes.
 */

export function requirePermission(permission: string) {
  return async function permissionGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const ctx = request.accessContext!;

    if (ctx.realm === 'portal') {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Portal users cannot access staff endpoints' } });
      return;
    }

    if (!hasPermission(ctx, permission)) {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: `Missing required permission: ${permission}` } });
    }
  };
}

export function requireAnyPermission(...permissions: string[]) {
  return async function anyPermissionGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await requireAuth(request, reply);
    if (reply.sent) return;

    const ctx = request.accessContext!;

    if (ctx.realm === 'portal') {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Portal users cannot access staff endpoints' } });
      return;
    }

    const allowed = permissions.some((p) => hasPermission(ctx, p));
    if (!allowed) {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: `Requires one of: ${permissions.join(', ')}` } });
    }
  };
}
