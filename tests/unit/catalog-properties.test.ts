import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  catalogProperties,
  getCatalogPrimaryAction,
  isLiveProperty,
} from '../../src/data/catalog-properties';

describe('catalog properties', () => {
  it('lists the two live MVP properties first', () => {
    assert.deepEqual(
      catalogProperties.slice(0, 2).map((property) => property.id),
      ['the-sail', 'nyra'],
    );
  });

  it('routes live MVP properties to their purchase-capable detail pages', () => {
    for (const property of catalogProperties) {
      assert.equal(isLiveProperty(property.id), true);
      assert.deepEqual(getCatalogPrimaryAction(property.id), {
        kind: 'purchase',
        label: `Buy ${property.symbol} Tokens`,
        href: `/hotel/${property.id}?tab=units`,
      });
    }
  });

  it('keeps unknown properties as detail-only fallback links', () => {
    assert.equal(isLiveProperty('unknown'), false);
    assert.deepEqual(getCatalogPrimaryAction('unknown'), {
      kind: 'detail',
      label: 'View Details',
      href: '/hotel/unknown',
    });
  });
});
