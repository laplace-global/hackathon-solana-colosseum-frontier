import Decimal from 'decimal.js';

import { getSolBalance } from '@/lib/client/solana';
import {
  getReserveSecret,
  getTreasuryAddress,
  getTreasurySecret,
} from './service-account';
import { requestTestFunds, transferNativeAsset } from './client';

export const USER_SOL_FEE_MINIMUM = '0.01';
export const USER_SOL_FEE_TARGET = '0.05';
export const TREASURY_SOL_MINIMUM = '5';
export const TREASURY_SOL_TARGET = '20';

type SolBalanceReader = typeof getSolBalance;
type NativeAssetTransfer = (params: {
  sourceSecret: string;
  destinationAddress: string;
  amount: string;
}) => Promise<{ txHash: string }>;
type TestFundsRequester = (address: string, amount?: number) => Promise<{ signature: string }>;

export interface SolFeeTopUpDependencies {
  getSolBalance: SolBalanceReader;
  transferNativeAsset: NativeAssetTransfer;
  requestTestFunds: TestFundsRequester;
  getTreasuryAddress: () => string;
  getTreasurySecret: () => string;
  getReserveSecret: () => string | null;
}

export interface SolFeeTopUpResult {
  balanceBeforeSol: string;
  topUpAmount: string | null;
  txHash: string | null;
}

export interface TreasurySolTopUpResult extends SolFeeTopUpResult {
  treasuryAddress: string;
  source: 'reserve' | 'airdrop' | null;
}

const DEFAULT_DEPS: SolFeeTopUpDependencies = {
  getSolBalance,
  transferNativeAsset,
  requestTestFunds,
  getTreasuryAddress,
  getTreasurySecret,
  getReserveSecret,
};

export function calculateSolTopUpAmount(params: {
  currentSol: Decimal.Value;
  minimumSol?: Decimal.Value;
  targetSol?: Decimal.Value;
}): string | null {
  const current = new Decimal(params.currentSol);
  const minimum = new Decimal(params.minimumSol ?? USER_SOL_FEE_MINIMUM);
  const target = new Decimal(params.targetSol ?? USER_SOL_FEE_TARGET);

  if (current.gte(minimum)) return null;

  const topUpAmount = target.minus(current);
  if (topUpAmount.lte(0)) return null;

  return topUpAmount.toFixed();
}

function getTreasuryMinimumSol(value?: string): string {
  return value ?? process.env.TREASURY_SOL_MINIMUM ?? TREASURY_SOL_MINIMUM;
}

function getTreasuryTargetSol(value?: string): string {
  return value ?? process.env.TREASURY_SOL_TARGET ?? TREASURY_SOL_TARGET;
}

export async function ensureTreasuryHasSolBalance(
  params: {
    minimumSol?: string;
    targetSol?: string;
  } = {},
  deps: SolFeeTopUpDependencies = DEFAULT_DEPS
): Promise<TreasurySolTopUpResult> {
  const treasuryAddress = deps.getTreasuryAddress();
  const balance = await deps.getSolBalance(treasuryAddress);
  const balanceBeforeSol = balance.solAmount.toString();
  const topUpAmount = calculateSolTopUpAmount({
    currentSol: balanceBeforeSol,
    minimumSol: getTreasuryMinimumSol(params.minimumSol),
    targetSol: getTreasuryTargetSol(params.targetSol),
  });

  if (!topUpAmount) {
    return {
      treasuryAddress,
      balanceBeforeSol,
      topUpAmount: null,
      txHash: null,
      source: null,
    };
  }

  const reserveSecret = deps.getReserveSecret();
  if (reserveSecret) {
    try {
      const transfer = await deps.transferNativeAsset({
        sourceSecret: reserveSecret,
        destinationAddress: treasuryAddress,
        amount: topUpAmount,
      });

      return {
        treasuryAddress,
        balanceBeforeSol,
        topUpAmount,
        txHash: transfer.txHash,
        source: 'reserve',
      };
    } catch (reserveError) {
      console.warn('Treasury SOL reserve top-up failed; falling back to devnet airdrop:', reserveError);
    }
  }

  const airdrop = await deps.requestTestFunds(treasuryAddress, Number(topUpAmount));
  return {
    treasuryAddress,
    balanceBeforeSol,
    topUpAmount,
    txHash: airdrop.signature,
    source: 'airdrop',
  };
}

export async function replenishTreasurySolBestEffort(
  params: {
    minimumSol?: string;
    targetSol?: string;
  } = {},
  deps: SolFeeTopUpDependencies = DEFAULT_DEPS
): Promise<TreasurySolTopUpResult | null> {
  try {
    return await ensureTreasuryHasSolBalance(params, deps);
  } catch (error) {
    console.warn('Treasury SOL auto-replenishment failed:', error);
    return null;
  }
}

export async function ensureUserHasFeeSolBalance(params: {
  userAddress: string;
  minimumSol?: string;
  targetSol?: string;
}, deps: SolFeeTopUpDependencies = DEFAULT_DEPS): Promise<SolFeeTopUpResult> {
  const balance = await deps.getSolBalance(params.userAddress);
  const balanceBeforeSol = balance.solAmount.toString();
  const topUpAmount = calculateSolTopUpAmount({
    currentSol: balanceBeforeSol,
    minimumSol: params.minimumSol,
    targetSol: params.targetSol,
  });

  if (!topUpAmount || params.userAddress === deps.getTreasuryAddress()) {
    return {
      balanceBeforeSol,
      topUpAmount: null,
      txHash: null,
    };
  }

  await replenishTreasurySolBestEffort({}, deps);

  const transfer = await deps.transferNativeAsset({
    sourceSecret: deps.getTreasurySecret(),
    destinationAddress: params.userAddress,
    amount: topUpAmount,
  });

  return {
    balanceBeforeSol,
    topUpAmount,
    txHash: transfer.txHash,
  };
}
