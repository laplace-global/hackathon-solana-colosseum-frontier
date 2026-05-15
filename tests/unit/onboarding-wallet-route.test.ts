import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('onboarding wallet route', () => {
  const source = readFileSync('src/app/api/onboarding/wallet/route.ts', 'utf8');

  it('tops onboarding wallets up to the smaller SOL target', () => {
    assert.match(source, /const ONBOARDING_SOL_TARGET = '0\.05';/);
  });

  it('tops onboarding wallets up to the 500,000 USDC target', () => {
    assert.match(source, /const ONBOARDING_USDC_TARGET = '500000';/);
  });

  it('tops onboarding wallets up to the guided collateral target', () => {
    assert.match(source, /const ONBOARDING_COLLATERAL_TARGET = '10';/);
    assert.match(source, /collateralSymbols/);
    assert.match(source, /collateralTransfers/);
    assert.match(source, /collateralTxHashes/);
  });

  it('uses the Treasury wallet before falling back to devnet airdrop', () => {
    assert.match(source, /requestTestFunds/);
    assert.match(source, /catch \(treasuryError\)/);
    assert.match(source, /transferNativeAsset/);
    assert.match(source, /sourceSecret: getTreasurySecret\(\)/);
    assert.ok(
      source.indexOf('transferNativeAsset({') <
        source.indexOf('requestTestFunds(userAddress, Number(amount))')
    );
  });
});
