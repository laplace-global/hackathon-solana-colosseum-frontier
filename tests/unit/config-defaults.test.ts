import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { APP_DEFAULTS } from '../../src/lib/config/defaults';

describe('application defaults', () => {
  it('keeps public demo defaults in one place', () => {
    assert.deepEqual(APP_DEFAULTS.solana, {
      cluster: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      explorerUrl: 'https://explorer.solana.com',
      commitment: 'confirmed',
    });

    assert.deepEqual(APP_DEFAULTS.demoMintAddresses, {
      SAIL: '6ABfz6LmNxspAt2rT1XgEXZ67juWePiYEWN6pKcCHDqf',
      NYRA: 'CWkgYDv4FoFwhAp2qWrgn4HmEqw8km4eXZhrGNnw9aU8',
      ZAABEL: 'AvxiPTE2Chmoa1fRBRkFhBpagnXpTohfWYJdEX6EqR7w',
      BURJV: '7oYdJE2hnn11wnX5FEytoLVs2jjJJugGFTQtQ7STxCdo',
      AMANT: 'Ad8iBapaNS7WtopcRxyZXVtn6MXgCFn3fdyVtxpcw3Qs',
      LEMARAIS: 'HPAPHogoqFM7RGPTdiDCBk6zfLhhWDUpkGtdgVQXsn8N',
      '432PK': '7gMfbZ6AQAaoWMdMz91VPzHmZa6g634eMC39RoSnQ9fC',
      USDC: '4N8M9UZcvF4qSKHU4jAtQTLGp4iiSnNsYJ1y8P3QvYun',
    });

    assert.equal(APP_DEFAULTS.lending.loanTermMonths, 24);
  });
});
