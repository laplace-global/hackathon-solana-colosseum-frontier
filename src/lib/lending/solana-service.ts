import Decimal from 'decimal.js';
import { eq } from 'drizzle-orm';

import { restoreLocalAccount, transferAsset, transferNativeAsset } from '@/lib/chain/client';
import { getSolBalance } from '@/lib/client/solana';
import {
  getOperatorAccount,
  getTreasuryAddress,
  getTreasurySecret,
} from '@/lib/chain/service-account';
import { db, markets, positions } from '@/lib/db';
import { getMarketById, getMarketPrices } from '@/lib/db/seed';

import { DEFAULT_LOAN_TERM_MONTHS } from './constants';
import { emitAppEvent, updateEventStatus } from './events';
import { upsertOnchainTransaction } from './onchain';
import {
  accrueInterest,
  addCollateral,
  calculatePositionMetrics,
  clearPositionLoanMetadata,
  closePosition,
  getOrCreatePosition,
  getPositionForUser,
  removeCollateral,
  setPositionStatus,
  setPositionLoanMetadata,
} from './positions';
import { getAvailableLiquidity, getPoolMetrics, updateGlobalYieldIndex } from './pool';
import {
  addSupply,
  getOrCreateSupplyPosition,
  getSupplyPositionForUser,
  removeSupply,
} from './supply';
import {
  LENDING_EVENTS,
  type BorrowResult,
  type CollectYieldResult,
  type DepositResult,
  type Market,
  type Position,
  type PositionMetrics,
  type RepayResult,
  type SupplyPositionMetrics,
  type SupplyResult,
  type WithdrawResult,
  type WithdrawSupplyResult,
} from './types';
import { allocateRepayment, calculateTotalDebt, validateBorrow } from './calculations';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_DOWN });

const TOKEN_SCALE = 8;
const LOAN_REPAYMENT_DECIMALS = 6;
const OPERATOR_MIN_SOL_BALANCE = 0.002;
const OPERATOR_FEE_TOP_UP_AMOUNT = '0.01';

type MarketRecord = NonNullable<Awaited<ReturnType<typeof getMarketById>>>;

export interface LendingServiceError {
  code: string;
  message: string;
}

interface LoanRepaymentOverview {
  loanId: string;
  minimumRepayment: number | null;
  fullRepayment: number | null;
  suggestedOverpayment: number | null;
  periodicPayment: number | null;
  paymentRemaining: number | null;
  nextPaymentDueDate: string | null;
  isPastDue: boolean;
}

function createError(code: string, message: string): LendingServiceError {
  return { code, message };
}

async function ensureOperatorHasFeeBalance(operatorAddress: string): Promise<void> {
  const balance = await getSolBalance(operatorAddress);
  if (balance.solAmount >= OPERATOR_MIN_SOL_BALANCE) {
    return;
  }

  await transferNativeAsset({
    sourceSecret: getTreasurySecret(),
    destinationAddress: operatorAddress,
    amount: OPERATOR_FEE_TOP_UP_AMOUNT,
  });
}

function toAmount(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(TOKEN_SCALE, Decimal.ROUND_DOWN).toNumber();
}

function toTokenString(value: Decimal.Value): string {
  return new Decimal(value).toDecimalPlaces(TOKEN_SCALE, Decimal.ROUND_DOWN).toFixed(TOKEN_SCALE);
}

function buildTokenAsset(symbol: string, mintAddress: string) {
  return {
    symbol: symbol.trim().toUpperCase(),
    assetId: mintAddress,
    kind: 'token' as const,
  };
}

function mapMarketRecordToDomain(market: MarketRecord): Market {
  return {
    id: market.id,
    name: market.name,
    collateralCurrency: market.collateral_currency,
    collateralIssuer: market.collateral_issuer,
    collateralAssetId: market.collateral_issuer,
    debtCurrency: market.debt_currency,
    debtIssuer: market.debt_issuer,
    debtAssetId: market.debt_issuer,
    maxLtvRatio: market.max_ltv_ratio,
    liquidationLtvRatio: market.liquidation_ltv_ratio,
    baseInterestRate: market.base_interest_rate,
    liquidationPenalty: market.liquidation_penalty,
    collateralLockEnabled: true,
    minCollateralAmount: market.min_collateral_amount,
    minBorrowAmount: market.min_borrow_amount,
    minSupplyAmount: market.min_supply_amount,
    liquidityPoolId: market.liquidity_pool_id,
    positionTokenAssetId: market.position_token_asset_id,
    liquidityShareScale: market.liquidity_share_scale,
    totalSupplied: market.total_supplied,
    totalBorrowed: market.total_borrowed,
    globalYieldIndex: market.global_yield_index,
    reserveFactor: market.reserve_factor,
    lastIndexUpdate: market.last_index_update,
  };
}

