import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calculateSolTopUpAmount,
  ensureTreasuryHasSolBalance,
  ensureUserHasFeeSolBalance,
  replenishTreasurySolBestEffort,
  TREASURY_SOL_MINIMUM,
  TREASURY_SOL_TARGET,
  USER_SOL_FEE_MINIMUM,
  USER_SOL_FEE_TARGET,
} from '../../src/lib/chain/fee-topup';

describe('SOL fee top-up', () => {
  it('tops wallets back up to the target only when they are below the fee buffer', () => {
    assert.equal(USER_SOL_FEE_MINIMUM, '0.01');
    assert.equal(USER_SOL_FEE_TARGET, '0.05');
    assert.equal(
      calculateSolTopUpAmount({
        currentSol: '0.009',
        minimumSol: USER_SOL_FEE_MINIMUM,
        targetSol: USER_SOL_FEE_TARGET,
      }),
      '0.041'
    );
    assert.equal(
      calculateSolTopUpAmount({
        currentSol: '0.01',
        minimumSol: USER_SOL_FEE_MINIMUM,
        targetSol: USER_SOL_FEE_TARGET,
      }),
      null
    );
  });

  it('replenishes the Treasury from the Reserve wallet before falling back to airdrop', async () => {
    const transfers: Array<{ sourceSecret: string; destinationAddress: string; amount: string }> = [];

    const result = await ensureTreasuryHasSolBalance(
      {},
      {
        getSolBalance: async () => ({ lamports: 4_000_000_000, solAmount: 4 }),
        getTreasuryAddress: () => 'treasury-address',
        getTreasurySecret: () => 'treasury-secret',
        getReserveSecret: () => 'reserve-secret',
        transferNativeAsset: async (params) => {
          transfers.push(params);
          return { txHash: 'reserve-topup-tx' };
        },
        requestTestFunds: async () => {
          throw new Error('airdrop should not be used when reserve transfer succeeds');
        },
      }
    );

    assert.equal(TREASURY_SOL_MINIMUM, '5');
    assert.equal(TREASURY_SOL_TARGET, '20');
    assert.deepEqual(transfers, [
      {
        sourceSecret: 'reserve-secret',
        destinationAddress: 'treasury-address',
        amount: '16',
      },
    ]);
    assert.deepEqual(result, {
      treasuryAddress: 'treasury-address',
      balanceBeforeSol: '4',
      topUpAmount: '16',
      txHash: 'reserve-topup-tx',
      source: 'reserve',
    });
  });

  it('falls back to devnet airdrop when Reserve funding is unavailable', async () => {
    const airdrops: Array<{ address: string; amount: number }> = [];
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const result = await ensureTreasuryHasSolBalance(
        {},
        {
          getSolBalance: async () => ({ lamports: 4_000_000_000, solAmount: 4 }),
          getTreasuryAddress: () => 'treasury-address',
          getTreasurySecret: () => 'treasury-secret',
          getReserveSecret: () => 'reserve-secret',
          transferNativeAsset: async () => {
            throw new Error('reserve is empty');
          },
          requestTestFunds: async (address, amount) => {
            airdrops.push({ address, amount: amount ?? Number.NaN });
            return { signature: 'treasury-airdrop-tx' };
          },
        }
      );

      assert.deepEqual(airdrops, [{ address: 'treasury-address', amount: 16 }]);
      assert.equal(result.source, 'airdrop');
      assert.equal(result.txHash, 'treasury-airdrop-tx');
    } finally {
      console.warn = originalWarn;
    }
  });

  it('can run Treasury replenishment in best-effort mode without blocking callers', async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const result = await replenishTreasurySolBestEffort(
        {},
        {
          getSolBalance: async () => ({ lamports: 4_000_000_000, solAmount: 4 }),
          getTreasuryAddress: () => 'treasury-address',
          getTreasurySecret: () => 'treasury-secret',
          getReserveSecret: () => null,
          transferNativeAsset: async () => {
            throw new Error('reserve should not be used');
          },
          requestTestFunds: async () => {
            throw new Error('airdrop rate limited');
          },
        }
      );

      assert.equal(result, null);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('replenishes Treasury before topping up a user wallet', async () => {
    const transfers: Array<{ sourceSecret: string; destinationAddress: string; amount: string }> = [];

    await ensureUserHasFeeSolBalance(
      { userAddress: 'user-address' },
      {
        getSolBalance: async (address) =>
          address === 'user-address'
            ? { lamports: 1_000_000, solAmount: 0.001 }
            : { lamports: 4_000_000_000, solAmount: 4 },
        getTreasuryAddress: () => 'treasury-address',
        getTreasurySecret: () => 'treasury-secret',
        getReserveSecret: () => 'reserve-secret',
        transferNativeAsset: async (params) => {
          transfers.push(params);
          return { txHash: `tx-${transfers.length}` };
        },
        requestTestFunds: async () => {
          throw new Error('airdrop should not be used when reserve transfer succeeds');
        },
      }
    );

    assert.deepEqual(transfers, [
      {
        sourceSecret: 'reserve-secret',
        destinationAddress: 'treasury-address',
        amount: '16',
      },
      {
        sourceSecret: 'treasury-secret',
        destinationAddress: 'user-address',
        amount: '0.049',
      },
    ]);
  });
});
