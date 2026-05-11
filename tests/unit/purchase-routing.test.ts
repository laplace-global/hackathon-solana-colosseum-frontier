import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('purchase success routing', () => {
  it('continues unit detail purchases into the collateral and borrow flow', () => {
    const source = readFileSync('src/app/hotel/[id]/unit/[unitId]/page.tsx', 'utf8');

    assert.match(source, /router\.push\(`\/borrow\?hotelId=\$\{hotel\.id\}&unitId=\$\{unit\.id\}&flow=reinvest`\)/);
    assert.doesNotMatch(source, /router\.push\('\/portfolio'\);/);
  });

  it('links purchase transaction hashes to Solana Explorer', () => {
    const source = readFileSync('src/components/purchase-confirmation-dialog.tsx', 'utf8');

    assert.match(source, /getChainExplorerLink/);
    assert.match(source, /href=\{getChainExplorerLink\('tx', txHash\)\}/);
    assert.match(source, /href=\{getChainExplorerLink\('tx', tokenTxHash\)\}/);
  });
});
