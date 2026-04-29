'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ExternalLink, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface TokenHolderMockData {
  property: {
    name: string;
    detailUrl: string;
  };
  tokenEconomics: {
    tokenSymbol: string;
    totalSupply: number;
    netAnnualRentalIncome: number;
    yieldPerToken: number;
    distributionFrequency: string;
    lastDistributionDate: string;
    nextDistributionDate: string;
    distributionStartDate: string;
  };
  benefits: {
    rentalDistribution: boolean;
    propertyAppreciation: boolean;
    votingRights: boolean;
    priorityAccess: boolean;
  };
}

interface DistributionHistoryPoint {
  week: string;
  amount: number;
  date: string;
}

function buildDistributionProjection(estimatedAnnualEarnings: number, distributionStartDate: string, weeks = 35) {
  const weeklyEarnings = estimatedAnnualEarnings / 52;
  const startDate = new Date(distributionStartDate);
  const seedSource = `${estimatedAnnualEarnings.toFixed(4)}-${distributionStartDate}-${weeks}`;
  const baseSeed = Array.from(seedSource).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;

  const randomAt = (index: number) => {
    let seed = (baseSeed + index * 0x9e3779b9) >>> 0;
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 10_000) / 10_000;
  };

  const rawWeights = Array.from({ length: weeks }, (_, i) => {
    const seasonal = 1 + 0.08 * Math.sin(i * 0.7) + 0.04 * Math.cos(i * 0.31);
    const randomJitter = 0.96 + randomAt(i) * 0.18;
    return seasonal * randomJitter;
  });
  const meanWeight = rawWeights.reduce((sum, weight) => sum + weight, 0) / weeks;

  const distributionHistory: DistributionHistoryPoint[] = rawWeights.map((weight, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);

    const normalizedWeight = weight / meanWeight;
    const amount = Math.round(weeklyEarnings * normalizedWeight * 100) / 100;

    return {
      week: `W${i + 1}`,
      amount,
      date: date.toISOString().split('T')[0],
    };
  });

  const totalDistributed = distributionHistory.reduce((sum, week) => sum + week.amount, 0);
  const averageWeeklyDistribution = distributionHistory.length ? totalDistributed / distributionHistory.length : 0;

  return {
    weeklyEarnings,
    distributionHistory,
    averageWeeklyDistribution,
    totalDistributed,
  };
}

const TOKEN_HOLDER_MOCK_DATA: Record<string, TokenHolderMockData> = {
  SAIL: {
    property: {
      name: 'THE SAIL Hotel Tower',
      detailUrl: '/hotel/the-sail',
    },
    tokenEconomics: {
      tokenSymbol: 'SAIL',
      totalSupply: 10_000,
      netAnnualRentalIncome: 80_000,
      yieldPerToken: 8,
      distributionFrequency: 'Weekly',
      lastDistributionDate: '2026-02-09',
      nextDistributionDate: '2026-02-16',
      distributionStartDate: '2025-06-01',
    },
    benefits: {
      rentalDistribution: true,
      propertyAppreciation: true,
      votingRights: true,
      priorityAccess: true,
    },
  },
  NYRA: {
    property: {
      name: 'NYRA Oceanview Hotel',
      detailUrl: '/hotel/nyra',
    },
    tokenEconomics: {
      tokenSymbol: 'NYRA',
      totalSupply: 15_000,
      netAnnualRentalIncome: 120_000,
      yieldPerToken: 8,
      distributionFrequency: 'Weekly',
      lastDistributionDate: '2026-02-09',
      nextDistributionDate: '2026-02-16',
      distributionStartDate: '2025-06-01',
    },
    benefits: {
      rentalDistribution: true,
      propertyAppreciation: true,
      votingRights: true,
      priorityAccess: true,
    },
  },
};

interface TokenHolderBenefitsProps {
  selectedMarketName?: string;
  explorerUrl?: string;
  walletBalance: number;
  collateralDeposited: number;
}

