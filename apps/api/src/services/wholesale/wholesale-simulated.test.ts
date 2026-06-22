import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FORBIDDEN_UPSTREAM_WHOLESALE_FIELDS } from './wholesale-payload-sanitize';
import {
  MockItsiMobileServer,
  applyWholesaleTestEnv,
  restoreWholesaleTestEnv,
  snapshotWholesaleEnv,
} from './mock-itsi-mobile-server';
import {
  canConnectDatabase,
  createWholesaleTestFixture,
  createDraftMobileService,
  createDraftBroadbandService,
  createLinkedMobileService,
  createLinkedBroadbandService,
  getTimelineEvents,
  cleanupWholesaleTestFixture,
  type WholesaleTestFixture,
} from './wholesale-test-fixtures';
import {
  requestWholesaleOrderForService,
  refreshWholesaleStatusForService,
  handleWholesaleOrderError,
} from './wholesale-order-service';
import { WholesaleDisabledError } from './itsi-mobile-client';

describe('Phase 13B-1 — simulated wholesale contract verification', () => {
  const mock = new MockItsiMobileServer();
  let envSnapshot: NodeJS.ProcessEnv = {};
  let fixture!: WholesaleTestFixture;
  let dbAvailable = false;

  before(async () => {
    dbAvailable = await canConnectDatabase();
    if (!dbAvailable) return;

    envSnapshot = snapshotWholesaleEnv();
    const baseUrl = await mock.start();
    applyWholesaleTestEnv(baseUrl);
    fixture = await createWholesaleTestFixture();
  });

  after(async () => {
    if (!dbAvailable) return;
    await cleanupWholesaleTestFixture(fixture);
    await mock.close();
    restoreWholesaleTestEnv(envSnapshot);
  });

  beforeEach(() => {
    if (!dbAvailable) return;
    mock.reset();
  });

  describe('Part B — simulated mobile order', () => {
    it('requests wholesale order via service layer with 14W mobile payload', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      const service = await createDraftMobileService(fixture, { status: 'DRAFT' });

      const result = await requestWholesaleOrderForService('MOBILE', service.id, {
        confirm: true,
        contactName: 'Jane Tester',
        contactPhone: '07700900123',
        productCode: 'MOB-TRIO-OVERRIDE',
      });

      assert.ok(result.data, JSON.stringify(result.error));
      assert.equal(result.data!.status, 'REQUESTED');
      assert.ok(result.data!.wholesaleLink);
      assert.equal(result.data!.wholesaleLink!.itsiMobileWholesaleOrderId, 'mock-mobile-ord-1');

      const orderReq = mock.requestsForPath('/orders/mobile').find((r) => r.method === 'POST');
      assert.ok(orderReq, 'expected POST /orders/mobile');
      assert.equal(orderReq!.serviceType, 'MOBILE');
      assert.equal(orderReq!.hadAuthorization, true);
      assert.equal(orderReq!.hadXClient, true);
      assert.equal(orderReq!.hadForbiddenFields, false);

      const body = orderReq!.body as Record<string, unknown>;
      assert.equal(body.sourceOrderId, service.id);
      assert.equal(body.sourceCustomerReference, fixture.accountNumber);
      assert.equal(body.sourceServiceReference, service.serviceReference);
      assert.equal(body.businessServiceReference, service.serviceReference);
      assert.equal(body.productCode, 'MOB-TRIO-OVERRIDE');
      assert.deepEqual(body.contact, { name: 'Jane Tester', phone: '07700900123' });

      for (const field of FORBIDDEN_UPSTREAM_WHOLESALE_FIELDS) {
        assert.equal(field in body, false, `forbidden field ${field} must not be sent`);
      }

      const events = await getTimelineEvents(fixture.accountId, 'WHOLESALE_ORDER_REQUESTED');
      assert.ok(events.some((e) => (e.meta as Record<string, unknown>).serviceId === service.id));
    });
  });

  describe('Part C — simulated broadband order', () => {
    it('requests wholesale order with postcode, address, and install contact', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      const service = await createDraftBroadbandService(fixture, { status: 'REQUESTED' });

      const result = await requestWholesaleOrderForService('BROADBAND', service.id, {
        confirm: true,
        contactName: 'Site Contact',
        contactPhone: '02070000000',
      });

      assert.ok(result.data, JSON.stringify(result.error));
      assert.ok(result.data!.wholesaleLink);

      const orderReq = mock.requestsForPath('/orders/broadband').find((r) => r.method === 'POST');
      assert.ok(orderReq, 'expected POST /orders/broadband');
      assert.equal(orderReq!.serviceType, 'BROADBAND');
      assert.equal(orderReq!.hadForbiddenFields, false);

      const body = orderReq!.body as Record<string, unknown>;
      assert.equal(body.sourceOrderId, service.id);
      assert.equal(body.sourceCustomerReference, fixture.accountNumber);
      assert.equal(body.postcode, 'EC1A1BB');
      assert.ok(body.address && typeof body.address === 'object');
      const address = body.address as Record<string, unknown>;
      assert.equal(address.line1, '1 Test Street');
      assert.equal(address.city, 'London');
      assert.deepEqual(body.installContact, { name: 'Site Contact', phone: '02070000000' });

      const events = await getTimelineEvents(fixture.accountId, 'WHOLESALE_ORDER_REQUESTED');
      assert.ok(events.some((e) => (e.meta as Record<string, unknown>).businessServiceType === 'BROADBAND'));
    });

    it('rejects broadband without postcode before upstream call', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      const service = await createDraftBroadbandService(fixture, { postcode: '   ' });
      const requestsBefore = mock.requests.length;

      const result = await requestWholesaleOrderForService('BROADBAND', service.id, { confirm: true });

      assert.equal(result.error?.status, 400);
      assert.match(String(result.error?.body), /postcode/i);
      assert.equal(mock.requests.length, requestsBefore, 'no upstream call expected');
    });
  });

  describe('Part D — by-source status refresh', () => {
    it('prefers mobile by-source status using local service id', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      const service = await createLinkedMobileService(fixture, { retailStatus: 'REQUESTED' });

      const result = await refreshWholesaleStatusForService('MOBILE', service.id);

      assert.ok(result.data, JSON.stringify(result.error));
      assert.equal(result.data!.status, 'ACTIVE');

      const bySourceReq = mock.requests.find((r) =>
        r.method === 'GET' && r.path.includes('/orders/mobile/by-source/') && r.path.includes(service.id),
      );
      assert.ok(bySourceReq, 'expected by-source mobile status request');
      assert.equal(bySourceReq!.sourceOrderId, service.id);
      assert.equal(mock.requestsForPath('/orders/broadband').length, 0, 'must not call broadband paths');

      const stored = result.data!.wholesaleLink!.lastStatusResponse as Record<string, unknown>;
      assert.equal(stored.status, 'PROVISIONED');
      assert.equal('gammaPayload' in stored, false);

      const events = await getTimelineEvents(fixture.accountId, 'WHOLESALE_STATUS_REFRESHED');
      assert.ok(events.some((e) => (e.meta as Record<string, unknown>).serviceId === service.id));
    });

    it('prefers broadband by-source status using local service id', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      const service = await createLinkedBroadbandService(fixture, { retailStatus: 'REQUESTED' });

      const result = await refreshWholesaleStatusForService('BROADBAND', service.id);

      assert.ok(result.data, JSON.stringify(result.error));
      assert.equal(result.data!.status, 'ACTIVE');

      const bySourceReq = mock.requests.find((r) =>
        r.method === 'GET' && r.path.includes('/orders/broadband/by-source/') && r.path.includes(service.id),
      );
      assert.ok(bySourceReq, 'expected by-source broadband status request');
      assert.equal(mock.requestsForPath('/orders/mobile').length, 0, 'must not call mobile paths');
    });

    it('falls back to order-id status when by-source returns 404', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      mock.setResponse('GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status', {
        status: 404,
        body: { code: 'NOT_FOUND', message: 'No order for source reference' },
      });

      const service = await createLinkedMobileService(fixture, {
        retailStatus: 'REQUESTED',
        orderId: 'legacy-order-99',
      });

      const result = await refreshWholesaleStatusForService('MOBILE', service.id);

      assert.ok(result.data, JSON.stringify(result.error));
      assert.equal(result.data!.status, 'ACTIVE');

      const fallbackReq = mock.requests.find((r) =>
        r.method === 'GET' && r.path.includes('/orders/mobile/legacy-order-99/status'),
      );
      assert.ok(fallbackReq, 'expected fallback order-id status request');
    });

    it('does not promote retail on rejected upstream status but records staff warning', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      mock.setResponse('GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status', {
        status: 200,
        body: {
          orderId: 'mock-mobile-ord-1',
          serviceType: 'MOBILE',
          status: 'REJECTED',
          lastUpdatedAt: new Date().toISOString(),
          events: [],
        },
      });

      const service = await createLinkedMobileService(fixture, { retailStatus: 'REQUESTED' });
      const result = await refreshWholesaleStatusForService('MOBILE', service.id);

      assert.ok(result.data, JSON.stringify(result.error));
      assert.equal(result.data!.status, 'REQUESTED', 'retail must not auto-cancel');
      const insights = (result.data as { wholesaleInsights?: { staffWarning?: string | null } }).wholesaleInsights;
      assert.ok(insights?.staffWarning, 'expected staff warning for REJECTED');
    });

    it('sanitises provider payload from upstream status before storage', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      mock.setResponse('GET /api/v1/wholesale/orders/mobile/by-source/:sourceOrderId/status', {
        status: 200,
        body: {
          orderId: 'mock-mobile-ord-1',
          serviceType: 'MOBILE',
          status: 'PROVISIONED',
          lastUpdatedAt: new Date().toISOString(),
          gammaPayload: { secret: 'must-not-store' },
          internalProviderRef: 'GAMMA-SECRET-123',
          events: [{ occurredAt: new Date().toISOString(), status: 'DONE', note: 'ok', providerRaw: 'hidden' }],
        },
      });

      const service = await createLinkedMobileService(fixture, { retailStatus: 'REQUESTED' });
      const result = await refreshWholesaleStatusForService('MOBILE', service.id);
      const stored = result.data!.wholesaleLink!.lastStatusResponse as Record<string, unknown>;

      assert.equal('gammaPayload' in stored, false);
      assert.equal('internalProviderRef' in stored, false);
      const events = stored.events as Array<Record<string, unknown>>;
      assert.ok(Array.isArray(events));
      assert.equal('providerRaw' in (events[0] ?? {}), false);
    });
  });

  describe('Part E — negative and error handling', () => {
    it('returns WHOLESALE_DISABLED when bridge is disabled', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      const prevEnabled = process.env.ITSI_MOBILE_WHOLESALE_ENABLED;
      process.env.ITSI_MOBILE_WHOLESALE_ENABLED = 'false';
      const service = await createDraftMobileService(fixture);

      try {
        await requestWholesaleOrderForService('MOBILE', service.id, { confirm: true });
        assert.fail('expected WholesaleDisabledError');
      } catch (err) {
        assert.ok(err instanceof WholesaleDisabledError);
        const handled = handleWholesaleOrderError(err);
        assert.equal((handled.body as { error: { code: string } }).error.code, 'WHOLESALE_DISABLED');
      } finally {
        process.env.ITSI_MOBILE_WHOLESALE_ENABLED = prevEnabled;
      }
    });

    it('masks upstream 401 without provider leakage', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      mock.setResponse('POST /api/v1/wholesale/orders/mobile', {
        status: 401,
        body: {
          code: 'UNAUTHORIZED',
          message: 'Invalid key',
          gammaDiagnostics: { provider: 'GAMMA', orderRef: 'SECRET-999' },
        },
      });

      const service = await createDraftMobileService(fixture);
      try {
        await requestWholesaleOrderForService('MOBILE', service.id, { confirm: true });
        assert.fail('expected upstream error');
      } catch (err) {
        const handled = handleWholesaleOrderError(err);
        assert.equal(handled.status, 502);
        assert.equal((handled.body as { error: { code: string } }).error.code, 'WHOLESALE_API_ERROR');
        const serialised = JSON.stringify(handled);
        assert.equal(serialised.includes('GAMMA'), false);
        assert.equal(serialised.includes('SECRET-999'), false);
      }
    });

    it('masks upstream 500 as safe wholesale API error', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      mock.setResponse('POST /api/v1/wholesale/orders/broadband', {
        status: 500,
        body: { code: 'INTERNAL', message: 'Provider timeout', ms3Trace: 'raw-provider-data' },
      });

      const service = await createDraftBroadbandService(fixture);
      try {
        await requestWholesaleOrderForService('BROADBAND', service.id, { confirm: true });
        assert.fail('expected upstream error');
      } catch (err) {
        const handled = handleWholesaleOrderError(err);
        assert.equal(handled.status, 502);
        assert.equal(JSON.stringify(handled).includes('ms3Trace'), false);
      }
    });

    it('blocks duplicate wholesale order on the same service', async (t) => {
      if (!dbAvailable) return t.skip('DATABASE_URL not available');
      const service = await createDraftMobileService(fixture);
      const first = await requestWholesaleOrderForService('MOBILE', service.id, { confirm: true });
      assert.ok(first.data, JSON.stringify(first.error));

      const second = await requestWholesaleOrderForService('MOBILE', service.id, { confirm: true });
      assert.equal(second.error?.status, 400);
      assert.match(String(second.error?.body), /already has a wholesale link/i);
    });
  });
});
