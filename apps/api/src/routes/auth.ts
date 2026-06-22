import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { verifyPassword, signToken } from '@itsi-business/auth';
import { requireAuth } from '../middleware/authenticate';

const COOKIE_NAME = 'itsi_biz_token';
const IS_PROD = process.env.NODE_ENV === 'production';

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function flattenPermissions(roles: { name: string; permissions: string[] }[]): string[] {
  const set = new Set<string>();
  for (const role of roles) {
    if (role.permissions.includes('*')) return ['*'];
    for (const p of role.permissions) set.add(p);
  }
  return [...set];
}

function makeToken(user: {
  id: string;
  email: string;
  realm: string;
  roles: { name: string; permissions: string[] }[];
  accountId?: string;
}): string {
  const permissions = flattenPermissions(user.roles);
  return signToken(
    {
      sub:   user.id,
      email: user.email,
      realm: user.realm as 'platform' | 'staff' | 'portal',
      roles: user.roles.map((r) => r.name),
      permissions,
      ...(user.accountId ? { accountId: user.accountId } : {}),
    },
    process.env.JWT_SECRET ?? '',
    process.env.JWT_EXPIRES_IN ?? '8h',
  );
}

export async function authRoutes(app: FastifyInstance) {
  // ── POST /api/v1/auth/login ───────────────────────────────────────────────
  app.post('/login', async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } });
    }

    const { email, password } = parsed.data;
    const emailLower = email.toLowerCase();

    const staffUser = await prisma.staffUser.findUnique({
      where: { email: emailLower },
      include: { roles: true },
    });

    if (staffUser?.isActive) {
      const valid = await verifyPassword(password, staffUser.passwordHash);
      if (!valid) {
        return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      }

      const token = makeToken(staffUser);
      reply.setCookie(COOKIE_NAME, token, sessionCookieOptions(8 * 60 * 60));

      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id:        staffUser.id,
            email:     staffUser.email,
            firstName: staffUser.firstName,
            lastName:  staffUser.lastName,
            realm:     staffUser.realm,
            roles:     staffUser.roles.map((r) => r.name),
          },
        },
      });
    }

    const portalUser = await prisma.portalUser.findUnique({
      where: { email: emailLower },
      include: { account: { select: { id: true, companyName: true } } },
    });

    if (!portalUser || !portalUser.isActive) {
      return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const portalValid = await verifyPassword(password, portalUser.passwordHash);
    if (!portalValid) {
      return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const token = makeToken({ ...portalUser, roles: [] });

    reply.setCookie(COOKIE_NAME, token, sessionCookieOptions(8 * 60 * 60));

    return reply.send({
      success: true,
      data: {
        token,
        user: {
          id:        portalUser.id,
          email:     portalUser.email,
          firstName: portalUser.firstName,
          lastName:  portalUser.lastName,
          realm:     portalUser.realm,
          roles:     [],
          accountId: portalUser.accountId,
        },
      },
    });
  });

  // ── GET /api/v1/auth/me ────────────────────────────────────────────────────
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const ctx = request.accessContext!;

    if (ctx.realm === 'portal') {
      const portalUser = await prisma.portalUser.findUnique({
        where: { id: ctx.userId },
        include: { account: { select: { id: true, accountNumber: true, companyName: true, status: true } } },
      });

      if (!portalUser || !portalUser.isActive) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORISED', message: 'User not found or inactive' } });
      }

      return reply.send({
        success: true,
        data: {
          id:        portalUser.id,
          email:     portalUser.email,
          firstName: portalUser.firstName,
          lastName:  portalUser.lastName,
          realm:     portalUser.realm,
          roles:     [],
          accountId: portalUser.accountId,
          account:   portalUser.account,
        },
      });
    }

    const user = await prisma.staffUser.findUnique({
      where: { id: ctx.userId },
      include: { roles: true },
    });

    if (!user || !user.isActive) {
      return reply.code(401).send({ success: false, error: { code: 'UNAUTHORISED', message: 'User not found or inactive' } });
    }

    return reply.send({
      success: true,
      data: {
        id:        user.id,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        realm:     user.realm,
        roles:     user.roles.map((r) => r.name),
      },
    });
  });

  // ── POST /api/v1/auth/logout ───────────────────────────────────────────────
  app.post('/logout', async (_request, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return reply.send({ success: true });
  });
}
