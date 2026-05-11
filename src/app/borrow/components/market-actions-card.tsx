import type { Dispatch, SetStateAction } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownLeft, ArrowUpRight, Loader2, Repeat2 } from 'lucide-react';

import { getAssetSymbol } from '@/lib/assets/asset-symbols';

import type { LoanRepaymentOverview, Market, PositionMetrics, RepayKind } from '../types';
import { buildAmortizationSchedule } from './utils/amortization';

interface MarketActionsCardProps {
  market: Market;
  walletConnected: boolean;
  loading: string;
  actionTab: string;
  onActionTabChange: (value: string) => void;
  collateralAssetReady: boolean;
  debtAssetReady: boolean;
  poolLoading: boolean;
  metrics: PositionMetrics | null;
  loanRepayment: LoanRepaymentOverview | null;
  repayBufferRate: number;
  depositAmount: string;
  setDepositAmount: Dispatch<SetStateAction<string>>;
  borrowAmount: string;
  setBorrowAmount: Dispatch<SetStateAction<string>>;
  repayAmount: string;
  setRepayAmount: Dispatch<SetStateAction<string>>;
  repayKind: RepayKind;
  withdrawAmount: string;
  setWithdrawAmount: Dispatch<SetStateAction<string>>;
  reinvestTokenAmount: string;
  setReinvestTokenAmount: Dispatch<SetStateAction<string>>;
  reinvestTokenPrice: number;
  reinvestTotalPrice: number;
  reinvestTargetName: string;
  reinvestYieldPercentage: number;
  onDeposit: () => Promise<void>;
  onBorrow: () => Promise<void>;
  onRepay: () => Promise<void>;
  onWithdraw: () => Promise<void>;
  onReinvest: () => Promise<void>;
  onApplyRepayPreset: (kind: RepayKind) => void;
}

