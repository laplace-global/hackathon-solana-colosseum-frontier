import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ASSET_ID_BY_SYMBOL } from '../../src/lib/assets/asset-symbols';
import {
  buildAssetDefinitions,
  getAssetDefinitionBySymbol,
} from '../../src/lib/chain/config';

describe('chain config asset definitions', () => {
  it('builds native and token asset definitions from market rows', () => {
    const definitions = buildAssetDefinitions([
      {
        collateral_currency: ASSET_ID_BY_SYMBOL.SAIL,
        collateral_issuer: 'So11111111111111111111111111111111111111112',
        debt_currency: ASSET_ID_BY_SYMBOL.RLUSD,
        debt_issuer: '4N8M9UZcvF4qSKHU4jAtQTLGp4iiSnNsYJ1y8P3QvYun',
      },
      {
        collateral_currency: 'SAIL',
        collateral_issuer: 'So11111111111111111111111111111111111111112',
        debt_currency: 'RLUSD',
        debt_issuer: '4N8M9UZcvF4qSKHU4jAtQTLGp4iiSnNsYJ1y8P3QvYun',
      },
    ]);

    assert.deepEqual(definitions, [
      { symbol: 'SOL', assetId: null, kind: 'native' },
      { symbol: 'SAIL', assetId: 'So11111111111111111111111111111111111111112', kind: 'token' },
      { symbol: 'RLUSD', assetId: '4N8M9UZcvF4qSKHU4jAtQTLGp4iiSnNsYJ1y8P3QvYun', kind: 'token' },
    ]);
  });

  it('finds an asset definition by symbol or legacy asset id', () => {
    const definitions = buildAssetDefinitions([
      {
        collateral_currency: ASSET_ID_BY_SYMBOL.SAIL,
        collateral_issuer: 'So11111111111111111111111111111111111111112',
        debt_currency: ASSET_ID_BY_SYMBOL.RLUSD,
        debt_issuer: '4N8M9UZcvF4qSKHU4jAtQTLGp4iiSnNsYJ1y8P3QvYun',
      },
    ]);

    assert.deepEqual(getAssetDefinitionBySymbol(definitions, 'sail'), {
      symbol: 'SAIL',
      assetId: 'So11111111111111111111111111111111111111112',
      kind: 'token',
    });
    assert.deepEqual(getAssetDefinitionBySymbol(definitions, ASSET_ID_BY_SYMBOL.RLUSD), {
      symbol: 'RLUSD',
      assetId: '4N8M9UZcvF4qSKHU4jAtQTLGp4iiSnNsYJ1y8P3QvYun',
      kind: 'token',
    });
    assert.equal(getAssetDefinitionBySymbol(definitions, 'UNKNOWN'), null);
  });
});