function buildSolanaRawTx(params: {
  operation: string;
  txHash: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: number;
  symbol: string;
  mintAddress: string;
}): Record<string, unknown> {
  const { operation, txHash, sourceAddress, destinationAddress, amount, symbol, mintAddress } = params;

  return {
    chain: 'solana',
    operation,
    signature: txHash,
    sourceAddress,
    destinationAddress,
    amount: toTokenString(amount),
    symbol,
    mintAddress,
  };
}

function buildLoanRepaymentOverview(
  position: Position,
  totalDebt: number
): LoanRepaymentOverview | null {
  if (totalDebt <= 0) {
    return null;
  }

  const now = new Date();
  const nextPaymentDueDate = new Date(now);
  nextPaymentDueDate.setDate(nextPaymentDueDate.getDate() + 30);

  const roundedDebt = Number(totalDebt.toFixed(LOAN_REPAYMENT_DECIMALS));

  return {
    loanId: position.loanId ?? position.loanHash ?? position.id,
    minimumRepayment: roundedDebt,
    fullRepayment: roundedDebt,
    suggestedOverpayment: roundedDebt,
    periodicPayment: null,
    paymentRemaining: null,
    nextPaymentDueDate: nextPaymentDueDate.toISOString(),
    isPastDue: false,
  };
}

