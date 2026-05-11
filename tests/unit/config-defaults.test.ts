import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { APP_DEFAULTS } from '../../src/lib/config/defaults';
import { getSolanaRpcUrl } from '../../src/lib/config/runtime';

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

  it('uses server-only Solana RPC configuration before public browser configuration', () => {
    const originalServerRpc = process.env.SOLANA_RPC_URL;
    const originalPublicRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

    try {
      process.env.SOLANA_RPC_URL = 'https://server-rpc.example';
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL = 'https://public-rpc.example';
      assert.equal(getSolanaRpcUrl(), 'https://server-rpc.example');

      delete process.env.SOLANA_RPC_URL;
      assert.equal(getSolanaRpcUrl(), 'https://public-rpc.example');
    } finally {
      if (originalServerRpc === undefined) {
        delete process.env.SOLANA_RPC_URL;
      } else {
        process.env.SOLANA_RPC_URL = originalServerRpc;
      }

      if (originalPublicRpc === undefined) {
        delete process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
      } else {
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL = originalPublicRpc;
      }
    }
  });
});
