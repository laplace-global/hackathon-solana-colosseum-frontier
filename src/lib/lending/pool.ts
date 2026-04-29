import Decimal from 'decimal.js';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { db, markets, positions } from '../db';
import {
  calculateGlobalYieldIndex,
  calculateSupplyApr,
  calculateSupplyApy,
  calculateUtilizationRate,
} from './calculations';
import { PoolMetrics } from './types';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_DOWN });

const TOKEN_SCALE = 8;

type DbClient = typeof db;

interface MarketPoolState {
  id: string;
  totalSupplied: number;
  totalBorrowed: number;
  totalCollateralLocked: number;
  totalShares: number | null;
  poolAvailableAssets: number | null;
  baseInterestRate: number;
  reserveFactor: number;
  globalYieldIndex: number;
  lastIndexUpdate: Date;
}

function toAmount(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(TOKEN_SCALE, Decimal.ROUND_DOWN).toNumber();
}

function parsePoolState(row: typeof markets.$inferSelect): MarketPoolState {
  return {
    id: row.id,
    totalSupplied: parseFloat(row.totalSupplied),
    totalBorrowed: parseFloat(row.totalBorrowed),
    totalCollateralLocked: 0,
    totalShares: null,
    poolAvailableAssets: null,
    baseInterestRate: parseFloat(row.baseInterestRate),
    reserveFactor: parseFloat(row.reserveFactor),
    globalYieldIndex: parseFloat(row.globalYieldIndex),
    lastIndexUpdate: row.lastIndexUpdate,
  };
}

async function hydrateCollateralPoolState(
  state: MarketPoolState,
  database: DbClient = db
): Promise<MarketPoolState> {
  const [result] = await database
    .select({
      total: sql<string>`coalesce(sum(${positions.collateralAmount}), 0)`,
    })
    .from(positions)
    .where(and(eq(positions.marketId, state.id), inArray(positions.status, ['LOCKED', 'ACTIVE', 'REPAID'])));

  return {
    ...state,
    totalCollateralLocked: toAmount(result?.total ?? '0'),
  };
}

async function getMarketPoolState(marketId: string, database: DbClient = db): Promise<MarketPoolState | null> {
  const market = await database.query.markets.findFirst({
    where: and(eq(markets.id, marketId), eq(markets.isActive, true)),
  });

  if (!market) {
    return null;
  }

  const baseState = parsePoolState(market);
  const collateralState = await hydrateCollateralPoolState(baseState, database);

  return {
    ...baseState,
    totalCollateralLocked: collateralState.totalCollateralLocked,
  };
}

function buildPoolMetrics(state: MarketPoolState): PoolMetrics {
  const dbModeAvailableLiquidity = toAmount(
    Decimal.max(0, new Decimal(state.totalSupplied).sub(new Decimal(state.totalBorrowed)))
  );
  const availableLiquidity = state.poolAvailableAssets === null
    ? dbModeAvailableLiquidity
    : Math.min(dbModeAvailableLiquidity, state.poolAvailableAssets);
  const utilizationRate = calculateUtilizationRate(state.totalBorrowed, state.totalSupplied);
  const supplyApr = calculateSupplyApr(state.baseInterestRate, utilizationRate, state.reserveFactor);
  const supplyApy = calculateSupplyApy(supplyApr);

  return {
    marketId: state.id,
    totalSupplied: state.totalSupplied,
    totalBorrowed: state.totalBorrowed,
    totalCollateralLocked: state.totalCollateralLocked,
    totalShares: state.totalShares ?? undefined,
    availableLiquidity,
    utilizationRate,
    borrowApr: state.baseInterestRate,
    supplyApr,
    supplyApy,
    globalYieldIndex: state.globalYieldIndex,
    reserveFactor: state.reserveFactor,
    lastIndexUpdate: state.lastIndexUpdate,
  };
}

export async function getPoolMetrics(marketId: string, database: DbClient = db): Promise<PoolMetrics | null> {
  const state = await getMarketPoolState(marketId, database);
  if (!state) {
    return null;
  }

  return buildPoolMetrics(state);
}

export async function getAvailableLiquidity(marketId: string, database: DbClient = db): Promise<number> {
  const metrics = await getPoolMetrics(marketId, database);
  if (!metrics) {
    throw new Error('Market not found');
  }

  return metrics.availableLiquidity;
}

export async function updateGlobalYieldIndex(
  marketId: string,
  database: DbClient = db
): Promise<{ globalYieldIndex: number; supplyApr: number; lastIndexUpdate: Date }> {
  const state = await getMarketPoolState(marketId, database);
  if (!state) {
    throw new Error('Market not found');
  }

  const utilizationRate = calculateUtilizationRate(state.totalBorrowed, state.totalSupplied);
  const supplyApr = calculateSupplyApr(state.baseInterestRate, utilizationRate, state.reserveFactor);
  const now = new Date();
  const nextGlobalYieldIndex = calculateGlobalYieldIndex(
    state.globalYieldIndex,
    supplyApr,
    state.lastIndexUpdate,
    now
  );

  await database
    .update(markets)
    .set({
      globalYieldIndex: nextGlobalYieldIndex.toString(),
      lastIndexUpdate: now,
      updatedAt: now,
    })
    .where(eq(markets.id, marketId));

  return {
    globalYieldIndex: nextGlobalYieldIndex,
    supplyApr,
    lastIndexUpdate: now,
  };
}