function addMonths(base: Date, months: number): Date {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function validateAccountSecretMatchesAddress(
  accountSecret: string,
  expectedAddress: string
): { accountAddress?: string; error?: LendingServiceError } {
  try {
    const restored = restoreLocalAccount(accountSecret);
    if (restored.address !== expectedAddress) {
      return {
        error: createError('ACCOUNT_SECRET_MISMATCH', 'accountSecret does not match userAddress'),
      };
    }

    return { accountAddress: restored.address };
  } catch {
    return { error: createError('INVALID_ACCOUNT_SECRET', 'accountSecret is invalid') };
  }
}

async function setPositionDebtValues(params: {
  positionId: string;
  loanPrincipal: number;
  interestAccrued: number;
}): Promise<void> {
  await db
    .update(positions)
    .set({
      loanPrincipal: toTokenString(params.loanPrincipal),
      interestAccrued: toTokenString(params.interestAccrued),
      lastInterestUpdate: new Date(),
    })
    .where(eq(positions.id, params.positionId));
}

async function updateMarketTotals(params: {
  market: MarketRecord;
  totalSuppliedDelta?: number;
  totalBorrowedDelta?: number;
}): Promise<void> {
  const totalSupplied = new Decimal(params.market.total_supplied).add(params.totalSuppliedDelta ?? 0);
  const totalBorrowed = new Decimal(params.market.total_borrowed).add(params.totalBorrowedDelta ?? 0);

  await db
    .update(markets)
    .set({
      totalSupplied: Decimal.max(0, totalSupplied).toDecimalPlaces(TOKEN_SCALE, Decimal.ROUND_DOWN).toString(),
      totalBorrowed: Decimal.max(0, totalBorrowed).toDecimalPlaces(TOKEN_SCALE, Decimal.ROUND_DOWN).toString(),
      updatedAt: new Date(),
    })
    .where(eq(markets.id, params.market.id));
}

async function loadBorrowContext(
  userAddress: string,
  marketId: string,
  amount: number
): Promise<{
  market?: MarketRecord;
  position?: Position;
  error?: LendingServiceError;
}> {
  const market = await getMarketById(marketId);
  if (!market) {
    return { error: createError('MARKET_NOT_FOUND', 'Market not found or inactive') };
  }

  const prices = await getMarketPrices(marketId);
  if (!prices) {
    return { error: createError('PRICES_NOT_FOUND', 'Market prices not available') };
  }

  if (amount < market.min_borrow_amount) {
    return {
      error: createError('BELOW_MINIMUM', `Minimum borrow is ${market.min_borrow_amount} ${market.debt_currency}`),
    };
  }

  const rawPosition = await getPositionForUser(userAddress, marketId);
  if (!rawPosition) {
    return { error: createError('NO_POSITION', 'No active position found. Deposit collateral first.') };
  }

  const position = await accrueInterest(rawPosition);
  const currentDebt = calculateTotalDebt(position.loanPrincipal, position.interestAccrued);

  const canBorrow = validateBorrow(
    position.collateralAmount,
    prices.collateralPriceUsd,
    currentDebt,
    amount,
    prices.debtPriceUsd,
    market.max_ltv_ratio
  );

  if (!canBorrow) {
    return {
      error: createError('EXCEEDS_MAX_LTV', `Borrow would exceed maximum LTV of ${market.max_ltv_ratio * 100}%`),
    };
  }

  const availableLiquidity = await getAvailableLiquidity(marketId);
  if (amount > availableLiquidity) {
    return {
      error: createError(
        'INSUFFICIENT_POOL_LIQUIDITY',
        `Borrow amount exceeds pool liquidity (${availableLiquidity} ${market.debt_currency})`
      ),
    };
  }

  return { market, position };
}

export async function processDeposit(params: {
  senderAddress: string;
  marketId: string;
  amount: number;
  accountSecret: string;
  idempotencyKey?: string;
}): Promise<{ result?: DepositResult; error?: LendingServiceError }> {
  const { senderAddress, marketId, amount, accountSecret, idempotencyKey } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: createError('INVALID_AMOUNT', 'amount must be a positive number') };
  }

  const secretCheck = validateAccountSecretMatchesAddress(accountSecret, senderAddress);
  if (secretCheck.error) {
    return { error: secretCheck.error };
  }

  const market = await getMarketById(marketId);
  if (!market) {
    return { error: createError('MARKET_NOT_FOUND', 'Market not found or inactive') };
  }

  if (amount < market.min_collateral_amount) {
    return {
      error: createError(
        'BELOW_MINIMUM',
        `Minimum deposit is ${market.min_collateral_amount} ${market.collateral_currency}`
      ),
    };
  }

  const event = await emitAppEvent({
    eventType: LENDING_EVENTS.DEPOSIT_INITIATED,
    module: 'LENDING',
    status: 'PENDING',
    userAddress: senderAddress,
    marketId,
    idempotencyKey: idempotencyKey ?? null,
    amount,
    currency: market.collateral_currency,
    payload: { flow: 'solana' },
  });

  try {
    const operatorAccount = getOperatorAccount();
    const receipt = await transferAsset({
      sourceSecret: accountSecret,
      destinationAddress: operatorAccount.address,
      asset: buildTokenAsset(market.collateral_currency, market.collateral_issuer),
      amount: amount.toString(),
    });

    const position =
      (await getPositionForUser(senderAddress, marketId)) ??
      (await getOrCreatePosition(senderAddress, marketId, market.base_interest_rate));
    const updatedPosition = await addCollateral(position.id, amount);

    const onchainTx = await upsertOnchainTransaction({
      txId: receipt.txHash,
      validated: true,
      txType: 'ASSET_LOCK',
      sourceAddress: receipt.sourceAddress,
      destinationAddress: receipt.destinationAddress,
      currency: market.collateral_currency,
      issuer: market.collateral_issuer,
      amount,
      rawTxJson: buildSolanaRawTx({
        operation: 'COLLATERAL_LOCK',
        txHash: receipt.txHash,
        sourceAddress: receipt.sourceAddress,
        destinationAddress: receipt.destinationAddress,
        amount,
        symbol: market.collateral_currency,
        mintAddress: market.collateral_issuer,
      }),
      rawMetaJson: null,
    });

    await updateEventStatus(event.id, 'COMPLETED');
    await emitAppEvent({
      eventType: LENDING_EVENTS.DEPOSIT_CONFIRMED,
      module: 'LENDING',
      status: 'COMPLETED',
      userAddress: senderAddress,
      marketId,
      positionId: updatedPosition.id,
      onchainTxId: onchainTx.id,
      amount,
      currency: market.collateral_currency,
      payload: { txHash: receipt.txHash },
    });

    return {
      result: {
        positionId: updatedPosition.id,
        collateralAmount: amount,
        newCollateralTotal: updatedPosition.collateralAmount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to lock collateral';
    await updateEventStatus(event.id, 'FAILED', { code: 'DEPOSIT_FAILED', message });
    return { error: createError('DEPOSIT_FAILED', message) };
  }
}

export async function processBorrow(params: {
  userAddress: string;
  marketId: string;
  amount: number;
  accountSecret: string;
  idempotencyKey?: string;
}): Promise<{ result?: BorrowResult; error?: LendingServiceError }> {
  const { userAddress, marketId, amount, accountSecret, idempotencyKey } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: createError('INVALID_AMOUNT', 'amount must be a positive number') };
  }

  const secretCheck = validateAccountSecretMatchesAddress(accountSecret, userAddress);
  if (secretCheck.error) {
    return { error: secretCheck.error };
  }

  const loaded = await loadBorrowContext(userAddress, marketId, amount);
  if (loaded.error || !loaded.market || !loaded.position) {
    return { error: loaded.error ?? createError('INTERNAL_ERROR', 'Failed to load borrow context') };
  }

  const { market, position } = loaded;
  const event = await emitAppEvent({
    eventType: LENDING_EVENTS.BORROW_INITIATED,
    module: 'LENDING',
    status: 'PENDING',
    userAddress,
    marketId,
    idempotencyKey: idempotencyKey ?? null,
    amount,
    currency: market.debt_currency,
    payload: { flow: 'solana' },
  });

  try {
    await updateGlobalYieldIndex(marketId);

    const receipt = await transferAsset({
      sourceSecret: getTreasurySecret(),
      destinationAddress: userAddress,
      asset: buildTokenAsset(market.debt_currency, market.debt_issuer),
      amount: amount.toString(),
    });

    const nextPrincipal = toAmount(new Decimal(position.loanPrincipal).add(amount));
    await setPositionDebtValues({
      positionId: position.id,
      loanPrincipal: nextPrincipal,
      interestAccrued: position.interestAccrued,
    });
    await setPositionLoanMetadata(position.id, {
      loanId: position.loanId ?? `solana-loan:${position.id}`,
      loanHash: receipt.txHash,
      loanTermMonths: DEFAULT_LOAN_TERM_MONTHS,
      loanMaturityDate: addMonths(new Date(), DEFAULT_LOAN_TERM_MONTHS),
      loanOpenedAtSlot: null,
    });
    await setPositionStatus(position.id, 'ACTIVE');
    await updateMarketTotals({
      market,
      totalBorrowedDelta: amount,
    });

    const onchainTx = await upsertOnchainTransaction({
      txId: receipt.txHash,
      validated: true,
      txType: 'BORROW_DISBURSEMENT',
      sourceAddress: getTreasuryAddress(),
      destinationAddress: userAddress,
      currency: market.debt_currency,
      issuer: market.debt_issuer,
      amount,
      rawTxJson: buildSolanaRawTx({
        operation: 'BORROW_DISBURSEMENT',
        txHash: receipt.txHash,
        sourceAddress: getTreasuryAddress(),
        destinationAddress: userAddress,
        amount,
        symbol: market.debt_currency,
        mintAddress: market.debt_issuer,
      }),
      rawMetaJson: null,
    });

    const result: BorrowResult = {
      positionId: position.id,
      borrowedAmount: amount,
      newLoanPrincipal: nextPrincipal,
      txHash: receipt.txHash,
    };

    await updateEventStatus(event.id, 'COMPLETED');
    await emitAppEvent({
      eventType: LENDING_EVENTS.BORROW_COMPLETED,
      module: 'LENDING',
      status: 'COMPLETED',
      userAddress,
      marketId,
      positionId: position.id,
      onchainTxId: onchainTx.id,
      amount,
      currency: market.debt_currency,
      payload: { txHash: receipt.txHash },
    });

    return { result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Borrow failed';
    await updateEventStatus(event.id, 'FAILED', { code: 'BORROW_FAILED', message });
    return { error: createError('BORROW_FAILED', message) };
  }
}

