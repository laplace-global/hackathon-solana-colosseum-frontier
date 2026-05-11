import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('user SOL fee guard integration', () => {
  it('tops up user SOL before wallet purchases spend fees', () => {
    const source = readFileSync('src/app/api/purchase/route.ts', 'utf8');

    assert.match(source, /ensureUserHasFeeSolBalance/);
    assert.match(source, /await ensureUserHasFeeSolBalance\(\{[\s\S]*userAddress[\s\S]*\}\);/);
  });

  it('tops up user SOL before user-funded lending transfers spend fees', () => {
    const source = readFileSync('src/lib/lending/solana-service.ts', 'utf8');

    assert.match(source, /ensureUserHasFeeSolBalance/);
    assert.match(source, /await ensureUserHasFeeSolBalance\(\{[\s\S]*userAddress: senderAddress[\s\S]*\}\);/);
    assert.match(source, /await ensureUserHasFeeSolBalance\(\{[\s\S]*userAddress[\s\S]*\}\);/);
  });

  it('tops up user SOL before offramp transfers spend fees', () => {
    const source = readFileSync('src/app/api/offramp/route.ts', 'utf8');

    assert.match(source, /ensureUserHasFeeSolBalance/);
    assert.match(source, /await ensureUserHasFeeSolBalance\(\{[\s\S]*userAddress[\s\S]*\}\);/);
  });
});
