import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  orderCreatePath,
  orderGetPath,
  orderStatusPath,
  orderBySourceStatusPath,
  productsPath,
  quotePath,
  WHOLESALE_API_PATHS,
  assertNoGenericOrderPaths,
} from './wholesale-paths';
import {
  MobileOrderBodySchema,
  BroadbandOrderBodySchema,
  BroadbandQuoteBodySchema,
  EscalationBodySchema,
  LegacyGenericOrderBodySchema,
} from './wholesale-payload-schemas';
import { sanitizeUpstreamWholesaleBody } from './wholesale-payload-sanitize';
import { isWholesaleEnabled, WholesaleDisabledError } from './itsi-mobile-client';

const SOURCE_ATTRIBUTION = {
  sourceOrderId: 'svc-cuid-abc123',
  sourceCustomerReference: 'ACC-10042',
  sourceServiceReference: 'SVC-MOB-001',
  businessServiceReference: 'SVC-MOB-001',
};

describe('wholesale path contract', () => {
  it('routes mobile orders to /orders/mobile', () => {
    assert.equal(orderCreatePath('MOBILE'), '/api/v1/wholesale/orders/mobile');
    assert.equal(orderGetPath('MOBILE', 'ord-1'), '/api/v1/wholesale/orders/mobile/ord-1');
    assert.equal(orderStatusPath('MOBILE', 'ord-1'), '/api/v1/wholesale/orders/mobile/ord-1/status');
  });

  it('routes broadband orders to /orders/broadband', () => {
    assert.equal(orderCreatePath('BROADBAND'), '/api/v1/wholesale/orders/broadband');
    assert.equal(orderGetPath('BROADBAND', 'ord-2'), '/api/v1/wholesale/orders/broadband/ord-2');
    assert.equal(orderStatusPath('BROADBAND', 'ord-2'), '/api/v1/wholesale/orders/broadband/ord-2/status');
  });

  it('routes by-source status with explicit sourceOrderId segments', () => {
    assert.equal(
      orderBySourceStatusPath('MOBILE', 'svc-cuid-abc123'),
      '/api/v1/wholesale/orders/mobile/by-source/svc-cuid-abc123/status',
    );
    assert.equal(
      orderBySourceStatusPath('BROADBAND', 'svc-cuid-xyz789'),
      '/api/v1/wholesale/orders/broadband/by-source/svc-cuid-xyz789/status',
    );
  });

  it('uses separate product and quote paths per family', () => {
    assert.equal(productsPath('MOBILE'), WHOLESALE_API_PATHS.mobileProducts);
    assert.equal(productsPath('BROADBAND'), WHOLESALE_API_PATHS.broadbandProducts);
    assert.equal(quotePath('MOBILE'), WHOLESALE_API_PATHS.mobileQuote);
    assert.equal(quotePath('BROADBAND'), WHOLESALE_API_PATHS.broadbandQuote);
  });

  it('keeps broadband availability on its own path', () => {
    assert.equal(WHOLESALE_API_PATHS.broadbandAvailability, '/api/v1/wholesale/availability/broadband');
  });

  it('active forward contract has no generic /orders paths', () => {
    assert.doesNotThrow(() => assertNoGenericOrderPaths());
  });
});

describe('mobile payload validation', () => {
  it('requires 14W source attribution on mobile order payload', () => {
    const missing = MobileOrderBodySchema.safeParse({ businessAccountId: 'acc-1' });
    assert.equal(missing.success, false);

    const ok = MobileOrderBodySchema.safeParse(SOURCE_ATTRIBUTION);
    assert.equal(ok.success, true);
  });

  it('accepts optional mobile contact, porting, and tariff fields', () => {
    const result = MobileOrderBodySchema.safeParse({
      ...SOURCE_ATTRIBUTION,
      tariffCode: 'MOB-TRIO-24',
      simType: 'TRIO',
      simQuantity: 5,
      contact: { name: 'Jane', phone: '07700900000' },
      porting: { pac: 'ABC123456' },
    });
    assert.equal(result.success, true);
  });
});

