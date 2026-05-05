import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ASSET_ID_BY_SYMBOL,
  getAssetId,
  getAssetSymbol,
  normalizeAssetId,
} from '../../src/lib/assets/asset-symbols';

describe('asset-symbols', () => {
  it('resolves supported symbols case-insensitively', () => {
    assert.equal(getAssetId('sail'), ASSET_ID_BY_SYMBOL.SAIL);
    assert.equal(getAssetId('USDC'), ASSET_ID_BY_SYMBOL.USDC);
  });

  it('maps canonical asset ids back to symbols', () => {
    assert.equal(getAssetSymbol(ASSET_ID_BY_SYMBOL.NYRA), 'NYRA');
    assert.equal(getAssetSymbol('usdc'), 'USDC');
  });

  it('normalizes symbols to canonical uppercase asset ids', () => {
    assert.equal(normalizeAssetId('sail'), ASSET_ID_BY_SYMBOL.SAIL);
    assert.equal(normalizeAssetId('USDC'), ASSET_ID_BY_SYMBOL.USDC);
  });

  it('passes through unknown assets while uppercasing them', () => {
    assert.equal(getAssetSymbol('custom-asset'), 'custom-asset');
    assert.equal(normalizeAssetId('custom-asset'), 'CUSTOM-ASSET');
  });
});
