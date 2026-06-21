import jwt from 'jsonwebtoken';
import type { AuthRealm } from './realms';

export interface TokenPayload {
  sub: string;
  realm: AuthRealm;
  email: string;
  roles: string[];
}

export function signToken(payload: TokenPayload, secret: string, expiresIn = '8h'): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string, secret: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}
