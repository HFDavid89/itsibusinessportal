import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@itsi-business/database';
import { hashPassword } from '@itsi-business/auth';
import { requireAuth, requireRealm } from '../middleware/authenticate';
import { requirePermission } from '../middleware/rbac';

const guard = { preHandler: [requireAuth, requireRealm('staff', 'platform'), requirePermission('admin.staff.manage')] };

const CreateStaffUserSchema = z.object({
  email:     z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  password:  z.string().min(8).max(200),
  realm:     z.enum(['staff', 'platform']).default('staff'),
  roleIds:   z.array(z.string()).optional(),
});

const PatchStaffUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName:  z.string().min(1).max(100).optional(),
  email:     z.string().email().optional(),
  isActive:  z.boolean().optional(),
  realm:     z.enum(['staff', 'platform']).optional(),
  roleIds:   z.array(z.string()).optional(),
  password:  z.string().min(8).max(200).optional(),
}).strict();

const SAFE_SELECT = {
  id: true, email: true, firstName: true, lastName: true,
  realm: true, isActive: true, createdAt: true, updatedAt: true,
  roles: { select: { id: true, name: true, permissions: true } },
} as const;

export async function staffUserRoutes(app: FastifyInstance) {

  // ── GET /api/v1/admin/staff ───────────────────────────────────────────────
  app.get('/', guard, async (req: any, reply: any) => {
    const { search, isActive, page = '1', limit = '50' } = (req.query ?? {}) as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: any = {
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      ...(search ? { OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ]} : {}),
    };

    const [users, total] = await Promise.all([
      prisma.staffUser.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: SAFE_SELECT }),
      prisma.staffUser.count({ where }),
    ]);

    return reply.send({ success: true, data: users, meta: { total, page: parseInt(page, 10), limit: take } });
  });

  // ── GET /api/v1/admin/staff/:id ───────────────────────────────────────────
  app.get('/:id', guard, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const user = await prisma.staffUser.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Staff user not found' } });
    return reply.send({ success: true, data: user });
  });

  // ── POST /api/v1/admin/staff ──────────────────────────────────────────────
  app.post('/', guard, async (req: any, reply: any) => {
    const parsed = CreateStaffUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }
    const { email, firstName, lastName, password, realm, roleIds } = parsed.data;

    const existing = await prisma.staffUser.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return reply.code(409).send({ success: false, error: { code: 'CONFLICT', message: 'Email already in use' } });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.staffUser.create({
      data: {
        email, firstName, lastName, passwordHash, realm,
        ...(roleIds?.length ? { roles: { connect: roleIds.map((id) => ({ id })) } } : {}),
      },
      select: SAFE_SELECT,
    });

    return reply.code(201).send({ success: true, data: user });
  });

  // ── PATCH /api/v1/admin/staff/:id ─────────────────────────────────────────
  app.patch('/:id', guard, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const parsed = PatchStaffUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
    }

    const existing = await prisma.staffUser.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Staff user not found' } });

    const { password, roleIds, ...rest } = parsed.data;
    const updateData: any = { ...rest };
    if (password) updateData.passwordHash = await hashPassword(password);
    if (roleIds !== undefined) updateData.roles = { set: roleIds.map((rid) => ({ id: rid })) };

    const user = await prisma.staffUser.update({ where: { id }, data: updateData, select: SAFE_SELECT });
    return reply.send({ success: true, data: user });
  });

  // ── DELETE /api/v1/admin/staff/:id (soft delete — deactivate) ────────────
  app.delete('/:id', guard, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const caller = (req as any).accessContext?.userId;
    if (caller === id) {
      return reply.code(400).send({ success: false, error: { code: 'SELF_DEACTIVATE', message: 'Cannot deactivate your own account' } });
    }
    const existing = await prisma.staffUser.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Staff user not found' } });

    await prisma.staffUser.update({ where: { id }, data: { isActive: false } });
    return reply.code(204).send();
  });
}
