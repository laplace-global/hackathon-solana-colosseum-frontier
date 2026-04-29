import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';

import { getAssetSymbol } from '@/lib/assets/asset-symbols';

import type { Market, Position, PositionMetrics } from '../types';

interface PositionBalanceCardProps {
  market: Market;
  position: Position | null;
  metrics: PositionMetrics | null;
  positionLoading: boolean;
  balancesLoading: boolean;
  getBalance: (symbol: string, issuer?: string) => number;
  onRefresh: () => void;
}

export function PositionBalanceCard({
  market,
  position,
  metrics,
  positionLoading,
  balancesLoading,
  getBalance,
  onRefresh,
}: PositionBalanceCardProps) {
  const collateralSymbol = getAssetSymbol(market.collateralCurrency);
  const debtSymbol = getAssetSymbol(market.debtCurrency);

  const hasPosition = Boolean(position && metrics);
  const collateralPositionAmount = hasPosition ? (position?.collateralAmount ?? 0).toFixed(2) : '0.00';
  const debtPositionAmount = hasPosition ? (metrics?.totalDebt ?? 0).toFixed(2) : '0.00';

  return (
    <Card className="rounded-none border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Position &amp; Balance</CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="overflow-hidden border border-border bg-background">
          <div className="grid grid-cols-2 border-b border-border text-xs uppercase tracking-wide text-muted-foreground border-border">
            <p className="px-4 py-2">Position</p>
            <p className="border-l border-border px-4 py-2 border-border">Balance</p>
          </div>

          <div className="grid grid-cols-2">
            <div className="space-y-3 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Collateral</p>
              {positionLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="font-semibold" data-testid="borrow-position-collateral">
                  {collateralPositionAmount} {collateralSymbol}
                </p>
              )}
            </div>

            <div className="space-y-3 border-l border-border px-4 py-3 border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet</p>
              {balancesLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="font-semibold">{getBalance(market.collateralCurrency, market.collateralAssetId).toFixed(2)} {collateralSymbol}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-border border-border">
            <div className="space-y-3 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Loan</p>
              {positionLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="font-semibold" data-testid="borrow-position-loan">
                  {debtPositionAmount} {debtSymbol}
                </p>
              )}
            </div>

            <div className="space-y-3 border-l border-border px-4 py-3 border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet</p>
              {balancesLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="font-semibold">{getBalance(market.debtCurrency, market.debtAssetId).toFixed(2)} {debtSymbol}</p>
              )}
            </div>
          </div>
        </div>

        {positionLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ) : hasPosition && metrics ? (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Current LTV</span>
              <span>{(metrics.currentLtv * 100).toFixed(2)}%</span>
            </div>
            <Progress
              value={Math.min((metrics.currentLtv / market.liquidationLtvRatio) * 100, 100)}
              className="h-1.5 bg-card"
            />
          </div>
        ) : (
          <p className="text-muted-foreground">No active position yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
