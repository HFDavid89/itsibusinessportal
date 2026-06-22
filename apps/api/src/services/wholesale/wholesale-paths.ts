/**
 * Itsi Mobile wholesale API path contract.
 * Mobile and Broadband use separate route families — do not collapse into one generic order endpoint.
 */

export type WholesaleServiceFamily = 'MOBILE' | 'BROADBAND';

export const WHOLESALE_API_PATHS = {
  health: '/api/v1/health',
  mobileProducts: '/api/v1/wholesale/products/mobile',
  broadbandProducts: '/api/v1/wholesale/products/broadband',
  broadbandAvailability: '/api/v1/wholesale/availability/broadband',
  mobileQuote: '/api/v1/wholesale/quotes/mobile',
  broadbandQuote: '/api/v1/wholesale/quotes/broadband',
  mobileOrders: '/api/v1/wholesale/orders/mobile',
  broadbandOrders: '/api/v1/wholesale/orders/broadband',
  mobileOrder: (orderId: string) => `/api/v1/wholesale/orders/mobile/${orderId}`,
  broadbandOrder: (orderId: string) => `/api/v1/wholesale/orders/broadband/${orderId}`,
  mobileOrderStatus: (orderId: string) => `/api/v1/wholesale/orders/mobile/${orderId}/status`,
  broadbandOrderStatus: (orderId: string) => `/api/v1/wholesale/orders/broadband/${orderId}/status`,
  escalations: '/api/v1/wholesale/escalations',
  escalation: (escalationId: string) => `/api/v1/wholesale/escalations/${escalationId}`,
} as const;

/** @deprecated Generic paths — use family-specific paths above. Kept for backwards-compat routing only. */
export const DEPRECATED_WHOLESALE_API_PATHS = {
  availability: '/api/v1/wholesale/availability',
  quotes: '/api/v1/wholesale/quotes',
  orders: '/api/v1/wholesale/orders',
  order: (orderId: string) => `/api/v1/wholesale/orders/${orderId}`,
  orderStatus: (orderId: string) => `/api/v1/wholesale/orders/${orderId}/status`,
} as const;

export function orderCreatePath(serviceType: WholesaleServiceFamily): string {
  return serviceType === 'MOBILE' ? WHOLESALE_API_PATHS.mobileOrders : WHOLESALE_API_PATHS.broadbandOrders;
}

export function orderGetPath(serviceType: WholesaleServiceFamily, orderId: string): string {
  return serviceType === 'MOBILE'
    ? WHOLESALE_API_PATHS.mobileOrder(orderId)
    : WHOLESALE_API_PATHS.broadbandOrder(orderId);
}

export function orderStatusPath(serviceType: WholesaleServiceFamily, orderId: string): string {
  return serviceType === 'MOBILE'
    ? WHOLESALE_API_PATHS.mobileOrderStatus(orderId)
    : WHOLESALE_API_PATHS.broadbandOrderStatus(orderId);
}

export function quotePath(serviceType: WholesaleServiceFamily): string {
  return serviceType === 'MOBILE' ? WHOLESALE_API_PATHS.mobileQuote : WHOLESALE_API_PATHS.broadbandQuote;
}

export function productsPath(serviceType: WholesaleServiceFamily): string {
  return serviceType === 'MOBILE' ? WHOLESALE_API_PATHS.mobileProducts : WHOLESALE_API_PATHS.broadbandProducts;
}
