/**
 * Position Management Service
 *
 * Handles lending position CRUD operations with interest accrual using Drizzle ORM.
 */

import { eq, and, asc, desc, inArray, sql } from 'drizzle-orm';
import { db, users, positions, markets, onchainTransactions, appEvents, Position as DbPosition } from '../db';
import { getOrCreateUser } from '../db/seed';
import { LENDING_EVENTS, PositionStatus, Position, PositionMetrics, Market, ActiveCollateralLockPosition } from './types';
import {
  calculateInterestAccrued,
  calculateTotalDebt,
  calculateLtv,
  calculateHealthFactor,
  calculateMaxBorrowable,
  calculateMaxWithdrawable,
  isLiquidatable,
} from './calculations';

/**
 * Convert database position to Position object
 */
function dbToPosition(row: DbPosition): Position {
  return {
    id: row.id,
    userId: row.userId,
    marketId: row.marketId,
    status: row.status as PositionStatus,
    collateralAmount: parseFloat(row.collateralAmount),
    loanPrincipal: parseFloat(row.loanPrincipal),
    interestAccrued: parseFloat(row.interestAccrued),
    lastInterestUpdate: row.lastInterestUpdate,
    interestRateAtOpen: parseFloat(row.interestRateAtOpen),
    openedAt: row.openedAt,
    closedAt: row.closedAt,
    liquidatedAt: row.liquidatedAt,
    loanId: row.loanId,
    loanHash: row.loanHash,
    loanTermMonths: row.loanTermMonths,
    loanMaturityDate: row.loanMaturityDate,
    loanOpenedAtSlot: row.loanOpenedAtSlot,
  };
}

export interface PositionLoanMetadata {
  loanId: string;
  loanHash: string;
  loanTermMonths: number;
  loanMaturityDate: Date | null;
  loanOpenedAtSlot: number | null;
}

const OPEN_POSITION_STATUSES: PositionStatus[] = ['LOCKED', 'ACTIVE', 'REPAID'];

function resolveOpenPositionStatus(params: {
  collateralAmount: number;
  loanPrincipal: number;
  interestAccrued: number;
  previousStatus: PositionStatus;
  zeroDebtStatus?: 'LOCKED' | 'REPAID';
}): PositionStatus {
  const { collateralAmount, loanPrincipal, interestAccrued, previousStatus, zeroDebtStatus } = params;

  if (loanPrincipal > 0 || interestAccrued > 0) {
    return 'ACTIVE';
  }

  if (collateralAmount <= 0) {
    return 'CLOSED';
  }

  if (zeroDebtStatus) {
    return zeroDebtStatus;
  }

  return previousStatus === 'REPAID' ? 'REPAID' : 'LOCKED';
}

export async function setPositionStatus(positionId: string, status: PositionStatus): Promise<void> {
  await db
    .update(positions)
    .set({
      status,
      ...(status === 'CLOSED' ? { closedAt: new Date() } : {}),
    })
    .where(eq(positions.id, positionId));
}

/**
 * Get or create a position for a user in a market
 */
export async function getOrCreatePosition(
  userAddress: string,
  marketId: string,
  interestRate: number
): Promise<Position> {
  const userId = await getOrCreateUser(userAddress);

  // Reuse the single position row per user/market.
  const existing = await db.query.positions.findFirst({
    where: and(eq(positions.userId, userId), eq(positions.marketId, marketId)),
  });

  if (existing) {
    if (existing.status === 'CLOSED' || existing.status === 'LIQUIDATED') {
      const now = new Date();
      const [reopened] = await db
        .update(positions)
        .set({
          status: 'LOCKED',
          collateralAmount: '0',
          loanPrincipal: '0',
          interestAccrued: '0',
          interestRateAtOpen: interestRate.toString(),
          lastInterestUpdate: now,
          openedAt: now,
          closedAt: null,
          liquidatedAt: null,
          loanId: null,
          loanHash: null,
          loanTermMonths: 3,
          loanMaturityDate: null,
          loanOpenedAtSlot: null,
        })
        .where(eq(positions.id, existing.id))
        .returning();

      return dbToPosition(reopened);
    }

    return dbToPosition(existing);
  }

  // Create new position
  const [newPosition] = await db
    .insert(positions)
    .values({
      userId,
      marketId,
      status: 'LOCKED',
      collateralAmount: '0',
      loanPrincipal: '0',
      interestAccrued: '0',
      interestRateAtOpen: interestRate.toString(),
    })
    .returning();

  return dbToPosition(newPosition);
}

