import {
  getSolanaCluster,
  getSolanaCommitment,
  getSolanaExplorerUrl,
  getSolanaRpcUrl,
} from '@/lib/config/runtime';
import { getAssetSymbol } from '@/lib/assets/asset-symbols';
import type { AssetDefinition, ChainRuntimeConfig } from './types';

interface MarketAssetSource {
  collateral_currency: string;
  collateral_issuer: string;
  debt_currency: string;
  debt_issuer: string;
}

export function getChainRuntimeConfig(): ChainRuntimeConfig {
  return {
    chain: 'solana',
    network: getSolanaCluster(),
    rpcUrl: getSolanaRpcUrl(),
    explorerUrl: getSolanaExplorerUrl(),
    commitment: getSolanaCommitment(),
    nativeAssetSymbol: 'SOL',
  };
}

export function buildAssetDefinitions(markets: MarketAssetSource[]): AssetDefinition[] {
  const definitions = new Map<string, AssetDefinition>();

  definitions.set('SOL', {
    symbol: 'SOL',
    assetId: null,
    kind: 'native',
  });

  for (const market of markets) {
    const candidates = [
      { symbol: market.collateral_currency, assetId: market.collateral_issuer },
      { symbol: market.debt_currency, assetId: market.debt_issuer },
    ];

    for (const candidate of candidates) {
      const symbol = getAssetSymbol(candidate.symbol.trim()).toUpperCase();
      const assetId = candidate.assetId.trim();
      if (!symbol || !assetId || definitions.has(symbol)) continue;

      definitions.set(symbol, {
        symbol,
        assetId,
        kind: 'token',
      });
    }
  }

  return Array.from(definitions.values());
}

export function getAssetDefinitionBySymbol(
  assetDefinitions: AssetDefinition[],
  symbol: string
): AssetDefinition | null {
  const normalized = getAssetSymbol(symbol.trim()).toUpperCase();
  return assetDefinitions.find((asset) => asset.symbol === normalized) ?? null;
}
