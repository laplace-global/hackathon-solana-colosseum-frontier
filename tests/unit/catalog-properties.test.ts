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
    assert.equal(isLiveProperty('the-sail'), true);
    assert.equal(isLiveProperty('nyra'), true);
    assert.deepEqual(getCatalogPrimaryAction('the-sail'), {
      kind: 'purchase',
      label: 'Buy SAIL Tokens',
      href: '/hotel/the-sail',
    });
  });

  it('routes catalog-only properties to their detail pages', () => {
    assert.equal(isLiveProperty('zaabel'), false);
    assert.deepEqual(getCatalogPrimaryAction('zaabel'), {
      kind: 'detail',
      label: 'View Details',
      href: '/hotel/zaabel',
    });
  });
});