/**
 * Get position by ID
 */
export async function getPositionById(positionId: string): Promise<Position | null> {
  const position = await db.query.positions.findFirst({
    where: eq(positions.id, positionId),
  });

  return position ? dbToPosition(position) : null;
}

/**
 * Get position for user in a market
 */
export async function getPositionForUser(userAddress: string, marketId: string): Promise<Position | null> {
  // Get user ID
  const user = await db.query.users.findFirst({
    where: eq(users.walletAddress, userAddress),
    columns: { id: true },
  });

  if (!user) {
    return null;
  }

  const position = await db.query.positions.findFirst({
    where: and(
      eq(positions.userId, user.id),
      eq(positions.marketId, marketId),
      inArray(positions.status, OPEN_POSITION_STATUSES)
    ),
  });

  return position ? dbToPosition(position) : null;
}

/**
 * Accrue interest on a position and update the database
 */
export async function accrueInterest(position: Position): Promise<Position> {
  const now = new Date();

  if (position.loanPrincipal <= 0) {
    return position;
  }

  const newInterest = calculateInterestAccrued(
    position.loanPrincipal,
    position.interestRateAtOpen,
    position.lastInterestUpdate,
    now
  );

  if (newInterest <= 0) {
    return position;
  }

  const updatedInterest = position.interestAccrued + newInterest;

  await db
    .update(positions)
    .set({
      interestAccrued: updatedInterest.toString(),
      lastInterestUpdate: now,
    })
    .where(eq(positions.id, position.id));

  return {
    ...position,
    interestAccrued: updatedInterest,
    lastInterestUpdate: now,
  };
}

/**
 * Add collateral to a position
 */
export async function addCollateral(positionId: string, amount: number): Promise<Position> {
  // First accrue interest
  let position = await getPositionById(positionId);
  if (!position) {
    throw new Error('Position not found');
  }

  position = await accrueInterest(position);

  const newCollateral = position.collateralAmount + amount;
  const nextStatus = resolveOpenPositionStatus({
    collateralAmount: newCollateral,
    loanPrincipal: position.loanPrincipal,
    interestAccrued: position.interestAccrued,
    previousStatus: position.status,
  });

  await db
    .update(positions)
    .set({
      status: nextStatus,
      collateralAmount: newCollateral.toString(),
      lastInterestUpdate: new Date(),
    })
    .where(eq(positions.id, positionId));

  return {
    ...position,
    status: nextStatus,
    collateralAmount: newCollateral,
  };
}

/**
 * Remove collateral from a position
 */
export async function removeCollateral(positionId: string, amount: number): Promise<Position> {
  let position = await getPositionById(positionId);
  if (!position) {
    throw new Error('Position not found');
  }

  position = await accrueInterest(position);

  if (amount > position.collateralAmount) {
    throw new Error('Insufficient collateral');
  }

  const newCollateral = position.collateralAmount - amount;
  const nextStatus = resolveOpenPositionStatus({
    collateralAmount: newCollateral,
    loanPrincipal: position.loanPrincipal,
    interestAccrued: position.interestAccrued,
    previousStatus: position.status,
  });

  await db
    .update(positions)
    .set({
      status: nextStatus,
      collateralAmount: newCollateral.toString(),
      lastInterestUpdate: new Date(),
    })
    .where(eq(positions.id, positionId));

  return {
    ...position,
    status: nextStatus,
    collateralAmount: newCollateral,
  };
}

/**
 * Close a position (when fully repaid and no collateral)
 */
export async function closePosition(positionId: string): Promise<Position> {
  const position = await getPositionById(positionId);
  if (!position) {
    throw new Error('Position not found');
  }

  if (position.loanPrincipal > 0 || position.interestAccrued > 0) {
    throw new Error('Cannot close position with outstanding debt');
  }

  if (position.collateralAmount > 0) {
    throw new Error('Cannot close position with remaining collateral');
  }

  const now = new Date();

  await db
    .update(positions)
    .set({
      status: 'CLOSED',
      closedAt: now,
    })
    .where(eq(positions.id, positionId));

  return {
    ...position,
    status: 'CLOSED',
    closedAt: now,
  };
}