export async function processRepay(params: {
  userAddress: string;
  marketId: string;
  amount: number;
  accountSecret: string;
  repayKind?: 'regular' | 'full' | 'overpayment' | 'late';
  idempotencyKey?: string;
}): Promise<{ result?: RepayResult; error?: LendingServiceError }> {
  const { userAddress, marketId, amount, accountSecret, idempotencyKey } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: createError('INVALID_AMOUNT', 'amount must be a positive number') };
  }

  const secretCheck = validateAccountSecretMatchesAddress(accountSecret, userAddress);
  if (secretCheck.error) {
    return { error: secretCheck.error };
  }

  const market = await getMarketById(marketId);
  if (!market) {
    return { error: createError('MARKET_NOT_FOUND', 'Market not found or inactive') };
  }

  const rawPosition = await getPositionForUser(userAddress, marketId);
  if (!rawPosition) {
    return { error: createError('NO_POSITION', 'No active position found') };
  }

  const position = await accrueInterest(rawPosition);
  const totalDebt = calculateTotalDebt(position.loanPrincipal, position.interestAccrued);
  const effectiveAmount = toAmount(Decimal.min(amount, totalDebt));

  const event = await emitAppEvent({
    eventType: LENDING_EVENTS.REPAY_INITIATED,
    module: 'LENDING',
    status: 'PENDING',
    userAddress,
    marketId,
    idempotencyKey: idempotencyKey ?? null,
    amount: effectiveAmount || amount,
    currency: market.debt_currency,
    payload: { flow: 'solana' },
  });

  try {
    if (effectiveAmount <= 0) {
      await updateEventStatus(event.id, 'COMPLETED');
      return {
        result: {
          positionId: position.id,
          amountRepaid: 0,
          interestPaid: 0,
          principalPaid: 0,
          remainingDebt: 0,
        },
      };
    }

    await updateGlobalYieldIndex(marketId);

    const receipt = await transferAsset({
      sourceSecret: accountSecret,
      destinationAddress: getTreasuryAddress(),
      asset: buildTokenAsset(market.debt_currency, market.debt_issuer),
      amount: effectiveAmount.toString(),
    });

    const allocation = allocateRepayment(effectiveAmount, position.interestAccrued, position.loanPrincipal);
    const nextInterest = toAmount(new Decimal(position.interestAccrued).sub(allocation.interestPaid));
    const nextPrincipal = toAmount(new Decimal(position.loanPrincipal).sub(allocation.principalPaid));

    if (nextPrincipal <= 0 && nextInterest <= 0) {
      await clearPositionLoanMetadata(position.id);
      await setPositionStatus(position.id, position.collateralAmount > 0 ? 'REPAID' : 'CLOSED');
    } else {
      await setPositionDebtValues({
        positionId: position.id,
        loanPrincipal: nextPrincipal,
        interestAccrued: nextInterest,
      });
      await setPositionStatus(position.id, 'ACTIVE');
    }

    await updateMarketTotals({
      market,
      totalBorrowedDelta: -allocation.principalPaid,
    });

    const onchainTx = await upsertOnchainTransaction({
      txId: receipt.txHash,
      validated: true,
      txType: 'REPAYMENT',
      sourceAddress: userAddress,
      destinationAddress: getTreasuryAddress(),
      currency: market.debt_currency,
      issuer: market.debt_issuer,
      amount: effectiveAmount,
      rawTxJson: buildSolanaRawTx({
        operation: 'REPAYMENT',
        txHash: receipt.txHash,
        sourceAddress: userAddress,
        destinationAddress: getTreasuryAddress(),
        amount: effectiveAmount,
        symbol: market.debt_currency,
        mintAddress: market.debt_issuer,
      }),
      rawMetaJson: null,
    });

    const remainingDebt = toAmount(new Decimal(nextPrincipal).add(nextInterest));
    const result: RepayResult = {
      positionId: position.id,
      amountRepaid: effectiveAmount,
      interestPaid: allocation.interestPaid,
      principalPaid: allocation.principalPaid,
      remainingDebt,
    };

    await updateEventStatus(event.id, 'COMPLETED');
    await emitAppEvent({
      eventType: LENDING_EVENTS.REPAY_CONFIRMED,
      module: 'LENDING',
      status: 'COMPLETED',
      userAddress,
      marketId,
      positionId: position.id,
      onchainTxId: onchainTx.id,
      amount: effectiveAmount,
      currency: market.debt_currency,
      payload: { txHash: receipt.txHash, interestPaid: allocation.interestPaid, principalPaid: allocation.principalPaid },
    });

    return { result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Repay failed';
    await updateEventStatus(event.id, 'FAILED', { code: 'REPAY_FAILED', message });
    return { error: createError('REPAY_FAILED', message) };
  }
}

