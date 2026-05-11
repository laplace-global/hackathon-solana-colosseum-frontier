import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('onboarding wallet route', () => {
  const source = readFileSync('src/app/api/onboarding/wallet/route.ts', 'utf8');

  it('funds onboarding SOL through devnet airdrop instead of draining the Treasury wallet', () => {
    assert.match(source, /requestTestFunds/);
    assert.match(source, /requestTestFunds\(userAddress, Number\(solTopUpAmount\)\)/);
    assert.doesNotMatch(source, /transferNativeAsset/);
  });

  it('reads the Treasury account only for USDC top ups', () => {
    assert.doesNotMatch(source, /const treasuryAccount = getTreasuryAccount\(\);/);
    assert.match(source, /sourceSecret: getTreasuryAccount\(\)\.secret/);
  });
});