/**
 * Mark position as liquidated
 */
export async function liquidatePosition(positionId: string): Promise<Position> {
  const now = new Date();

  await db
    .update(positions)
    .set({
      status: 'LIQUIDATED',
      liquidatedAt: now,
      collateralAmount: '0',
      loanPrincipal: '0',
      interestAccrued: '0',
    })
    .where(eq(positions.id, positionId));

  const position = await getPositionById(positionId);
  if (!position) {
    throw new Error('Position not found after liquidation');
  }

  return position;
}

export async function setPositionLoanMetadata(
  positionId: string,
  metadata: PositionLoanMetadata
): Promise<void> {
  await db
    .update(positions)
    .set({
      loanId: metadata.loanId,
      loanHash: metadata.loanHash,
      loanTermMonths: metadata.loanTermMonths,
      loanMaturityDate: metadata.loanMaturityDate,
      loanOpenedAtSlot: metadata.loanOpenedAtSlot,
    })
    .where(eq(positions.id, positionId));
}

export async function clearPositionLoanMetadata(positionId: string): Promise<void> {
  await db
    .update(positions)
    .set({
      loanId: null,
      loanHash: null,
      loanTermMonths: 3,
      loanMaturityDate: null,
      loanOpenedAtSlot: null,
      loanPrincipal: '0',
      interestAccrued: '0',
      lastInterestUpdate: new Date(),
    })
    .where(eq(positions.id, positionId));
}

export async function getActiveLockedCollateralPositions(
  marketId?: string,
  limit: number = 20
): Promise<ActiveCollateralLockPosition[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const filters = [
    inArray(positions.status, OPEN_POSITION_STATUSES),
    sql`${positions.collateralAmount}::numeric > 0`,
  ];

  if (marketId) {
    filters.push(eq(positions.marketId, marketId));
  }

  const lockedPositions = await db.query.positions.findMany({
    where: and(...filters),
    columns: {
      id: true,
      userId: true,
      collateralAmount: true,
      marketId: true,
    },
    orderBy: [desc(positions.openedAt), asc(positions.id)],
    limit: safeLimit,
  });

  if (lockedPositions.length === 0) {
    return [];
  }

  const marketIds = [...new Set(lockedPositions.map((row) => row.marketId))];
  const userIds = [...new Set(lockedPositions.map((row) => row.userId))];
  const positionIds = [...new Set(lockedPositions.map((row) => row.id))];

  const [marketRows, userRows, lockEventRows] = await Promise.all([
    db.query.markets.findMany({
      where: inArray(markets.id, marketIds),
      columns: {
        id: true,
        collateralCurrency: true,
      },
    }),
    db.query.users.findMany({
      where: inArray(users.id, userIds),
      columns: {
        id: true,
        walletAddress: true,
      },
    }),
    db.query.appEvents.findMany({
      where: and(
        eq(appEvents.eventType, LENDING_EVENTS.DEPOSIT_CONFIRMED),
        inArray(appEvents.positionId, positionIds)
      ),
      columns: {
        positionId: true,
        onchainTxId: true,
      },
      orderBy: [desc(appEvents.createdAt)],
      limit: 500,
    }),
  ]);

  const collateralCurrencyByMarketId = new Map(marketRows.map((row) => [row.id, row.collateralCurrency]));
  const walletAddressByUserId = new Map(userRows.map((row) => [row.id, row.walletAddress]));
  const latestOnchainTxIdByPositionId = new Map<string, string>();

  for (const row of lockEventRows) {
    if (!row.positionId || !row.onchainTxId || latestOnchainTxIdByPositionId.has(row.positionId)) {
      continue;
    }

    latestOnchainTxIdByPositionId.set(row.positionId, row.onchainTxId);
  }

  const txIds = [...new Set([...latestOnchainTxIdByPositionId.values()])];
  const txRows = txIds.length
    ? await db.query.onchainTransactions.findMany({
        where: inArray(onchainTransactions.id, txIds),
        columns: {
          id: true,
          txId: true,
        },
      })
    : [];
  const txIdByOnchainRowId = new Map(txRows.map((row) => [row.id, row.txId]));

  return lockedPositions.flatMap((row) => {
    const walletAddress = walletAddressByUserId.get(row.userId);
    if (!walletAddress) {
      return [];
    }

    const onchainRowId = latestOnchainTxIdByPositionId.get(row.id);
    return [
      {
        walletAddress,
        collateralAmount: parseFloat(row.collateralAmount),
        collateralCurrency: collateralCurrencyByMarketId.get(row.marketId) ?? 'UNKNOWN',
        txHash: onchainRowId ? txIdByOnchainRowId.get(onchainRowId) ?? null : null,
      },
    ];
  });
}