export async function processWithdraw(params: {
  userAddress: string;
  marketId: string;
  amount: number;
  accountSecret: string;
  idempotencyKey?: string;
}): Promise<{ result?: WithdrawResult; error?: LendingServiceError }> {
  const { userAddress, marketId, amount, accountSecret, idempotencyKey } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: createError('INVALID_AMOUNT', 'amount must be a positive number') };
  }

  const secretCheck = validateAccountSecretMatchesAddress(accountSecret, userAddress);
  if (secretCheck.error) {
    return { error: secretCheck.error };
  }

  const market = await getMarketById(marketId);
  if (!market) {
    return { error: createError('MARKET_NOT_FOUND', 'Market not found or inactive') };
  }

  const rawPosition = await getPositionForUser(userAddress, marketId);
  if (!rawPosition) {
    return { error: createError('NO_POSITION', 'No active position found') };
  }

  const position = await accrueInterest(rawPosition);
  const totalDebt = calculateTotalDebt(position.loanPrincipal, position.interestAccrued);
  if (totalDebt > 0) {
    return {
      error: createError('DEBT_OUTSTANDING', 'Repay all debt before withdrawing collateral'),
    };
  }

  if (amount > position.collateralAmount) {
    return {
      error: createError(
        'INSUFFICIENT_COLLATERAL',
        `Requested amount exceeds available collateral (${position.collateralAmount})`
      ),
    };
  }

  const event = await emitAppEvent({
    eventType: LENDING_EVENTS.WITHDRAW_INITIATED,
    module: 'LENDING',
    status: 'PENDING',
    userAddress,
    marketId,
    idempotencyKey: idempotencyKey ?? null,
    amount,
    currency: market.collateral_currency,
    payload: { flow: 'solana' },
  });

  try {
    const operatorAccount = getOperatorAccount();
    await ensureOperatorHasFeeBalance(operatorAccount.address);
    const receipt = await transferAsset({
      sourceSecret: operatorAccount.secret,
      destinationAddress: userAddress,
      asset: buildTokenAsset(market.collateral_currency, market.collateral_issuer),
      amount: amount.toString(),
    });

    const updatedPosition = await removeCollateral(position.id, amount);
    if (updatedPosition.collateralAmount <= 0 && updatedPosition.loanPrincipal <= 0 && updatedPosition.interestAccrued <= 0) {
      await closePosition(position.id);
    }

    const onchainTx = await upsertOnchainTransaction({
      txId: receipt.txHash,
      validated: true,
      txType: 'COLLATERAL_RELEASE',
      sourceAddress: operatorAccount.address,
      destinationAddress: userAddress,
      currency: market.collateral_currency,
      issuer: market.collateral_issuer,
      amount,
      rawTxJson: buildSolanaRawTx({
        operation: 'COLLATERAL_RELEASE',
        txHash: receipt.txHash,
        sourceAddress: operatorAccount.address,
        destinationAddress: userAddress,
        amount,
        symbol: market.collateral_currency,
        mintAddress: market.collateral_issuer,
      }),
      rawMetaJson: null,
    });

    const result: WithdrawResult = {
      positionId: position.id,
      withdrawnAmount: amount,
      remainingCollateral: updatedPosition.collateralAmount,
      txHash: receipt.txHash,
    };

    await updateEventStatus(event.id, 'COMPLETED');
    await emitAppEvent({
      eventType: LENDING_EVENTS.WITHDRAW_COMPLETED,
      module: 'LENDING',
      status: 'COMPLETED',
      userAddress,
      marketId,
      positionId: position.id,
      onchainTxId: onchainTx.id,
      amount,
      currency: market.collateral_currency,
      payload: { txHash: receipt.txHash },
    });

    return { result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Withdraw failed';
    await updateEventStatus(event.id, 'FAILED', { code: 'WITHDRAW_FAILED', message });
    return { error: createError('WITHDRAW_FAILED', message) };
  }
}

