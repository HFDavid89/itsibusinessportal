/**
 * Auth realms for Itsi Business.
 * - staff: Internal Itsi Business staff (admin, CRM, billing, desk).
 * - portal: Business customer portal users.
 */
export type AuthRealm = 'staff' | 'portal';

export const STAFF_REALM: AuthRealm = 'staff';
export const PORTAL_REALM: AuthRealm = 'portal';
