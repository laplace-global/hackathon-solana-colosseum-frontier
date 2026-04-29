'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Shield } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getChainExplorerLink } from '@/lib/chain/client';

type CollateralState = 'FREE' | 'PLEDGED' | 'FROZEN';

interface InstitutionalMockData {
  asset: {
    name: string;
    jurisdiction: string;
    spvName: string;
    bankruptcyRemote: boolean;
    securityRank: string;
    detailUrl: string;
  };
  valuation: {
    appraisedValue: number;
    loanAmount: number;
    maxLtv: number;
  };
  cashFlow: {
    netAnnualRentalIncome: number;
    annualDebtService: number;
  };
  onChain: {
    collateralState: CollateralState;
    lastVerified: string;
    txHash: string;
    multiSigRequirement: string;
  };
  enforcement: {
    defaultTrigger: string;
    curePeriod: number;
    liquidationJurisdiction: string;
    estimatedRecoveryTime: string;
    estimatedRecoveryRate: string;
  };
  market: {
    averageYield: string;
    expectedCapitalAppreciation: string;
    comparableSalesRange: string;
  };
}

const INSTITUTIONAL_MOCK_DATA: Record<string, InstitutionalMockData> = {
  SAIL: {
    asset: {
      name: 'THE SAIL Hotel Tower',
      jurisdiction: 'Malaysia',
      spvName: 'Laplace SPV-01',
      bankruptcyRemote: true,
      securityRank: '1st Pledge',
      detailUrl: '/hotel/the-sail',
    },
    valuation: {
      appraisedValue: 1_000_000,
      loanAmount: 350_000,
      maxLtv: 0.5,
    },
    cashFlow: {
      netAnnualRentalIncome: 80_000,
      annualDebtService: 15_750,
    },
    onChain: {
      collateralState: 'PLEDGED',
      lastVerified: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      txHash: 'A1B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF123456',
      multiSigRequirement: '2-of-3',
    },
    enforcement: {
      defaultTrigger: '30-day payment delay',
      curePeriod: 30,
      liquidationJurisdiction: 'Malaysia',
      estimatedRecoveryTime: '6-9 months',
      estimatedRecoveryRate: '85-95%',
    },
    market: {
      averageYield: '5-8%',
      expectedCapitalAppreciation: '10-30%',
      comparableSalesRange: '$950K-$1.1M',
    },
  },
  NYRA: {
    asset: {
      name: 'NYRA Oceanview Hotel',
      jurisdiction: 'Malaysia',
      spvName: 'Laplace SPV-02',
      bankruptcyRemote: true,
      securityRank: '1st Pledge',
      detailUrl: '/hotel/nyra',
    },
    valuation: {
      appraisedValue: 1_500_000,
      loanAmount: 480_000,
      maxLtv: 0.5,
    },
    cashFlow: {
      netAnnualRentalIncome: 120_000,
      annualDebtService: 21_600,
    },
    onChain: {
      collateralState: 'PLEDGED',
      lastVerified: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      txHash: 'B2C3D4E5F6789012345678901234567890ABCDEF1234567890ABCDEF1234567',
      multiSigRequirement: '2-of-3',
    },
    enforcement: {
      defaultTrigger: '30-day payment delay',
      curePeriod: 30,
      liquidationJurisdiction: 'Malaysia',
      estimatedRecoveryTime: '6-9 months',
      estimatedRecoveryRate: '85-95%',
    },
    market: {
      averageYield: '8%',
      expectedCapitalAppreciation: '15-35%',
      comparableSalesRange: '$1.4M-$1.6M',
    },
  },
};

interface InstitutionalUnderwritingProps {
  selectedMarketName?: string;
  selectedMarketId?: string;
  collateralCurrency?: string;
}

interface CollateralLockRow {
  walletAddress: string;
  collateralAmount: number;
  collateralCurrency: string;
  txHash: string | null;
}