export async function processSupply(params: {
  senderAddress: string;
  marketId: string;
  amount: number;
  accountSecret: string;
  idempotencyKey?: string;
}): Promise<{ result?: SupplyResult; error?: LendingServiceError }> {
  const { senderAddress, marketId, amount, accountSecret, idempotencyKey } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: createError('INVALID_AMOUNT', 'amount must be a positive number') };
  }

  const secretCheck = validateAccountSecretMatchesAddress(accountSecret, senderAddress);
  if (secretCheck.error) {
    return { error: secretCheck.error };
  }

  const market = await getMarketById(marketId);
  if (!market) {
    return { error: createError('MARKET_NOT_FOUND', 'Market not found or inactive') };
  }

  if (amount < market.min_supply_amount) {
    return {
      error: createError('BELOW_MINIMUM', `Minimum supply is ${market.min_supply_amount} ${market.debt_currency}`),
    };
  }

  const event = await emitAppEvent({
    eventType: LENDING_EVENTS.SUPPLY_INITIATED,
    module: 'LENDING',
    status: 'PENDING',
    userAddress: senderAddress,
    marketId,
    idempotencyKey: idempotencyKey ?? null,
    amount,
    currency: market.debt_currency,
    payload: { flow: 'solana' },
  });

  try {
    await updateGlobalYieldIndex(marketId);

    const receipt = await transferAsset({
      sourceSecret: accountSecret,
      destinationAddress: getTreasuryAddress(),
      asset: buildTokenAsset(market.debt_currency, market.debt_issuer),
      amount: amount.toString(),
    });

    const supplyPosition = await getOrCreateSupplyPosition(
      senderAddress,
      marketId,
      market.global_yield_index
    );
    const updatedPosition = await addSupply(supplyPosition.id, amount, market.global_yield_index);
    await updateMarketTotals({
      market,
      totalSuppliedDelta: amount,
    });

    const onchainTx = await upsertOnchainTransaction({
      txId: receipt.txHash,
      validated: true,
      txType: 'SUPPLY_DEPOSIT',
      sourceAddress: senderAddress,
      destinationAddress: getTreasuryAddress(),
      currency: market.debt_currency,
      issuer: market.debt_issuer,
      amount,
      rawTxJson: buildSolanaRawTx({
        operation: 'SUPPLY_DEPOSIT',
        txHash: receipt.txHash,
        sourceAddress: senderAddress,
        destinationAddress: getTreasuryAddress(),
        amount,
        symbol: market.debt_currency,
        mintAddress: market.debt_issuer,
      }),
      rawMetaJson: null,
    });

    await updateEventStatus(event.id, 'COMPLETED');
    await emitAppEvent({
      eventType: LENDING_EVENTS.SUPPLY_CONFIRMED,
      module: 'LENDING',
      status: 'COMPLETED',
      userAddress: senderAddress,
      marketId,
      onchainTxId: onchainTx.id,
      amount,
      currency: market.debt_currency,
      payload: {
        txHash: receipt.txHash,
        supplyPositionId: updatedPosition.id,
      },
    });

    return {
      result: {
        marketId,
        supplyPositionId: updatedPosition.id,
        suppliedAmount: amount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supply failed';
    await updateEventStatus(event.id, 'FAILED', { code: 'SUPPLY_FAILED', message });
    return { error: createError('SUPPLY_FAILED', message) };
  }
}

export async function processWithdrawSupply(params: {
  userAddress: string;
  marketId: string;
  amount: number;
  accountSecret: string;
  idempotencyKey?: string;
}): Promise<{ result?: WithdrawSupplyResult; error?: LendingServiceError }> {
  const { userAddress, marketId, amount, accountSecret, idempotencyKey } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: createError('INVALID_AMOUNT', 'Amount must be a positive number') };
  }

  const secretCheck = validateAccountSecretMatchesAddress(accountSecret, userAddress);
  if (secretCheck.error) {
    return { error: secretCheck.error };
  }

  const market = await getMarketById(marketId);
  if (!market) {
    return { error: createError('MARKET_NOT_FOUND', 'Market not found or inactive') };
  }

  const position = await getSupplyPositionForUser(userAddress, marketId);
  if (!position) {
    return { error: createError('NO_SUPPLY_POSITION', 'No active supply position found') };
  }

  if (amount > position.supplyAmount) {
    return {
      error: createError(
        'INSUFFICIENT_SUPPLY_BALANCE',
        `Requested amount exceeds supplied balance (${position.supplyAmount})`
      ),
    };
  }

  const availableLiquidity = await getAvailableLiquidity(marketId);
  if (amount > availableLiquidity) {
    return {
      error: createError(
        'INSUFFICIENT_POOL_LIQUIDITY',
        `Withdraw amount exceeds pool liquidity (${availableLiquidity} ${market.debt_currency})`
      ),
    };
  }

  const event = await emitAppEvent({
    eventType: LENDING_EVENTS.WITHDRAW_SUPPLY_INITIATED,
    module: 'LENDING',
    status: 'PENDING',
    userAddress,
    marketId,
    idempotencyKey: idempotencyKey ?? null,
    amount,
    currency: market.debt_currency,
    payload: { flow: 'solana' },
  });

  try {
    await updateGlobalYieldIndex(marketId);

    const receipt = await transferAsset({
      sourceSecret: getTreasurySecret(),
      destinationAddress: userAddress,
      asset: buildTokenAsset(market.debt_currency, market.debt_issuer),
      amount: amount.toString(),
    });

    const updatedPosition = await removeSupply(position.id, amount, market.global_yield_index);
    await updateMarketTotals({
      market,
      totalSuppliedDelta: -amount,
    });

    const onchainTx = await upsertOnchainTransaction({
      txId: receipt.txHash,
      validated: true,
      txType: 'SUPPLY_WITHDRAWAL',
      sourceAddress: getTreasuryAddress(),
      destinationAddress: userAddress,
      currency: market.debt_currency,
      issuer: market.debt_issuer,
      amount,
      rawTxJson: buildSolanaRawTx({
        operation: 'SUPPLY_WITHDRAWAL',
        txHash: receipt.txHash,
        sourceAddress: getTreasuryAddress(),
        destinationAddress: userAddress,
        amount,
        symbol: market.debt_currency,
        mintAddress: market.debt_issuer,
      }),
      rawMetaJson: null,
    });

    const result: WithdrawSupplyResult = {
      marketId,
      supplyPositionId: updatedPosition.id,
      withdrawnAmount: amount,
      remainingSupply: updatedPosition.supplyAmount,
      txHash: receipt.txHash,
    };

    await updateEventStatus(event.id, 'COMPLETED');
    await emitAppEvent({
      eventType: LENDING_EVENTS.WITHDRAW_SUPPLY_COMPLETED,
      module: 'LENDING',
      status: 'COMPLETED',
      userAddress,
      marketId,
      onchainTxId: onchainTx.id,
      amount,
      currency: market.debt_currency,
      payload: {
        txHash: receipt.txHash,
        supplyPositionId: updatedPosition.id,
      },
    });

    return { result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Withdraw failed';
    await updateEventStatus(event.id, 'FAILED', { code: 'WITHDRAW_SUPPLY_FAILED', message });
    return { error: createError('WITHDRAW_SUPPLY_FAILED', message) };
  }
}

