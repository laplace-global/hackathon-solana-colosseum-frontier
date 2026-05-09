import { createLocalAccount, restoreLocalAccount } from '@/lib/chain/client';
import {
  loadLocalAccountSecret,
  saveLocalAccountSecret,
} from '@/lib/chain/storage';
import type { LocalAccount } from '@/lib/chain/types';

export const ONBOARDING_WALLET_FUNDED_PREFIX = 'laplace.onboarding.wallet-funded:';

interface ProvisionResponse {
  success?: boolean;
  error?: string | { message?: string };
}

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<Pick<Response, 'ok' | 'json'>>;

export interface OnboardingWalletResult {
  address: string;
  createdWallet: boolean;
  fundedSol: boolean;
  fundedUsdc: boolean;
}

export interface OnboardingWalletDependencies {
  connectLocalWallet: () => Promise<void>;
  createLocalAccount?: () => LocalAccount;
  fetch?: FetchLike;
  isWalletFunded?: (address: string) => boolean;
  loadLocalAccountSecret?: () => string | null;
  markWalletFunded?: (address: string) => void;
  restoreLocalAccount?: (secret: string) => LocalAccount;
  saveLocalAccountSecret?: (secret: string) => void;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function isOnboardingWalletFunded(address: string): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(`${ONBOARDING_WALLET_FUNDED_PREFIX}${address}`) === 'ready';
}

export function markOnboardingWalletFunded(address: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(`${ONBOARDING_WALLET_FUNDED_PREFIX}${address}`, 'ready');
}

function getProvisionError(payload: ProvisionResponse): string {
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return payload.error.message;
  return 'Failed to prepare local wallet for onboarding';
}

async function requestOnboardingFunding(params: {
  fetchImpl: FetchLike;
  userAddress: string;
  fundSol: boolean;
  fundUsdc: boolean;
  assumeEmptyWallet: boolean;
}): Promise<void> {
  if (!params.fundSol && !params.fundUsdc) return;

  const response = await params.fetchImpl('/api/onboarding/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: params.userAddress,
      fundSol: params.fundSol,
      fundUsdc: params.fundUsdc,
      assumeEmptyWallet: params.assumeEmptyWallet,
    }),
  });
  const payload = (await response.json()) as ProvisionResponse;

  if (!response.ok || !payload.success) {
    throw new Error(getProvisionError(payload));
  }
}

export async function ensureOnboardingLocalWallet(
  dependencies: OnboardingWalletDependencies
): Promise<OnboardingWalletResult> {
  const loadSecret = dependencies.loadLocalAccountSecret ?? loadLocalAccountSecret;
  const saveSecret = dependencies.saveLocalAccountSecret ?? saveLocalAccountSecret;
  const createAccount = dependencies.createLocalAccount ?? createLocalAccount;
  const restoreAccount = dependencies.restoreLocalAccount ?? restoreLocalAccount;
  const fetchImpl = dependencies.fetch ?? ((input, init) => fetch(input, init));
  const isFunded = dependencies.isWalletFunded ?? isOnboardingWalletFunded;
  const markFunded = dependencies.markWalletFunded ?? markOnboardingWalletFunded;

  const savedSecret = loadSecret();
  const wallet = savedSecret ? restoreAccount(savedSecret) : createAccount();
  const createdWallet = !savedSecret;

  if (createdWallet) {
    saveSecret(wallet.secret);
  }

  const shouldFundWallet = !isFunded(wallet.address);
  await requestOnboardingFunding({
    fetchImpl,
    userAddress: wallet.address,
    fundSol: shouldFundWallet,
    fundUsdc: shouldFundWallet,
    assumeEmptyWallet: createdWallet,
  });

  if (shouldFundWallet) {
    markFunded(wallet.address);
  }

  await dependencies.connectLocalWallet();

  return {
    address: wallet.address,
    createdWallet,
    fundedSol: shouldFundWallet,
    fundedUsdc: shouldFundWallet,
  };
}