/**
 * Calculate position metrics
 */
export function calculatePositionMetrics(
  position: Position,
  market: Market,
  collateralPriceUsd: number,
  debtPriceUsd: number
): PositionMetrics {
  // Accrue interest for accurate metrics
  const newInterest = calculateInterestAccrued(
    position.loanPrincipal,
    position.interestRateAtOpen,
    position.lastInterestUpdate,
    new Date()
  );

  const totalInterest = position.interestAccrued + newInterest;
  const totalDebt = calculateTotalDebt(position.loanPrincipal, totalInterest);
  const collateralValueUsd = position.collateralAmount * collateralPriceUsd;
  const debtValueUsd = totalDebt * debtPriceUsd;
  const currentLtv = calculateLtv(position.collateralAmount, collateralPriceUsd, totalDebt, debtPriceUsd);
  const healthFactor = calculateHealthFactor(currentLtv, market.liquidationLtvRatio);
  const liquidatable = isLiquidatable(currentLtv, market.liquidationLtvRatio);
  const maxBorrowableAmount = calculateMaxBorrowable(
    position.collateralAmount,
    collateralPriceUsd,
    totalDebt,
    debtPriceUsd,
    market.maxLtvRatio
  );
  const maxWithdrawableAmount = calculateMaxWithdrawable(
    position.collateralAmount,
    collateralPriceUsd,
    totalDebt,
    debtPriceUsd,
    market.maxLtvRatio
  );

  return {
    totalDebt,
    collateralValueUsd,
    debtValueUsd,
    currentLtv,
    healthFactor,
    liquidatable,
    maxBorrowableAmount,
    maxWithdrawableAmount,
  };
}

/**
 * Get all liquidatable positions for a market
 */
export async function getLiquidatablePositions(
  marketId: string,
  liquidationLtvRatio: number,
  collateralPriceUsd: number,
  debtPriceUsd: number,
  limit: number = 100
): Promise<Position[]> {
  const rows = await db.query.positions.findMany({
    where: and(eq(positions.marketId, marketId), eq(positions.status, 'ACTIVE')),
    limit,
  });

  const liquidatable: Position[] = [];

  for (const row of rows) {
    const position = dbToPosition(row);

    if (position.loanPrincipal <= 0) {
      continue;
    }

    // Accrue interest
    const newInterest = calculateInterestAccrued(
      position.loanPrincipal,
      position.interestRateAtOpen,
      position.lastInterestUpdate,
      new Date()
    );

    const totalDebt = calculateTotalDebt(position.loanPrincipal, position.interestAccrued + newInterest);
    const currentLtv = calculateLtv(position.collateralAmount, collateralPriceUsd, totalDebt, debtPriceUsd);

    if (isLiquidatable(currentLtv, liquidationLtvRatio)) {
      liquidatable.push(position);
    }
  }

  return liquidatable;
}

/**
 * Check if a single position is liquidatable
 *
 * Reuses the same health check logic as getLiquidatablePositions.
 */
export function checkPositionLiquidatable(
  position: Position,
  liquidationLtvRatio: number,
  collateralPriceUsd: number,
  debtPriceUsd: number
): boolean {
  if (position.loanPrincipal <= 0) {
    return false;
  }

  const newInterest = calculateInterestAccrued(
    position.loanPrincipal,
    position.interestRateAtOpen,
    position.lastInterestUpdate,
    new Date()
  );

  const totalDebt = calculateTotalDebt(position.loanPrincipal, position.interestAccrued + newInterest);
  const currentLtv = calculateLtv(position.collateralAmount, collateralPriceUsd, totalDebt, debtPriceUsd);

  return isLiquidatable(currentLtv, liquidationLtvRatio);
}
