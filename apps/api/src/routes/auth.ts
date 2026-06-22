import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { verifyPassword, signToken } from '@itsi-business/auth';
import { requireAuth } from '../middleware/authenticate';

const COOKIE_NAME = 'itsi_biz_token';
const IS_PROD = process.env.NODE_ENV === 'production';

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function makeToken(user: { id: string; email: string; realm: string; roles: { name: string }[] }): string {
  return signToken(
    {
      sub:   user.id,
      email: user.email,
      realm: user.realm as 'platform' | 'staff' | 'portal',
      roles: user.roles.map((r) => r.name),
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

    const user = await prisma.staffUser.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: true },
    });

    if (!user || !user.isActive) {
      return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const token = makeToken(user);

    reply.setCookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   IS_PROD,
      sameSite: 'lax',
      path:     '/',
      maxAge:   8 * 60 * 60,
    });

    return reply.send({
      success: true,
      data: {
        token,
        user: {
          id:        user.id,
          email:     user.email,
          firstName: user.firstName,
          lastName:  user.lastName,
          realm:     user.realm,
          roles:     user.roles.map((r) => r.name),
        },
      },
    });
  });

  // ── GET /api/v1/auth/me ────────────────────────────────────────────────────
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const ctx = request.accessContext!;

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
