import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { catalogProperties } from '../../src/data/catalog-properties';
import { hotels } from '../../src/data/hotels';

describe('hotel purchase data', () => {
  it('has a purchase-capable hotel detail for every catalog property', () => {
    for (const property of catalogProperties) {
      const hotel = hotels.find((entry) => entry.id === property.id);
      assert.ok(hotel, `${property.id} should exist in hotel data`);
      assert.equal(hotel.tokenPrice, property.tokenPriceUsd);
      assert.ok(hotel.units.length > 0, `${property.id} should expose purchasable units`);
    }
  });

  it('keeps generated catalog hotel units aligned with their token symbols', () => {
    const zaabel = hotels.find((entry) => entry.id === 'zaabel');
    assert.equal(zaabel?.units[0]?.id, 'zaabel-a');
    assert.equal(zaabel?.units[0]?.type, 'ZAABEL');
    assert.equal(zaabel?.units[0]?.name, 'Sky Penthouse Allocation');
  });
});
