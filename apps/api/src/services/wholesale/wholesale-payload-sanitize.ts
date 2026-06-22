/**
 * Strip fields that Itsi Mobile derives from API key auth — must never be sent upstream.
 */
export const FORBIDDEN_UPSTREAM_WHOLESALE_FIELDS = [
  'wholesaleAccountId',
  'apiKeyId',
  'sourceCompany',
  'sourcePlatform',
  'providerFacingOwner',
  'retailOwner',
  'retailBillingOwner',
  'businessAccountId',
] as const;

export function sanitizeUpstreamWholesaleBody<T extends Record<string, unknown>>(body: T): T {
  const clean = { ...body };
  for (const key of FORBIDDEN_UPSTREAM_WHOLESALE_FIELDS) {
    delete clean[key];
  }
  return clean;
}