export function MarketActionsCard({
  market,
  walletConnected,
  loading,
  actionTab,
  onActionTabChange,
  collateralAssetReady,
  debtAssetReady,
  poolLoading,
  metrics,
  loanRepayment,
  repayBufferRate,
  depositAmount,
  setDepositAmount,
  borrowAmount,
  setBorrowAmount,
  repayAmount,
  setRepayAmount,
  repayKind,
  withdrawAmount,
  setWithdrawAmount,
  reinvestTokenAmount,
  setReinvestTokenAmount,
  reinvestTokenPrice,
  reinvestTotalPrice,
  reinvestTargetName,
  reinvestYieldPercentage,
  onDeposit,
  onBorrow,
  onRepay,
  onWithdraw,
  onReinvest,
  onApplyRepayPreset,
}: MarketActionsCardProps) {
  const resolvedLiquidity = metrics?.availableLiquidity ?? market.totalSupplied ?? 0;
  const poolSize = Number.isFinite(resolvedLiquidity) ? resolvedLiquidity : 0;
  const debtSymbol = getAssetSymbol(market.debtCurrency);
  const collateralSymbol = getAssetSymbol(market.collateralCurrency);
  const parsedDepositAmount = Number(depositAmount);
  const safeDepositAmount = Number.isFinite(parsedDepositAmount) && parsedDepositAmount > 0 ? parsedDepositAmount : 0;
  const parsedBorrowAmount = Number(borrowAmount);
  const safeBorrowAmount = Number.isFinite(parsedBorrowAmount) && parsedBorrowAmount > 0 ? parsedBorrowAmount : 0;
  const parsedReinvestTokenAmount = Number(reinvestTokenAmount);
  const safeReinvestTokenAmount =
    Number.isFinite(parsedReinvestTokenAmount) && parsedReinvestTokenAmount > 0 ? parsedReinvestTokenAmount : 0;
  const reinvestSpread = Math.max(0, reinvestYieldPercentage - market.baseInterestRate * 100);

  const depositBasedBorrowCapacity = (() => {
    if (safeDepositAmount <= 0) return 0;

    if (market.prices && market.prices.collateralPriceUsd > 0 && market.prices.debtPriceUsd > 0) {
      const collateralValueUsd = safeDepositAmount * market.prices.collateralPriceUsd;
      return (collateralValueUsd * market.maxLtvRatio) / market.prices.debtPriceUsd;
    }

    return safeDepositAmount * market.maxLtvRatio;
  })();

  const projectedRepayment = buildAmortizationSchedule({
    principal: safeBorrowAmount,
    apr: market.baseInterestRate,
    periods: market.loanTermMonths,
  });

  return (
    <Card className="rounded-none border-border bg-card">
      <CardContent className="min-h-60 p-0">
        <div className="flex flex-col lg:flex-row justify-between">
          <section className="flex-1 space-y-4 p-6 lg:p-10">
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-2xl font-light">Market</h2>
              <Badge variant="outline" className="rounded-none border-primary/40 text-primary">
                {(market.baseInterestRate * 100).toFixed(2)}% APR
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Collateral</p>
                <p className="mt-1 font-semibold">{getAssetSymbol(market.collateralCurrency)}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Debt</p>
                <p className="mt-1 font-semibold">{getAssetSymbol(market.debtCurrency)}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Max LTV</p>
                <p className="mt-1 font-semibold">{(market.maxLtvRatio * 100).toFixed(0)}%</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Liquidation LTV</p>
                <p className="mt-1 font-semibold">{(market.liquidationLtvRatio * 100).toFixed(0)}%</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Liquidity Pool</p>
                {poolLoading ? (
                  <Skeleton className="mt-1 h-5 w-28" />
                ) : (
                  <p className="mt-1 font-semibold">
                    {poolSize.toFixed(2)} {debtSymbol}
                  </p>
                )}
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Loan Period</p>
                <p className="mt-1 font-semibold">{market.loanTermMonths} months</p>
              </div>
            </div>
          </section>

          <div className="h-px bg-border lg:hidden" />
          <div className="hidden w-px self-stretch bg-border lg:block" />

          <section className="flex-1 p-6 lg:p-10">
            <h2 className="mb-5 font-serif text-2xl font-light">Borrower Actions</h2>

            {!walletConnected ? (
              <p className="text-sm text-muted-foreground">Generate or connect a wallet from the admin flow to enable actions.</p>
            ) : (
              <Tabs value={actionTab} onValueChange={onActionTabChange}>
                <TabsList className="mb-5 grid h-auto w-full grid-cols-2 gap-px rounded-none bg-border p-0 sm:grid-cols-5">
                  <TabsTrigger className="rounded-none bg-background py-3 text-[8px] uppercase tracking-[0.18em] data-[state=active]:bg-card data-[state=active]:text-foreground" value="deposit">Deposit</TabsTrigger>
                  <TabsTrigger className="rounded-none bg-background py-3 text-[8px] uppercase tracking-[0.18em] data-[state=active]:bg-card data-[state=active]:text-foreground" value="borrow">Borrow</TabsTrigger>
                  <TabsTrigger className="rounded-none bg-background py-3 text-[8px] uppercase tracking-[0.18em] data-[state=active]:bg-card data-[state=active]:text-foreground" value="reinvest">Reinvest</TabsTrigger>
                  <TabsTrigger className="rounded-none bg-background py-3 text-[8px] uppercase tracking-[0.18em] data-[state=active]:bg-card data-[state=active]:text-foreground" value="repay">Repay</TabsTrigger>
                  <TabsTrigger className="rounded-none bg-background py-3 text-[8px] uppercase tracking-[0.18em] data-[state=active]:bg-card data-[state=active]:text-foreground" value="withdraw">Withdraw</TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="space-y-3">
                  {!market.collateralLockEnabled && (
                    <p className="text-xs text-muted-foreground">
                      Deposit disabled: collateral locking is not enabled for this market.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Estimated max borrow from this deposit: 
                    <span className="text-primary"> {depositBasedBorrowCapacity.toFixed(0)} {debtSymbol}</span>
                    <span className="ml-1 text-muted-foreground ">
                      ({safeDepositAmount.toFixed(0)} {collateralSymbol} x {(market.maxLtvRatio * 100).toFixed(0)}% max LTV)
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(event) => setDepositAmount(event.target.value)}
                      className="w-40 border border-border bg-background px-3 py-2 text-sm text-foreground"
                      data-testid="borrow-deposit-amount"
                    />
                    <span className="text-sm text-muted-foreground">{getAssetSymbol(market.collateralCurrency)}</span>
                    <Button
                      onClick={() => {
                        void onDeposit();
                      }}
                      disabled={loading === 'deposit' || !collateralAssetReady || !market.collateralLockEnabled}
                      data-testid="borrow-deposit-submit"
                    >
                      {loading === 'deposit' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                      )}
                      Deposit
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="borrow" className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Max borrowable now: {(metrics?.maxBorrowableAmount ?? 0).toFixed(4)} {getAssetSymbol(market.debtCurrency)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      value={borrowAmount}
                      onChange={(event) => setBorrowAmount(event.target.value)}
                      className="w-40 border border-border bg-background px-3 py-2 text-sm text-foreground"
                      data-testid="borrow-amount"
                    />
                    <span className="text-sm text-muted-foreground">{getAssetSymbol(market.debtCurrency)}</span>
                    <Button
                      onClick={() => {
                        void onBorrow();
                      }}
                      disabled={
                        loading === 'borrow' ||
                        !debtAssetReady ||
                        (metrics ? Number(borrowAmount) > metrics.maxBorrowableAmount : false)
                      }
                      data-testid="borrow-submit"
                    >
                      {loading === 'borrow' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                      )}
                      Borrow
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex flex-col">
                    <span className="text-primary">Interest rate: {(market.baseInterestRate * 100).toFixed(2)}% APR</span>
                    <span>Loan period: {market.loanTermMonths} months </span>
                    <span>Estimated total repayment: {projectedRepayment.totalRepayment.toFixed(4)} {debtSymbol} </span>
                  </p>
                </TabsContent>

                <TabsContent value="reinvest" className="space-y-3">
                  <div className="border border-border bg-muted/40 p-6">
                    <div className="mb-4 text-[7px] uppercase tracking-[0.28em] text-muted-foreground">
                      Reinvest your USDC
                    </div>
                    <div className="font-serif text-xl font-light text-foreground">
                      Earn <span className="text-primary">{reinvestYieldPercentage.toFixed(1)}%</span> on your borrowed USDC
                    </div>
                    <p className="mt-3 text-[11px] leading-7 tracking-[0.04em] text-muted-foreground">
                      You borrowed at {(market.baseInterestRate * 100).toFixed(1)}% APR. Reinvest in {reinvestTargetName} and aim for a{' '}
                      <span className="text-primary">+{reinvestSpread.toFixed(1)}%</span> net spread without selling the original holding.
                    </p>
                    <div className="mt-5 grid gap-px bg-border text-xs sm:grid-cols-3">
                      <div className="bg-card p-3">
                        <p className="text-[7.5px] uppercase tracking-[0.2em] text-muted-foreground">Token Price</p>
                        <p className="mt-2 font-serif text-lg font-light text-foreground">
                          {reinvestTokenPrice.toFixed(2)} {debtSymbol}
                        </p>
                      </div>
                      <div className="bg-card p-3">
                        <p className="text-[7.5px] uppercase tracking-[0.2em] text-muted-foreground">Order Total</p>
                        <p className="mt-2 font-serif text-lg font-light text-foreground">
                          {reinvestTotalPrice.toFixed(2)} {debtSymbol}
                        </p>
                      </div>
                      <div className="bg-card p-3">
                        <p className="text-[7.5px] uppercase tracking-[0.2em] text-muted-foreground">Net Spread</p>
                        <p className="mt-2 font-serif text-lg font-light text-primary">
                          +{reinvestSpread.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reinvestTokenAmount}
                      onChange={(event) => setReinvestTokenAmount(event.target.value)}
                      className="min-h-12 w-full border border-border bg-background px-4 py-2 text-center font-serif text-xl font-light text-foreground sm:w-40"
                      data-testid="borrow-reinvest-token-amount"
                    />
                    <Button
                      className="min-h-12 flex-1 rounded-none text-[8.5px] uppercase tracking-[0.24em]"
                      onClick={() => {
                        void onReinvest();
                      }}
                      disabled={loading === 'reinvest' || !debtAssetReady || safeReinvestTokenAmount <= 0}
                      data-testid="borrow-reinvest-submit"
                    >
                      {loading === 'reinvest' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Repeat2 className="mr-2 h-4 w-4" />
                      )}
                      Reinvest
                    </Button>
                  </div>
                  <p className="text-[9px] tracking-[0.08em] text-muted-foreground">
                    Amount is in {collateralSymbol}; payment is settled from available {debtSymbol}.
                  </p>
                </TabsContent>

                <TabsContent value="repay" className="space-y-3">
                  <div className="border border-border bg-card p-3 text-xs">
                    {loanRepayment ? (
                      <>
                        <p className="text-foreground">
                          Minimum payment:{' '}
                          <span className="font-semibold">
                            {(loanRepayment.minimumRepayment ?? 0).toFixed(6)} {getAssetSymbol(market.debtCurrency)}
                          </span>
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Next due:{' '}
                          {loanRepayment.nextPaymentDueDate
                            ? new Date(loanRepayment.nextPaymentDueDate).toLocaleString()
                            : 'N/A'}
                          {loanRepayment.isPastDue ? ' (late)' : ''}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Payments remaining: {loanRepayment.paymentRemaining ?? 'N/A'}
                        </p>
                      </>
                    ) : (
                      <p className="text-foreground">No active on-chain loan found for this market.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={repayKind === 'regular' ? 'default' : 'outline'}
                      onClick={() => onApplyRepayPreset('regular')}
                      disabled={!loanRepayment}
                      data-testid="borrow-repay-preset-regular"
                    >
                      Regular
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={repayKind === 'full' ? 'default' : 'outline'}
                      onClick={() => onApplyRepayPreset('full')}
                      disabled={!loanRepayment}
                      data-testid="borrow-repay-preset-full"
                    >
                      Full Early
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(event) => setRepayAmount(event.target.value)}
                      className="w-40 border border-border bg-background px-3 py-2 text-sm text-foreground"
                      data-testid="borrow-repay-amount"
                    />
                    <span className="text-sm text-muted-foreground">{getAssetSymbol(market.debtCurrency)}</span>
                    <Button
                      onClick={() => {
                        void onRepay();
                      }}
                      disabled={loading === 'repay' || !debtAssetReady || !loanRepayment}
                      data-testid="borrow-repay-submit"
                    >
                      {loading === 'repay' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                      )}
                      Repay
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(event) => setWithdrawAmount(event.target.value)}
                      className="w-40 border border-border bg-background px-3 py-2 text-sm text-foreground"
                      data-testid="borrow-withdraw-amount"
                    />
                    <span className="text-sm text-muted-foreground">{getAssetSymbol(market.collateralCurrency)}</span>
                    <Button
                      onClick={() => {
                        void onWithdraw();
                      }}
                      disabled={loading === 'withdraw' || !collateralAssetReady}
                      variant="outline"
                      data-testid="borrow-withdraw-submit"
                    >
                      {loading === 'withdraw' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                      )}
                      Withdraw
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
