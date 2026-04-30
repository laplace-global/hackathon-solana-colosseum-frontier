import type { AssetDefinition, ChainRuntimeConfig } from '@/lib/chain/types';

export interface MarketConfig {
  id: string;
  name: string;
  collateralCurrency: string;
  debtCurrency: string;
  debtIssuer: string;
  debtAssetId: string;
  liquidityPoolId: string | null;
  positionTokenAssetId: string | null;
  liquidityShareScale: number;
  baseInterestRate: number;
  minSupplyAmount: number;
  reserveFactor: number;
}

export interface LendingConfig {
  markets: MarketConfig[];
  treasuryAddress: string;
  operatorAddress: string;
  issuerAddress: string;
  backendAddress: string;
  explorerUrl: string;
  chain?: string;
  rpcUrl?: string;
  chainConfig?: ChainRuntimeConfig;
  assetDefinitions?: AssetDefinition[];
}

export interface PoolMetrics {
  marketId: string;
  totalSupplied: number;
  totalBorrowed: number;
  totalCollateralLocked?: number;
  totalShares?: number;
  availableLiquidity: number;
  utilizationRate: number;
  borrowApr: number;
  supplyApr: number;
  supplyApy: number;
  globalYieldIndex: number;
}

export interface SupplyPosition {
  id: string;
  status: 'ACTIVE' | 'CLOSED';
  supplyAmount: number;
  suppliedAt: string;
}

export interface SupplyPositionMetrics {
  accruedYield: number;
  withdrawableAmount: number;
  availableLiquidity: number;
  utilizationRate: number;
  supplyApr: number;
  supplyApy: number;
}

export interface SupplierEvent {
  id: string;
  eventType: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number | null;
  currency: string | null;
  createdAt: string;
  errorMessage: string | null;
}
