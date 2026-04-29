export type ChainKind = 'solana';
export type AssetKind = 'native' | 'token';
export type LocalConnectionType = 'local';

export interface LocalAccount {
  address: string;
  secret: string;
}

export interface AssetDefinition {
  symbol: string;
  assetId: string | null;
  kind: AssetKind;
}

export interface AssetBalance {
  symbol: string;
  assetId: string | null;
  kind: AssetKind;
  amount: string;
  displayAmount: string;
}

export interface AssetTransferReceipt {
  txHash: string;
  explorerUrl: string;
  sourceAddress: string;
  destinationAddress: string;
  symbol: string;
  assetId: string | null;
  amount: string;
  rawAmount: string;
}

export interface ChainRuntimeConfig {
  chain: ChainKind;
  network: 'devnet';
  rpcUrl: string;
  explorerUrl: string;
  commitment: 'confirmed' | 'finalized';
  nativeAssetSymbol: 'SOL';
}