export function TokenHolderBenefits({ selectedMarketName, explorerUrl, walletBalance, collateralDeposited }: TokenHolderBenefitsProps) {
  const currentMockData = useMemo(() => {
    if (!selectedMarketName) return TOKEN_HOLDER_MOCK_DATA.SAIL;
    const marketKey = selectedMarketName.split('-')[0] as keyof typeof TOKEN_HOLDER_MOCK_DATA;
    return TOKEN_HOLDER_MOCK_DATA[marketKey] ?? TOKEN_HOLDER_MOCK_DATA.SAIL;
  }, [selectedMarketName]);

  const totalTokenHoldings = walletBalance + collateralDeposited;
  const estimatedAnnualEarnings = currentMockData.tokenEconomics.yieldPerToken * totalTokenHoldings;
  const { weeklyEarnings, distributionHistory, averageWeeklyDistribution, totalDistributed } = useMemo(
    () => buildDistributionProjection(estimatedAnnualEarnings, currentMockData.tokenEconomics.distributionStartDate, 35),
    [estimatedAnnualEarnings, currentMockData.tokenEconomics.distributionStartDate]
  );

  const distributionChartConfig = {
    distribution: {
      label: 'Distribution',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );

  const earningsFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 border border-border bg-card p-4">
        <div className="bg-primary/10 p-2">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Your Token Holder Benefits</h2>
          <p className="mt-1 text-sm text-muted-foreground">How your collateral tokens can generate value while you borrow</p>
        </div>
      </div>

      <Card className="rounded-none border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Property Earnings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Property</p>
              <Link href={currentMockData.property.detailUrl} className="mt-1 block text-sm font-semibold text-primary hover:underline">
                {currentMockData.property.name}
              </Link>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Net Annual Rental Income</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {currencyFormatter.format(currentMockData.tokenEconomics.netAnnualRentalIncome)}
              </p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Token Supply</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {currentMockData.tokenEconomics.totalSupply.toLocaleString()} {currentMockData.tokenEconomics.tokenSymbol}
              </p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Yield per Token</p>
              <p className="mt-1 text-lg font-semibold text-primary">
                {currencyFormatter.format(currentMockData.tokenEconomics.yieldPerToken)}/yr
              </p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Distribution</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.tokenEconomics.distributionFrequency}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Last Distribution Date</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {dateFormatter.format(new Date(currentMockData.tokenEconomics.lastDistributionDate))}
              </p>
            </div>
            <div className="border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-eyebrow text-muted-foreground">Next Distribution Date</p>
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {dateFormatter.format(new Date(currentMockData.tokenEconomics.nextDistributionDate))}
              </p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Distribution Started</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {dateFormatter.format(new Date(currentMockData.tokenEconomics.distributionStartDate))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Your Earnings Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Total Holdings</p>
              <p className="text-[11px] text-muted-foreground">(wallet balance + collateral)</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {totalTokenHoldings.toLocaleString(undefined, { maximumFractionDigits: 4 })} {currentMockData.tokenEconomics.tokenSymbol}
              </p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Yield per Token</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {currencyFormatter.format(currentMockData.tokenEconomics.yieldPerToken)}/yr
              </p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Estimated Annual Earnings</p>
              <p className="mt-1 text-lg font-semibold text-primary">{earningsFormatter.format(estimatedAnnualEarnings)}</p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Estimated Weekly Earnings</p>
              <p className="mt-1 text-lg font-semibold text-primary">{earningsFormatter.format(weeklyEarnings)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Distribution History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartContainer config={distributionChartConfig} className="h-[200px] w-full">
            <BarChart data={distributionHistory}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} interval={4} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(label, payload) => {
                  const date = payload?.[0]?.payload?.date;
                  return date ? `${label} (${dateFormatter.format(new Date(date))})` : label;
                }}
                formatter={(value: number) => [earningsFormatter.format(value), 'Distribution']}
              />
              <Bar dataKey="amount" fill="var(--color-distribution)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Average Weekly Distribution</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{earningsFormatter.format(averageWeeklyDistribution)}</p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Total Distributed (35 weeks)</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{earningsFormatter.format(totalDistributed)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Token Holder Rights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Rental Distribution</p>
              <Badge className={`mt-2 ${currentMockData.benefits.rentalDistribution ? 'rounded-none bg-primary/10 text-primary' : 'rounded-none bg-destructive/10 text-destructive'}`}>
                {currentMockData.benefits.rentalDistribution ? 'Eligible' : 'Not available'}
              </Badge>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Property Appreciation</p>
              <Badge className={`mt-2 ${currentMockData.benefits.propertyAppreciation ? 'rounded-none bg-primary/10 text-primary' : 'rounded-none bg-destructive/10 text-destructive'}`}>
                {currentMockData.benefits.propertyAppreciation ? 'Eligible' : 'Not available'}
              </Badge>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Voting Rights</p>
              <Badge className={`mt-2 ${currentMockData.benefits.votingRights ? 'rounded-none bg-primary/10 text-primary' : 'rounded-none bg-destructive/10 text-destructive'}`}>
                {currentMockData.benefits.votingRights ? 'Eligible' : 'Not available'}
              </Badge>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-eyebrow text-muted-foreground">Priority Access</p>
              <Badge className={`mt-2 ${currentMockData.benefits.priorityAccess ? 'rounded-none bg-primary/10 text-primary' : 'rounded-none bg-destructive/10 text-destructive'}`}>
                {currentMockData.benefits.priorityAccess ? 'Eligible' : 'Not available'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