export async function getPositionWithMetrics(
  userAddress: string,
  marketId: string
): Promise<{ position: Position; metrics: PositionMetrics; market: Market; loan: LoanRepaymentOverview | null } | null> {
  const [market, rawPosition] = await Promise.all([getMarketById(marketId), getPositionForUser(userAddress, marketId)]);

  if (!market || !rawPosition) {
    return null;
  }

  const [prices, pool] = await Promise.all([getMarketPrices(marketId), getPoolMetrics(marketId)]);
  if (!prices || !pool) {
    return null;
  }

  const position = await accrueInterest(rawPosition);
  const marketData = mapMarketRecordToDomain(market);
  const metrics = calculatePositionMetrics(position, marketData, prices.collateralPriceUsd, prices.debtPriceUsd);
  const totalDebt = calculateTotalDebt(position.loanPrincipal, position.interestAccrued);

  return {
    position,
    metrics: {
      ...metrics,
      maxBorrowableAmount: Math.min(metrics.maxBorrowableAmount, pool.availableLiquidity),
      availableLiquidity: pool.availableLiquidity,
    },
    market: marketData,
    loan: buildLoanRepaymentOverview(position, totalDebt),
  };
}

export async function processCollectYield(
  userAddress: string,
  marketId: string,
  _idempotencyKey?: string
): Promise<{ result?: CollectYieldResult; error?: LendingServiceError }> {
  const position = await getSupplyPositionForUser(userAddress, marketId);
  if (!position) {
    return { error: createError('NO_SUPPLY_POSITION', 'No active supply position found') };
  }

  return {
    result: {
      marketId,
      supplyPositionId: position.id,
      collectedAmount: 0,
      txHash: null,
    },
  };
}

export async function getSupplyPositionWithMetrics(
  userAddress: string,
  marketId: string
): Promise<{
  position: Awaited<ReturnType<typeof getSupplyPositionForUser>> extends infer T
    ? T extends null
      ? never
      : NonNullable<T>
    : never;
  metrics: SupplyPositionMetrics;
  pool: NonNullable<Awaited<ReturnType<typeof getPoolMetrics>>>;
  market: Market;
} | null> {
  const [market, pool, position] = await Promise.all([
    getMarketById(marketId),
    getPoolMetrics(marketId),
    getSupplyPositionForUser(userAddress, marketId),
  ]);

  if (!market || !pool || !position) {
    return null;
  }

  return {
    position,
    metrics: {
      accruedYield: 0,
      withdrawableAmount: Math.min(position.supplyAmount, pool.availableLiquidity),
      availableLiquidity: pool.availableLiquidity,
      utilizationRate: pool.utilizationRate,
      supplyApr: pool.supplyApr,
      supplyApy: pool.supplyApy,
    },
    pool,
    market: mapMarketRecordToDomain(market),
  };
}
