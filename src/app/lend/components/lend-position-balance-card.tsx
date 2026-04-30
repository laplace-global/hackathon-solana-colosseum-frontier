import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import { getAssetSymbol } from '@/lib/assets/asset-symbols';

import type { MarketConfig, SupplyPosition, SupplyPositionMetrics } from '../types';

interface LendPositionBalanceCardProps {
  market: MarketConfig;
  position: SupplyPosition | null;
  positionMetrics: SupplyPositionMetrics | null;
  totalSupplied: number;
  walletBalance: number;
  shareBalance: string;
  isLoading: boolean;
  walletReady: boolean;
  walletReadyChecked: boolean;
  formatAmount: (value: number, decimals?: number) => string;
  normalizeShares: (rawShares: string, scale: number) => number;
}

export function LendPositionBalanceCard({
  market,
  position,
  positionMetrics,
  totalSupplied,
  walletBalance,
  shareBalance,
  isLoading,
  walletReady,
  walletReadyChecked,
  formatAmount,
  normalizeShares,
}: LendPositionBalanceCardProps) {
  const debtSymbol = getAssetSymbol(market.debtCurrency);
  const hasPosition = Boolean(position && positionMetrics);
  const normalizedShareBalance = market.positionTokenAssetId
    ? normalizeShares(shareBalance, market.liquidityShareScale)
    : Number(shareBalance || '0');
  const poolSharePercent =
    position && poolAndFinite(position.supplyAmount) && totalSupplied > 0
      ? Math.min((position.supplyAmount / totalSupplied) * 100, 100)
      : 0;

  const renderBalanceCell = (value: string) => {
    if (!walletReadyChecked || isLoading) {
      return <Skeleton tone="light" className="h-5 w-28" />;
    }

    return <p className="font-semibold text-foreground">{value}</p>;
  };

  return (
    <Card className="rounded-none border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base text-foreground">Position &amp; Balance</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {!walletReadyChecked || isLoading ? (
          <div className="overflow-hidden border border-border bg-background">
            <div className="grid grid-cols-2 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <p className="px-4 py-2">Position</p>
              <p className="border-l border-border px-4 py-2">Balance</p>
            </div>

            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`lend-position-row-skeleton-${index}`} className="grid grid-cols-2 border-t border-border first:border-t-0">
                <div className="space-y-2 px-4 py-3">
                  <Skeleton tone="light" className="h-4 w-24" />
                </div>
                <div className="space-y-2 border-l border-border px-4 py-3">
                  <Skeleton tone="light" className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : !walletReady ? (
          <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
            You do not have any {debtSymbol} token to lend.
          </div>
        ) : (
          <>
            <div className="overflow-hidden border border-border bg-background">
              <div className="grid grid-cols-2 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <p className="px-4 py-2">Position</p>
                <p className="border-l border-border px-4 py-2">Balance</p>
              </div>

              <div className="grid grid-cols-2 border-t border-border first:border-t-0">
                <div className="px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Principal</p>
                  <p className="mt-2 font-semibold text-foreground">{formatAmount(position?.supplyAmount ?? 0, 2)} {debtSymbol}</p>
                </div>
                <div className="border-l border-border px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet Balance</p>
                  <div className="mt-2">{renderBalanceCell(`${formatAmount(walletBalance, 2)} ${debtSymbol}`)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-border">
                <div className="px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Accrued Yield</p>
                  <p className="mt-2 font-semibold text-foreground">{formatAmount(positionMetrics?.accruedYield ?? 0, 2)} {debtSymbol}</p>
                </div>
                <div className="border-l border-border px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {market.positionTokenAssetId ? 'Pool Shares' : 'Position Units'}
                  </p>
                  <div className="mt-2">
                    {renderBalanceCell(
                      market.positionTokenAssetId
                        ? `${formatAmount(normalizedShareBalance, 2)} shares`
                        : `${formatAmount(normalizedShareBalance, 2)} ${debtSymbol}`
                    )}
                  </div>
                </div>
              </div>
            </div>

            {hasPosition ? (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Estimated Position Share</span>
                  <span>{poolSharePercent.toFixed(2)}%</span>
                </div>
                <Progress value={poolSharePercent} className="h-1.5 bg-card [&>[data-slot=progress-indicator]]:bg-primary" />
              </div>
            ) : (
              <p className="text-muted-foreground">No active supply position yet.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function poolAndFinite(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
