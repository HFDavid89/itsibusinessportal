/**
 * Auth realms for Itsi Business.
 * - platform: Itsi Business super-admin (internal ops, cross-account).
 * - staff:    Internal Itsi Business staff (admin, CRM, billing, desk).
 * - portal:   Business customer portal users (self-service, read-only scoped).
 *
 * RULE: Portal users are business customers — not residential/mobile consumers.
 */
export const AuthRealm = {
  PLATFORM: 'platform',
  STAFF: 'staff',
  PORTAL: 'portal',
} as const;

export type AuthRealm = (typeof AuthRealm)[keyof typeof AuthRealm];
