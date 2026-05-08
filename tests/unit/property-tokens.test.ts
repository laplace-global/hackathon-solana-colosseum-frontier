import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getHotelIdByPropertyToken,
  getPropertyTokenSymbol,
  isPurchasableHotelId,
  PROPERTY_TOKEN_BY_HOTEL_ID,
} from '../../src/data/property-tokens';

describe('property token routing', () => {
  it('maps every purchasable property to its RWA token symbol', () => {
    assert.deepEqual(PROPERTY_TOKEN_BY_HOTEL_ID, {
      'the-sail': 'SAIL',
      nyra: 'NYRA',
      zaabel: 'ZAABEL',
      burjv: 'BURJV',
      amant: 'AMANT',
      lemarais: 'LEMARAIS',
      '432pk': '432PK',
    });
  });

  it('resolves property and token lookups case-insensitively where needed', () => {
    assert.equal(isPurchasableHotelId('zaabel'), true);
    assert.equal(getPropertyTokenSymbol('zaabel'), 'ZAABEL');
    assert.equal(getHotelIdByPropertyToken('lemarais'), 'lemarais');
    assert.equal(getPropertyTokenSymbol('unknown'), null);
  });
});
