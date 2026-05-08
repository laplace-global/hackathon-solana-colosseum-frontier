import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

describe('frontend Solana RPC refresh policy', () => {
  it('keeps purchase success paths from refreshing balances after the API call', () => {
    const source = readFileSync('src/components/purchase-confirmation-dialog.tsx', 'utf8');
    const refreshCalls = source.match(/await refreshBalances\(\);/g) ?? [];

    assert.equal(refreshCalls.length, 1);
    assert.match(source, /const snapshot = await refreshBalances\(\);/);
  });

  it('keeps borrower action success paths focused on position refresh only', () => {
    const source = readFileSync('src/app/borrow/page.tsx', 'utf8');

    assert.doesNotMatch(source, /await Promise\.all\(\[refreshBalances\(\), refreshPosition\(\)\]\)/);
    assert.equal((source.match(/await refreshPosition\(\);/g) ?? []).length, 4);
  });

  it('keeps wallet balance hydration independent from asset availability state changes', () => {
    const source = readFileSync('src/contexts/wallet-context.tsx', 'utf8');

    assert.match(source, /hasAssetByTokenRef/);
    assert.doesNotMatch(source, /\[hasAssetByToken, refreshAssetAvailabilityForAddress\]/);
    assert.doesNotMatch(source, /Promise\.resolve\(hasAssetByToken\)/);
  });

  it('keeps admin page data loading to initial market fetches and explicit wallet actions', () => {
    const source = readFileSync('src/app/admin/page.tsx', 'utf8');
    const initEffectStart = source.indexOf('useEffect(() => {');
    const initEffectEnd = source.indexOf('const copyAddress');
    const initEffect = source.slice(initEffectStart, initEffectEnd);

    assert.match(initEffect, /hasInitializedRef/);
    assert.doesNotMatch(initEffect, /connectLocalWallet\(/);
    assert.doesNotMatch(initEffect, /refreshBalances\(/);
  });
});
