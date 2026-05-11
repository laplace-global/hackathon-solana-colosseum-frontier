import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('onboarding wallet route', () => {
  const source = readFileSync('src/app/api/onboarding/wallet/route.ts', 'utf8');

  it('tops onboarding wallets up to the smaller SOL target', () => {
    assert.match(source, /const ONBOARDING_SOL_TARGET = '0\.05';/);
  });

  it('tries a devnet airdrop before falling back to the Treasury wallet', () => {
    assert.match(source, /requestTestFunds/);
    assert.match(source, /requestTestFunds\(userAddress, Number\(amount\)\)/);
    assert.match(source, /catch \(airdropError\)/);
    assert.match(source, /transferNativeAsset/);
    assert.match(source, /sourceSecret: getTreasurySecret\(\)/);
  });
});