describe('broadband payload validation', () => {
  it('requires postcode and attribution on broadband order', () => {
    const missing = BroadbandOrderBodySchema.safeParse({
      ...SOURCE_ATTRIBUTION,
      sourceServiceReference: 'SVC-BB-001',
      businessServiceReference: 'SVC-BB-001',
    });
    assert.equal(missing.success, false);
  });

  it('accepts broadband order with postcode, address, and install contact', () => {
    const result = BroadbandOrderBodySchema.safeParse({
      ...SOURCE_ATTRIBUTION,
      sourceServiceReference: 'SVC-BB-001',
      businessServiceReference: 'SVC-BB-001',
      postcode: 'EC1A1BB',
      uprn: '100023336956',
      accessTechnology: 'FTTP',
      address: { line1: '1 Test St', city: 'London', postcode: 'EC1A1BB' },
      installContact: { name: 'Site', phone: '02070000000' },
      appointmentWindow: '2026-07-01T09:00:00Z/2026-07-01T12:00:00Z',
    });
    assert.equal(result.success, true);
  });

  it('requires postcode on broadband quote', () => {
    const quote = BroadbandQuoteBodySchema.safeParse({ productCode: 'BB-100' });
    assert.equal(quote.success, false);
  });
});

describe('escalation payload validation', () => {
  it('requires serviceType and businessServiceReference on escalations', () => {
    const missing = EscalationBodySchema.safeParse({
      subject: 'Help',
      description: 'Need support',
    });
    assert.equal(missing.success, false);

    const ok = EscalationBodySchema.safeParse({
      serviceType: 'MOBILE',
      businessServiceReference: 'SVC-1',
      sourceOrderId: 'svc-cuid-abc123',
      subject: 'Help',
      description: 'Need support',
    });
    assert.equal(ok.success, true);
  });
});

describe('upstream payload sanitization', () => {
  it('strips reseller and retail fields before upstream POST', () => {
    const clean = sanitizeUpstreamWholesaleBody({
      sourceOrderId: 'svc-1',
      businessAccountId: 'acc-1',
      wholesaleAccountId: 'ws-1',
      apiKeyId: 'key-1',
      sourceCompany: 'Itsi Business',
      sourcePlatform: 'portal',
      providerFacingOwner: 'mobile',
      retailOwner: 'business',
      retailBillingOwner: 'business',
    });
    assert.equal(clean.sourceOrderId, 'svc-1');
    assert.equal('businessAccountId' in clean, false);
    assert.equal('wholesaleAccountId' in clean, false);
    assert.equal('apiKeyId' in clean, false);
    assert.equal('sourceCompany' in clean, false);
  });
});

describe('legacy generic order compatibility', () => {
  it('requires serviceType and broadband postcode on legacy body', () => {
    const mobile = LegacyGenericOrderBodySchema.safeParse({
      serviceType: 'MOBILE',
      businessServiceReference: 'SVC-MOB-001',
    });
    assert.equal(mobile.success, true);

    const broadbandMissingPostcode = LegacyGenericOrderBodySchema.safeParse({
      serviceType: 'BROADBAND',
      businessServiceReference: 'SVC-BB-001',
    });
    assert.equal(broadbandMissingPostcode.success, false);
  });
});

describe('wholesale disabled guard', () => {
  it('reports disabled when env flag is false', () => {
    const prev = process.env.ITSI_MOBILE_WHOLESALE_ENABLED;
    process.env.ITSI_MOBILE_WHOLESALE_ENABLED = 'false';
    assert.equal(isWholesaleEnabled(), false);
    process.env.ITSI_MOBILE_WHOLESALE_ENABLED = prev;
  });

  it('WholesaleDisabledError has stable code name', () => {
    const err = new WholesaleDisabledError();
    assert.equal(err.name, 'WholesaleDisabledError');
  });
});
