import type { Commitment } from '@solana/web3.js';

export type SolanaCluster = 'devnet';
export type SolanaCommitment = Extract<Commitment, 'confirmed' | 'finalized'>;

const SOLANA_DEVNET_DEFAULTS = {
  rpcUrl: 'https://api.devnet.solana.com',
  explorerUrl: 'https://explorer.solana.com',
  commitment: 'confirmed' as const,
};

export function getSolanaCluster(): SolanaCluster {
  const rawCluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
  if (!rawCluster) {
    return 'devnet';
  }

  if (rawCluster !== 'devnet') {
    throw new Error(
      `Invalid NEXT_PUBLIC_SOLANA_CLUSTER: "${rawCluster}". Expected "devnet".`
    );
  }

  return 'devnet';
}

export function getSolanaRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || SOLANA_DEVNET_DEFAULTS.rpcUrl;
}

export function getSolanaExplorerUrl(): string {
  return process.env.NEXT_PUBLIC_SOLANA_EXPLORER_URL || SOLANA_DEVNET_DEFAULTS.explorerUrl;
}

export function getSolanaCommitment(): SolanaCommitment {
  const rawCommitment = process.env.NEXT_PUBLIC_SOLANA_COMMITMENT;
  if (!rawCommitment) {
    return SOLANA_DEVNET_DEFAULTS.commitment;
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
