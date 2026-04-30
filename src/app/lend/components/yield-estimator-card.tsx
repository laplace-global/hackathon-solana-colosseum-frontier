'use client';

import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import { getAssetSymbol } from '@/lib/assets/asset-symbols';

import type { MarketConfig, PoolMetrics, SupplyPosition, SupplyPositionMetrics } from '../types';

const yieldProjectionChartConfig = {
  principalBase: {
    label: 'Principal',
    color: '#3b82f6',
  },
  yieldAccrued: {
    label: 'Accumulated Yield',
    color: '#bfdbfe',
  },
} satisfies ChartConfig;

interface YieldEstimatorCardProps {
  market: MarketConfig;
  pool: PoolMetrics | null;
  position: SupplyPosition | null;
  positionMetrics: SupplyPositionMetrics | null;
  isLoading: boolean;
  formatAmount: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
}

function projectTotal(principal: number, annualRate: number, month: number): number {
  return principal * Math.pow(1 + annualRate, month / 12);
}

export function YieldEstimatorCard({
  market,
  pool,
  position,
  positionMetrics,
  isLoading,
  formatAmount,
  formatPercent,
}: YieldEstimatorCardProps) {
  const debtSymbol = getAssetSymbol(market.debtCurrency);
  const [supplyAmount, setSupplyAmount] = useState('1000');
  const [durationMonths, setDurationMonths] = useState<number>(24);
  const borrowApy = pool?.borrowApr ?? market.baseInterestRate ?? positionMetrics?.supplyApy ?? 0;
  const hasActivePosition = Boolean(position && position.supplyAmount > 0);
  const typedPrincipal = Number(supplyAmount);
  const effectivePrincipal = hasActivePosition
    ? (position?.supplyAmount ?? 0)
    : (Number.isFinite(typedPrincipal) && typedPrincipal > 0 ? typedPrincipal : 0);

  const projection = useMemo(() => {
    if (!Number.isFinite(effectivePrincipal) || effectivePrincipal <= 0) {
      return {
        principal: 0,
        estimatedYield: 0,
        totalProjectedValue: 0,
      };
    }

    const totalProjectedValue = projectTotal(effectivePrincipal, borrowApy, durationMonths);
    const estimatedYield = Math.max(totalProjectedValue - effectivePrincipal, 0);

    return {
      principal: effectivePrincipal,
      estimatedYield,
      totalProjectedValue,
    };
  }, [borrowApy, durationMonths, effectivePrincipal]);

  const projectionSeries = useMemo(() => {
    if (projection.principal <= 0) return [];

    return Array.from({ length: durationMonths }, (_, index) => {
      const month = index + 1;
      const borrowProjectedTotal = projectTotal(projection.principal, borrowApy, month);

      return {
        monthLabel: `M${month}`,
        principalBase: projection.principal,
        yieldAccrued: Math.max(borrowProjectedTotal - projection.principal, 0),
      };
    });
  }, [borrowApy, durationMonths, projection.principal]);

  return (
    <Card className="rounded-none border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base text-foreground">
          {hasActivePosition ? 'Projected Yield' : 'Yield Estimator'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton tone="light" className="h-10 w-full rounded-lg" />
            <Skeleton tone="light" className="h-10 w-full rounded-lg" />
            <Skeleton tone="light" className="h-[220px] w-full rounded-xl" />
            <Skeleton tone="light" className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {!hasActivePosition ? (
                <div className="space-y-2">
                  <label htmlFor="yield-estimator-amount" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Supply Amount
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="yield-estimator-amount"
                      type="number"
                      min="0"
                      step="0.0001"
                      value={supplyAmount}
                      onChange={(event) => setSupplyAmount(event.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <span className="text-sm text-muted-foreground">{debtSymbol}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Position Principal</p>
                  <div className="border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground">
                    {formatAmount(position?.supplyAmount ?? 0, 2)} {debtSymbol}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="yield-estimator-duration" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Duration (Months)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="yield-estimator-duration"
                    type="number"
                    min={1}
                    max={360}
                    step={1}
                    value={durationMonths}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      if (!Number.isFinite(parsed)) {
                        setDurationMonths(1);
                        return;
                      }
                      const clamped = Math.min(360, Math.max(1, Math.floor(parsed)));
                      setDurationMonths(clamped);
                    }}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <span className="text-sm text-muted-foreground">months</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {hasActivePosition ? 'Projected earnings use your active supplied principal. ' : ''}
              Projection uses current borrow APY of {formatPercent(borrowApy)}.
            </p>

            {projectionSeries.length > 0 ? (
              <ChartContainer config={yieldProjectionChartConfig} className="h-[220px] w-full border border-border bg-background px-2 py-3">
                <ComposedChart data={projectionSeries} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(value: number) => value.toFixed(0)} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          const numericValue = Number(value);
                          return (
                            <div className="flex w-full items-center justify-between gap-3">
                              <span>{name}</span>
                              <span className="font-mono tabular-nums">
                                {Number.isFinite(numericValue) ? numericValue.toFixed(4) : '0.0000'} {debtSymbol}
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent className="text-foreground" />} />

                  <Bar dataKey="principalBase" stackId="value" fill="var(--color-principalBase)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="yieldAccrued" stackId="value" fill="var(--color-yieldAccrued)" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
                {hasActivePosition ? 'No active projection data available yet.' : 'Enter a supply amount to render projected growth.'}
              </div>
            )}

            <div className="space-y-2 border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Principal</span>
                <span className="font-semibold text-foreground">
                  {formatAmount(projection.principal, 2)} {debtSymbol}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Estimated Yield</span>
                <span className="font-semibold text-primary">
                  {formatAmount(projection.estimatedYield, 2)} {debtSymbol}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Total Projected Value</span>
                <span className="font-semibold text-foreground">
                  {formatAmount(projection.totalProjectedValue, 2)} {debtSymbol}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