function truncateMiddle(value: string, left = 8, right = 6): string {
  if (value.length <= left + right + 3) {
    return value;
  }

  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function InstitutionalUnderwriting({
  selectedMarketName,
  selectedMarketId,
  collateralCurrency,
}: InstitutionalUnderwritingProps) {
  const [collateralLocks, setCollateralLocks] = useState<CollateralLockRow[]>([]);
  const [collateralLocksLoading, setCollateralLocksLoading] = useState(false);
  const [collateralLocksError, setCollateralLocksError] = useState('');

  const currentMockData = useMemo(() => {
    if (!selectedMarketName) return INSTITUTIONAL_MOCK_DATA.SAIL;
    const marketKey = selectedMarketName.split('-')[0] as keyof typeof INSTITUTIONAL_MOCK_DATA;
    return INSTITUTIONAL_MOCK_DATA[marketKey] ?? INSTITUTIONAL_MOCK_DATA.SAIL;
  }, [selectedMarketName]);

  const underwritingDerived = useMemo(() => {
    const currentLtv = currentMockData.valuation.loanAmount / currentMockData.valuation.appraisedValue;
    const collateralBuffer = currentMockData.valuation.maxLtv - currentLtv;
    const dscr = currentMockData.cashFlow.netAnnualRentalIncome / currentMockData.cashFlow.annualDebtService;

    return {
      currentLtv,
      collateralBuffer,
      dscr,
    };
  }, [currentMockData]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );

  const onChainBadgeClassName =
    currentMockData.onChain.collateralState === 'PLEDGED'
      ? 'rounded-none bg-primary/10 text-primary'
      : currentMockData.onChain.collateralState === 'FROZEN'
        ? 'rounded-none bg-card text-foreground border border-border'
        : 'rounded-none bg-muted text-foreground';

  const underwritingLtvPercent = Math.max(0, Math.min(100, underwritingDerived.currentLtv * 100));
  const underwritingMaxLtvPercent = Math.max(0, Math.min(100, currentMockData.valuation.maxLtv * 100));
  const collateralAmountFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      }),
    []
  );

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCollateralLocks() {
      setCollateralLocksLoading(true);
      setCollateralLocksError('');

      try {
        const params = new URLSearchParams();
        if (selectedMarketId) {
          params.set('marketId', selectedMarketId);
        }

        const query = params.toString();
        const response = await fetch(
          query ? `/api/lending/collateral-locks?${query}` : '/api/lending/collateral-locks',
          {
            signal: abortController.signal,
          }
        );
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? 'Failed to load locked collateral positions');
        }

        const rows = Array.isArray(payload.data?.positions) ? payload.data.positions : [];
        setCollateralLocks(rows.slice(0, 10));
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setCollateralLocks([]);
        setCollateralLocksError(
          error instanceof Error ? error.message : 'Failed to load locked collateral positions'
        );
      } finally {
        if (!abortController.signal.aborted) {
          setCollateralLocksLoading(false);
        }
      }
    }

    loadCollateralLocks();

    return () => {
      abortController.abort();
    };
  }, [selectedMarketId]);

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 border border-border bg-card p-4">
        <div className="rounded-lg bg-card p-2">
          <Shield className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Institutional Credit Underwriting</h2>
          <p className="mt-1 text-sm text-muted-foreground">Due diligence information for institutional investors</p>
        </div>
      </div>

      <Card className="rounded-none border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Credit Underwriting Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Asset &amp; Legal Structure</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Asset Name</p>
                <Link href={currentMockData.asset.detailUrl} className="mt-1 block text-sm font-semibold text-primary hover:underline">
                  {currentMockData.asset.name}
                </Link>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Jurisdiction</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.asset.jurisdiction}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">SPV Name</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.asset.spvName}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Bankruptcy-Remote</p>
                <Badge className={`mt-2 ${currentMockData.asset.bankruptcyRemote ? 'rounded-none bg-primary/10 text-primary' : 'rounded-none bg-destructive/10 text-destructive'}`}>
                  {currentMockData.asset.bankruptcyRemote ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Security Rank</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.asset.securityRank}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Valuation &amp; LTV</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Appraised Value</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currencyFormatter.format(currentMockData.valuation.appraisedValue)}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Loan Amount</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currencyFormatter.format(currentMockData.valuation.loanAmount)}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Current LTV</p>
                <p className="mt-1 text-lg font-semibold text-primary">{(underwritingDerived.currentLtv * 100).toFixed(0)}%</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Max LTV</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{(currentMockData.valuation.maxLtv * 100).toFixed(0)}%</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Collateral Buffer</p>
                <p className="mt-1 text-lg font-semibold text-primary">{(underwritingDerived.collateralBuffer * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Current LTV</span>
                <span>Max LTV: {underwritingMaxLtvPercent.toFixed(0)}%</span>
              </div>
              <div className="relative h-2 rounded-full bg-border">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${underwritingLtvPercent}%` }} />
                <div
                  className="pointer-events-none absolute -top-1 h-4 w-0.5 bg-card0"
                  style={{ left: `${underwritingMaxLtvPercent}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Cash Flow &amp; DSCR</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Net Annual Rental Income</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {currencyFormatter.format(currentMockData.cashFlow.netAnnualRentalIncome)}/yr
                </p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Annual Debt Service</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {currencyFormatter.format(currentMockData.cashFlow.annualDebtService)}/yr
                </p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">DSCR</p>
                <p className="mt-1 text-lg font-semibold text-primary">{underwritingDerived.dscr.toFixed(2)}x</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-primary/30 bg-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base text-foreground">On-Chain Collateral Verification</CardTitle>
          <Badge className="rounded-none bg-primary/10 text-primary">On-chain Verified</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Collateral State</p>
              <Badge className={`mt-2 ${onChainBadgeClassName}`}>{currentMockData.onChain.collateralState}</Badge>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Last Verified</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{new Date(currentMockData.onChain.lastVerified).toLocaleString()}</p>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Multi-Sig Requirement</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.onChain.multiSigRequirement}</p>
            </div>
          </div>

          <div className="mt-4 border border-border bg-card p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Locked Collateral Positions</p>

            {collateralLocksLoading ? (
              <div className="mt-3 space-y-2">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-9 animate-pulse rounded-md bg-card" />
                ))}
              </div>
            ) : collateralLocksError ? (
              <p className="mt-3 text-sm text-destructive">Could not load collateral locks: {collateralLocksError}</p>
            ) : collateralLocks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No locked collateral positions.</p>
            ) : (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Wallet</th>
                      <th className="px-3 py-2 font-medium">Collateral</th>
                      <th className="px-3 py-2 font-medium">Collateral Lock Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collateralLocks.map((position, index) => {
                      const tokenSymbol = position.collateralCurrency || collateralCurrency || 'N/A';

                      return (
                        <tr key={`${position.walletAddress}-${index}`} className="border-t border-border bg-background">
                          <td className="px-3 py-2 font-mono text-xs text-foreground">
                            {truncateMiddle(position.walletAddress, 10, 8)}
                          </td>
                          <td className="px-3 py-2 text-foreground">
                            {collateralAmountFormatter.format(position.collateralAmount)} {tokenSymbol}
                          </td>
                          <td className="px-3 py-2">
                            {position.txHash ? (
                              <a
                                href={getChainExplorerLink('tx', position.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                {truncateMiddle(position.txHash, 10, 8)}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">Not available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Risk &amp; Recovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Default &amp; Enforcement</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Default Trigger</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{currentMockData.enforcement.defaultTrigger}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Cure Period</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.enforcement.curePeriod} days</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Liquidation Jurisdiction</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.enforcement.liquidationJurisdiction}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Estimated Recovery Time</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.enforcement.estimatedRecoveryTime}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Estimated Recovery Rate</p>
                <p className="mt-1 text-lg font-semibold text-primary">{currentMockData.enforcement.estimatedRecoveryRate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Market Reference</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Average Yield</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.market.averageYield}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Expected Capital Appreciation</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.market.expectedCapitalAppreciation}</p>
              </div>
              <div className="border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Comparable Sales Range</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{currentMockData.market.comparableSalesRange}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
