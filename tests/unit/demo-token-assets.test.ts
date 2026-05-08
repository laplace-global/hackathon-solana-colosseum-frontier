import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PROPERTY_TOKEN_BY_HOTEL_ID } from '../../src/data/property-tokens';

describe('demo token assets', () => {
  it('exposes the full set of demo tokens from the property token registry', async () => {
    const module = await import('../../src/lib/assets/demo-token-assets') as {
      DEMO_TOKEN_SYMBOLS?: string[];
      createDemoTokenRecord?: <T>(factory: (symbol: string) => T) => Record<string, T>;
    };

    assert.deepEqual(module.DEMO_TOKEN_SYMBOLS, [
      ...Object.values(PROPERTY_TOKEN_BY_HOTEL_ID),
      'USDC',
    ]);

    const createDemoTokenRecord = module.createDemoTokenRecord;
    if (typeof createDemoTokenRecord !== 'function') {
      assert.fail('createDemoTokenRecord should be exported');
    }

    assert.deepEqual(createDemoTokenRecord((symbol) => `${symbol}:idle`), {
      SAIL: 'SAIL:idle',
      NYRA: 'NYRA:idle',
      ZAABEL: 'ZAABEL:idle',
      BURJV: 'BURJV:idle',
      AMANT: 'AMANT:idle',
      LEMARAIS: 'LEMARAIS:idle',
      '432PK': '432PK:idle',
      USDC: 'USDC:idle',
    });
  });
});
