import { PublicKey } from '@solana/web3.js';
import { getAssetSymbol } from '@/lib/assets/asset-symbols';
import { buildSolanaExplorerUrl } from '@/lib/config/runtime';
import {
  generateSolanaWallet,
  getSolBalance,
  getSolanaWalletFromSecretKey,
  getSplTokenBalances,
  hasSplTokenAccount,
  requestSolAirdrop,
  transferSol,
  transferSplToken,
} from '@/lib/client/solana';
import type {
  AssetBalance,
  AssetDefinition,
  AssetTransferReceipt,
  ChainRuntimeConfig,
  LocalAccount,
} from './types';
import { getChainRuntimeConfig } from './config';

export function createLocalAccount(): LocalAccount {
  const wallet = generateSolanaWallet();
  return {
    address: wallet.address,
    secret: wallet.secretKey,
  };
}

export function restoreLocalAccount(secret: string): LocalAccount {
  const wallet = getSolanaWalletFromSecretKey(secret);
  return {
    address: wallet.address,
    secret,
  };
}

export function isValidChainAddress(address: unknown): address is string {
  if (typeof address !== 'string' || address.trim().length === 0) {
    return false;
  }

  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function requestTestFunds(address: string, amount = 1) {
  return requestSolAirdrop(address, amount);
}

export async function getAccountBalances(
  address: string,
  assetDefinitions: AssetDefinition[]
): Promise<AssetBalance[]> {
  const runtime = getChainRuntimeConfig();
  const nativeBalance = await getSolBalance(address);
  const tokenDefinitions = assetDefinitions.filter(
    (asset): asset is AssetDefinition & { assetId: string } => asset.kind === 'token' && Boolean(asset.assetId)
  );

  const tokenBalances = tokenDefinitions.length
    ? await getSplTokenBalances(address, tokenDefinitions.map((asset) => asset.assetId))
    : [];
  const tokenBalanceById = new Map(tokenBalances.map((balance) => [balance.mintAddress, balance]));

  return [
    {
      symbol: runtime.nativeAssetSymbol,
      assetId: null,
      kind: 'native',
      amount: String(nativeBalance.lamports),
      displayAmount: nativeBalance.solAmount.toString(),
    },
    ...tokenDefinitions.map((asset) => {
      const balance = tokenBalanceById.get(asset.assetId);
      return {
        symbol: asset.symbol,
        assetId: asset.assetId,
        kind: 'token' as const,
        amount: balance?.amount ?? '0',
        displayAmount: balance?.uiAmount ?? '0',
      };
    }),
  ];
}

export async function getAssetAvailability(
  address: string,
  assetDefinitions: AssetDefinition[]
): Promise<Record<string, boolean>> {
  const pairs: Array<readonly [string, boolean]> = [];

  for (const asset of assetDefinitions) {
    if (asset.kind === 'native' || !asset.assetId) {
      pairs.push([asset.symbol, true] as const);
      continue;
    }

    const available = await hasSplTokenAccount(address, asset.assetId);
    pairs.push([asset.symbol, available] as const);
  }

  return Object.fromEntries(pairs);
}

export function getAssetBySymbol(
  assetDefinitions: AssetDefinition[],
  symbol: string
): AssetDefinition | null {
  const normalized = getAssetSymbol(symbol.trim()).toUpperCase();
  return assetDefinitions.find((asset) => asset.symbol === normalized) ?? null;
}

export async function transferAsset(params: {
  sourceSecret: string;
  destinationAddress: string;
  asset: AssetDefinition;
  amount: string;
}): Promise<AssetTransferReceipt> {
  const { sourceSecret, destinationAddress, asset, amount } = params;
  const sourceAccount = restoreLocalAccount(sourceSecret);

  if (asset.kind !== 'token' || !asset.assetId) {
    throw new Error(`${asset.symbol} transfer is not supported on the current chain client`);
  }

  const sourceHasAsset = await hasSplTokenAccount(sourceAccount.address, asset.assetId);
  if (!sourceHasAsset) {
    throw new Error(`${asset.symbol} is not ready in the source wallet`);
  }

  const transfer = await transferSplToken(sourceSecret, destinationAddress, asset.assetId, amount);

  return {
    txHash: transfer.signature,
    explorerUrl: transfer.explorerUrl,
    sourceAddress: sourceAccount.address,
    destinationAddress,
    symbol: asset.symbol,
    assetId: asset.assetId,
    amount,
    rawAmount: transfer.rawAmount,
  };
}

export async function transferNativeAsset(params: {
  sourceSecret: string;
  destinationAddress: string;
  amount: string;
}): Promise<AssetTransferReceipt> {
  const { sourceSecret, destinationAddress, amount } = params;
  const sourceAccount = restoreLocalAccount(sourceSecret);
  const runtime = getChainRuntimeConfig();
  const transfer = await transferSol(sourceSecret, destinationAddress, amount);

  return {
    txHash: transfer.signature,
    explorerUrl: transfer.explorerUrl,
    sourceAddress: sourceAccount.address,
    destinationAddress,
    symbol: runtime.nativeAssetSymbol,
    assetId: null,
    amount,
    rawAmount: transfer.rawAmount,
  };
}

export function getChainExplorerLink(kind: 'address' | 'tx', value: string): string {
  return buildSolanaExplorerUrl(kind, value);
}

export function getCurrentChainRuntimeConfig(): ChainRuntimeConfig {
  return getChainRuntimeConfig();
}
