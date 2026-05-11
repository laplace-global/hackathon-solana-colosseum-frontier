import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('Treasury SOL replenishment integration', () => {
  it('checks Treasury SOL before purchase token delivery spends fees', () => {
    const source = readFileSync('src/app/api/purchase/route.ts', 'utf8');

    assert.match(source, /replenishTreasurySolBestEffort/);
    assert.match(
      source,
      /await replenishTreasurySolBestEffort\(\);[\s\S]*const tokenTx = await transferAsset\(\{[\s\S]*sourceSecret: treasuryAccount\.secret/
    );
  });

  it('checks Treasury SOL before onramp and onboarding Treasury transfers spend fees', () => {
    const onramp = readFileSync('src/app/api/onramp/route.ts', 'utf8');
    const onboarding = readFileSync('src/app/api/onboarding/wallet/route.ts', 'utf8');

    assert.match(
      onramp,
      /await replenishTreasurySolBestEffort\(\);[\s\S]*const tx = await transferAsset\(\{[\s\S]*sourceSecret: treasuryAccount\.secret/
    );
    assert.match(onboarding, /replenishTreasurySolBestEffort/);
    assert.match(
      onboarding,
      /await replenishTreasurySolBestEffort\(\);[\s\S]*transferNativeAsset\(\{[\s\S]*sourceSecret: getTreasurySecret\(\)/
    );
    assert.match(
      onboarding,
      /await replenishTreasurySolBestEffort\(\);[\s\S]*transferAsset\(\{[\s\S]*sourceSecret: getTreasurySecret\(\)/
    );
  });

  it('checks Treasury SOL before lending Treasury transfers spend fees', () => {
    const source = readFileSync('src/lib/lending/solana-service.ts', 'utf8');
    const replenishmentCalls = source.match(/await replenishTreasurySolBestEffort\(\);/g) ?? [];

    assert.ok(replenishmentCalls.length >= 3);
    assert.match(
      source,
      /await replenishTreasurySolBestEffort\(\);[\s\S]*transferNativeAsset\(\{[\s\S]*sourceSecret: getTreasurySecret\(\)/
    );
    assert.match(
      source,
      /await replenishTreasurySolBestEffort\(\);[\s\S]*transferAsset\(\{[\s\S]*sourceSecret: getTreasurySecret\(\)/
    );
  });

  it('exposes a dev-tools command for cron-friendly Treasury SOL replenishment', () => {
    const source = readFileSync('scripts/dev-tools.ts', 'utf8');

    assert.match(source, /treasury-sol \[--minimum 5\] \[--target 20\] \[--json\]/);
    assert.match(source, /case 'treasury-sol':/);
    assert.match(source, /ensureTreasuryHasSolBalance\(\{/);
  });
});
