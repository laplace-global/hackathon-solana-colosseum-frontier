import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ensureOnboardingLocalWallet,
  ONBOARDING_WALLET_FUNDED_PREFIX,
} from '../../src/lib/client/onboarding-wallet';
import type { LocalAccount } from '../../src/lib/chain/types';

function account(address: string, secret: string): LocalAccount {
  return { address, secret };
}

describe('ensureOnboardingLocalWallet', () => {
  it('creates and saves a local wallet, funds SOL and USDC once, then connects it', async () => {
    const requests: Array<{ url: string; body: unknown }> = [];
    const savedSecrets: string[] = [];
    const fundedMarks: string[] = [];
    const calls: string[] = [];

    const result = await ensureOnboardingLocalWallet({
      connectLocalWallet: async () => {
        calls.push('connect');
      },
      createLocalAccount: () => account('created-address', 'created-secret'),
      fetch: async (url, init) => {
        requests.push({
          url: String(url),
          body: init?.body ? JSON.parse(String(init.body)) : null,
        });
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as Response;
      },
      isWalletFunded: () => false,
      loadLocalAccountSecret: () => null,
      markWalletFunded: (address) => fundedMarks.push(address),
      restoreLocalAccount: (secret) => account(`restored:${secret}`, secret),
      saveLocalAccountSecret: (secret) => {
        savedSecrets.push(secret);
        calls.push('save');
      },
    });

    assert.deepEqual(result, {
      address: 'created-address',
      createdWallet: true,
      fundedSol: true,
      fundedUsdc: true,
    });
    assert.deepEqual(savedSecrets, ['created-secret']);
    assert.deepEqual(requests, [
      {
        url: '/api/onboarding/wallet',
        body: {
          userAddress: 'created-address',
          fundSol: true,
          fundUsdc: true,
          assumeEmptyWallet: true,
        },
      },
    ]);
    assert.deepEqual(fundedMarks, ['created-address']);
    assert.deepEqual(calls, ['save', 'connect']);
  });

  it('reuses a saved wallet and skips repeated funding once the address is marked funded', async () => {
    const requests: Array<{ url: string; body: unknown }> = [];

    const result = await ensureOnboardingLocalWallet({
      connectLocalWallet: async () => {},
      fetch: async (url, init) => {
        requests.push({
          url: String(url),
          body: init?.body ? JSON.parse(String(init.body)) : null,
        });
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as Response;
      },
      isWalletFunded: (address) =>
        address === 'restored-address' &&
        Boolean(`${ONBOARDING_WALLET_FUNDED_PREFIX}${address}`),
      loadLocalAccountSecret: () => 'saved-secret',
      restoreLocalAccount: (secret) => {
        assert.equal(secret, 'saved-secret');
        return account('restored-address', secret);
      },
    });

    assert.deepEqual(result, {
      address: 'restored-address',
      createdWallet: false,
      fundedSol: false,
      fundedUsdc: false,
    });
    assert.deepEqual(requests, []);
  });

  it('asks the server to top up a restored wallet instead of assuming it is empty', async () => {
    const requests: Array<{ url: string; body: unknown }> = [];

    const result = await ensureOnboardingLocalWallet({
      connectLocalWallet: async () => {},
      fetch: async (url, init) => {
        requests.push({
          url: String(url),
          body: init?.body ? JSON.parse(String(init.body)) : null,
        });
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as Response;
      },
      isWalletFunded: () => false,
      loadLocalAccountSecret: () => 'saved-secret',
      restoreLocalAccount: (secret) => account('restored-address', secret),
    });

    assert.deepEqual(result, {
      address: 'restored-address',
      createdWallet: false,
      fundedSol: true,
      fundedUsdc: true,
    });
    assert.deepEqual(requests, [
      {
        url: '/api/onboarding/wallet',
        body: {
          userAddress: 'restored-address',
          fundSol: true,
          fundUsdc: true,
          assumeEmptyWallet: false,
        },
      },
    ]);
  });
});
