import type { Commitment } from '@solana/web3.js';
import { APP_DEFAULTS } from './defaults';

export type SolanaCluster = typeof APP_DEFAULTS.solana.cluster;
export type SolanaCommitment = Extract<Commitment, 'confirmed' | 'finalized'>;

export function getSolanaCluster(): SolanaCluster {
  const rawCluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
  if (!rawCluster) {
    return APP_DEFAULTS.solana.cluster;
  }

  if (rawCluster !== APP_DEFAULTS.solana.cluster) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SOLANA_CLUSTER: "${rawCluster}". Expected "${APP_DEFAULTS.solana.cluster}".`
    );
  }

  return APP_DEFAULTS.solana.cluster;
}

export function getSolanaRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || APP_DEFAULTS.solana.rpcUrl;
}

export function getSolanaExplorerUrl(): string {
  return process.env.NEXT_PUBLIC_SOLANA_EXPLORER_URL || APP_DEFAULTS.solana.explorerUrl;
}

export function getSolanaCommitment(): SolanaCommitment {
  const rawCommitment = process.env.NEXT_PUBLIC_SOLANA_COMMITMENT;
  if (!rawCommitment) {
    return APP_DEFAULTS.solana.commitment;
  }

  if (rawCommitment !== 'confirmed' && rawCommitment !== 'finalized') {
    throw new Error(
      `Invalid NEXT_PUBLIC_SOLANA_COMMITMENT: "${rawCommitment}". Expected "confirmed" or "finalized".`
    );
  }

  return rawCommitment;
}

export function buildSolanaExplorerUrl(kind: 'address' | 'tx', value: string): string {
  const baseUrl = getSolanaExplorerUrl().replace(/\/+$/, '');
  return `${baseUrl}/${kind}/${value}?cluster=${getSolanaCluster()}`;
}

export function getDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL;
  if (direct) {
    return direct;
  }

  throw new Error(
    [
      'Missing database configuration for devnet.',
      'Set DATABASE_URL in .env.local.',
    ].join('\n')
  );
}
