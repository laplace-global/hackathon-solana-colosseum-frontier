import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp } from 'lucide-react';

import { getAssetSymbol } from '@/lib/assets/asset-symbols';

import type { MarketConfig, PoolMetrics, SupplyPosition, SupplyPositionMetrics } from '../types';

interface LendMarketActionsCardProps {
  market: MarketConfig;
  pool: PoolMetrics | null;
  position: SupplyPosition | null;
  positionMetrics: SupplyPositionMetrics | null;
  isLoading: boolean;
  walletReady: boolean;
  walletReadyChecked: boolean;
  loadingAction: string;
  supplyAmount: string;
  setSupplyAmount: Dispatch<SetStateAction<string>>;
  withdrawAmount: string;
  setWithdrawAmount: Dispatch<SetStateAction<string>>;
  formatAmount: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
  onSupply: () => Promise<void>;
  onWithdrawSupply: () => Promise<void>;
  onWithdrawAll: () => Promise<void>;
}

export function LendMarketActionsCard({
  market,
  pool,
  position,
  positionMetrics,
  isLoading,
  walletReady,
  walletReadyChecked,
  loadingAction,
  supplyAmount,
  setSupplyAmount,
  withdrawAmount,
  setWithdrawAmount,
  formatAmount,
  formatPercent,
  onSupply,
  onWithdrawSupply,
  onWithdrawAll,
}: LendMarketActionsCardProps) {
  const debtSymbol = getAssetSymbol(market.debtCurrency);

  return (
    <Card className="rounded-none border-border bg-card">
      <CardContent className="min-h-60 px-6">
        <div className="flex flex-col lg:flex-row">
          <section className="min-w-0 flex-1 space-y-4 py-2 lg:basis-1/2">
            <h2 className="text-lg font-semibold text-foreground">Pool Overview</h2>

            {isLoading ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Skeleton tone="light" className="h-20 rounded-xl" />
                  <Skeleton tone="light" className="h-20 rounded-xl" />
                  <Skeleton tone="light" className="h-20 rounded-xl" />
                </div>
                <div className="flex justify-between">
                  <Skeleton tone="light" className="h-4 w-10" />
                  <Skeleton tone="light" className="h-4 w-10" />
                </div>
                <Skeleton tone="light" className="h-2 w-full rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton tone="light" className="h-12 w-full rounded" />
                  <Skeleton tone="light" className="h-12 w-full rounded" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div className="border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Total Supplied</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatAmount(pool?.totalSupplied ?? 0, 2)} {debtSymbol}
                    </p>
                    <div className="my-2 h-px bg-border" />
                    <p className="text-xs text-muted-foreground">{formatAmount(pool?.totalShares ?? 0, 2)} total shares</p>
                  </div>
                  <div className="border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Total Borrowed</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatAmount(pool?.totalBorrowed ?? 0, 2)} {debtSymbol}
                    </p>
                    <div className="my-2 h-px bg-border" />
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(pool?.totalCollateralLocked ?? 0, 2)} {getAssetSymbol(market.collateralCurrency)} collateralized on-chain
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-medium text-foreground">{formatPercent(pool?.utilizationRate ?? 0)}</span>
                  </div>
                  <Progress
                    value={(pool?.utilizationRate ?? 0) * 100}
                    className="h-2 bg-card [&>[data-slot=progress-indicator]]:bg-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Supply APY</p>
                    <p className="mt-1 font-semibold text-primary">
                      {formatPercent(pool?.borrowApr ?? market.baseInterestRate ?? 0)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>

          <div className="my-6 h-px bg-border lg:my-0 lg:mx-8 lg:hidden" />
          <div className="mx-8 hidden w-px self-stretch bg-border lg:block" />

          <section className="min-w-0 flex-1 lg:basis-1/2">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Supply Actions</h2>

            <Tabs defaultValue="supply" className="w-full">
              <TabsList className="mb-6 !bg-card">
                <TabsTrigger value="supply" className="!text-muted-foreground data-[state=active]:!bg-background data-[state=active]:!text-foreground">
                  Supply
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="!text-muted-foreground data-[state=active]:!bg-background data-[state=active]:!text-foreground">
                  Withdraw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="supply" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Minimum supply is {market.minSupplyAmount} {debtSymbol}.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={supplyAmount}
                    onChange={(event) => setSupplyAmount(event.target.value)}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground sm:w-64"
                    data-testid="lend-supply-amount"
                  />
                  <Button
                    onClick={() => {
                      void onSupply();
                    }}
                    disabled={!walletReadyChecked || !walletReady || loadingAction === 'supply'}
                    className="sm:w-auto"
                    data-testid="lend-supply-submit"
                  >
                    {loadingAction === 'supply' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="mr-2 h-4 w-4" />
                    )}
                    Supply to Pool
                  </Button>
                </div>
                {walletReadyChecked && !walletReady && (
                  <p className="text-xs text-muted-foreground">You do not have any {debtSymbol} token to lend.</p>
                )}
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Withdraw from your supplied balance while respecting pool liquidity constraints.
                </p>
                <div className="grid grid-cols-2 gap-4 border border-border bg-card p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Withdrawable</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatAmount(positionMetrics?.withdrawableAmount ?? 0, 4)} {debtSymbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pool Liquidity</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatAmount(positionMetrics?.availableLiquidity ?? pool?.availableLiquidity ?? 0, 4)} {debtSymbol}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground sm:w-40"
                    data-testid="lend-withdraw-amount"
                  />
                  <Button
                    onClick={() => {
                      void onWithdrawSupply();
                    }}
                    disabled={!walletReadyChecked || !walletReady || loadingAction === 'withdraw-supply'}
                    variant="outline"
                    className="border-border bg-background text-foreground hover:bg-card"
                    data-testid="lend-withdraw-submit"
                  >
                    {loadingAction === 'withdraw-supply' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Withdraw
                  </Button>
                  <Button
                    onClick={() => {
                      void onWithdrawAll();
                    }}
                    disabled={
                      !walletReadyChecked || !walletReady || !position || position.supplyAmount <= 0 || loadingAction === 'withdraw-all'
                    }
                    variant="outline"
                    className="border-destructive/40 bg-background text-destructive hover:bg-destructive/10"
                    data-testid="lend-withdraw-all"
                  >
                    {loadingAction === 'withdraw-all' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Withdraw Full
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Full position withdraw exits your supplied balance in one request.
                </p>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
