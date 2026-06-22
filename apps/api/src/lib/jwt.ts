import type { FastifyRequest } from 'fastify';

/**
 * JWT payload for Itsi Business.
 * Realms: platform (super-admin), staff (internal users), portal (business customer contacts).
 */
export interface JwtPayload {
  userId?: string;
  sub?: string;
  email: string;
  realm: 'platform' | 'staff' | 'portal';
  /** Staff/platform: assigned roles. Portal: not used. */
  roles?: string[];
  /** Portal: the business account ID the contact belongs to. */
  accountId?: string;
  iat?: number;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    jwtPayload?: JwtPayload;
  }
}
