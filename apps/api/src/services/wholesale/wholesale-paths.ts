/**
 * Itsi Mobile wholesale API path contract (Phase 14W).
 * Mobile and Broadband use separate route families — never use generic /orders.
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
  mobileOrder: (orderId: string) => `/api/v1/wholesale/orders/mobile/${encodeURIComponent(orderId)}`,
  broadbandOrder: (orderId: string) => `/api/v1/wholesale/orders/broadband/${encodeURIComponent(orderId)}`,
  mobileOrderStatus: (orderId: string) => `/api/v1/wholesale/orders/mobile/${encodeURIComponent(orderId)}/status`,
  broadbandOrderStatus: (orderId: string) => `/api/v1/wholesale/orders/broadband/${encodeURIComponent(orderId)}/status`,
  mobileOrderBySourceStatus: (sourceOrderId: string) =>
    `/api/v1/wholesale/orders/mobile/by-source/${encodeURIComponent(sourceOrderId)}/status`,
  broadbandOrderBySourceStatus: (sourceOrderId: string) =>
    `/api/v1/wholesale/orders/broadband/by-source/${encodeURIComponent(sourceOrderId)}/status`,
  escalations: '/api/v1/wholesale/escalations',
  escalation: (escalationId: string) => `/api/v1/wholesale/escalations/${encodeURIComponent(escalationId)}`,
} as const;

/** Legacy Itsi Mobile paths — not used by Itsi Business client (14W forward contract only). */
export const LEGACY_ITSI_MOBILE_WHOLESALE_PATHS = {
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

export function orderBySourceStatusPath(serviceType: WholesaleServiceFamily, sourceOrderId: string): string {
  return serviceType === 'MOBILE'
    ? WHOLESALE_API_PATHS.mobileOrderBySourceStatus(sourceOrderId)
    : WHOLESALE_API_PATHS.broadbandOrderBySourceStatus(sourceOrderId);
}

export function quotePath(serviceType: WholesaleServiceFamily): string {
  return serviceType === 'MOBILE' ? WHOLESALE_API_PATHS.mobileQuote : WHOLESALE_API_PATHS.broadbandQuote;
}

export function productsPath(serviceType: WholesaleServiceFamily): string {
  return serviceType === 'MOBILE' ? WHOLESALE_API_PATHS.mobileProducts : WHOLESALE_API_PATHS.broadbandProducts;
}

/** Active forward-contract paths must not include generic /wholesale/orders (without family). */
export function assertNoGenericOrderPaths(): void {
  const values = Object.values(WHOLESALE_API_PATHS).flatMap((v) =>
    typeof v === 'function' ? [v('test-id'), v('test-source')] : [v],
  );
  for (const path of values) {
    if (path === '/api/v1/wholesale/orders') {
      throw new Error(`Generic wholesale order path detected: ${path}`);
    }
    const match = path.match(/^\/api\/v1\/wholesale\/orders\/([^/]+)/);
    if (match && match[1] !== 'mobile' && match[1] !== 'broadband') {
      throw new Error(`Non-family wholesale order path detected: ${path}`);
    }
  }
}
