import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  orderCreatePath,
  orderGetPath,
  orderStatusPath,
  productsPath,
  quotePath,
  WHOLESALE_API_PATHS,
} from './wholesale-paths';
import {
  MobileOrderBodySchema,
  BroadbandOrderBodySchema,
  BroadbandQuoteBodySchema,
  EscalationBodySchema,
  LegacyGenericOrderBodySchema,
} from './wholesale-payload-schemas';
import { isWholesaleEnabled, WholesaleDisabledError } from './itsi-mobile-client';

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

  it('uses separate product and quote paths per family', () => {
    assert.equal(productsPath('MOBILE'), WHOLESALE_API_PATHS.mobileProducts);
    assert.equal(productsPath('BROADBAND'), WHOLESALE_API_PATHS.broadbandProducts);
    assert.equal(quotePath('MOBILE'), WHOLESALE_API_PATHS.mobileQuote);
    assert.equal(quotePath('BROADBAND'), WHOLESALE_API_PATHS.broadbandQuote);
  });

  it('keeps broadband availability on its own path', () => {
    assert.equal(WHOLESALE_API_PATHS.broadbandAvailability, '/api/v1/wholesale/availability/broadband');
  });
});

describe('mobile payload validation', () => {
  it('accepts minimal mobile order payload', () => {
    const result = MobileOrderBodySchema.safeParse({
      businessAccountId: 'acc-1',
      businessServiceReference: 'SVC-MOB-001',
    });
    assert.equal(result.success, true);
  });

  it('accepts optional mobile quote fields', () => {
    const result = MobileOrderBodySchema.safeParse({
      businessAccountId: 'acc-1',
      businessServiceReference: 'SVC-MOB-001',
      simType: 'TRIO',
      simQuantity: 5,
    });
    assert.equal(result.success, true);
  });
});

describe('broadband payload validation', () => {
  it('requires postcode on broadband order', () => {
    const result = BroadbandOrderBodySchema.safeParse({
      businessAccountId: 'acc-1',
      businessServiceReference: 'SVC-BB-001',
    });
    assert.equal(result.success, false);
  });

  it('accepts broadband order with postcode', () => {
    const result = BroadbandOrderBodySchema.safeParse({
      businessAccountId: 'acc-1',
      businessServiceReference: 'SVC-BB-001',
      postcode: 'EC1A1BB',
      accessTechnology: 'FTTP',
    });
    assert.equal(result.success, true);
  });

  it('requires postcode on broadband quote', () => {
    const quote = BroadbandQuoteBodySchema.safeParse({ productCode: 'BB-100' });
    assert.equal(quote.success, false);
  });
});

describe('escalation payload validation', () => {
  it('requires serviceType on escalations', () => {
    const missing = EscalationBodySchema.safeParse({
      businessServiceReference: 'SVC-1',
      subject: 'Help',
      description: 'Need support',
    });
    assert.equal(missing.success, false);

    const ok = EscalationBodySchema.safeParse({
      serviceType: 'MOBILE',
      businessServiceReference: 'SVC-1',
      subject: 'Help',
      description: 'Need support',
    });
    assert.equal(ok.success, true);
  });
});

describe('legacy generic order compatibility', () => {
  it('requires serviceType and broadband postcode on legacy body', () => {
    const mobile = LegacyGenericOrderBodySchema.safeParse({
      serviceType: 'MOBILE',
      businessAccountId: 'acc-1',
      businessServiceReference: 'SVC-MOB-001',
    });
    assert.equal(mobile.success, true);

    const broadbandMissingPostcode = LegacyGenericOrderBodySchema.safeParse({
      serviceType: 'BROADBAND',
      businessAccountId: 'acc-1',
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
