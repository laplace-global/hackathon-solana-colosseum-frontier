'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { BorrowerActivityCard } from './components/borrower-activity-card';
import { EstimateCalculatorCard } from './components/estimate-calculator-card';
import { MarketActionsCard } from './components/market-actions-card';
import { PositionBalanceCard } from './components/position-balance-card';
import { TokenHolderBenefits } from './components/token-holder-benefits';
import type {
  BorrowerEvent,
  LendingConfig,
  LoanRepaymentOverview,
  Market,
  Position,
  PositionMetrics,
  RepayKind,
} from './types';

import { getChainExplorerLink, restoreLocalAccount } from '@/lib/chain/client';
import { loadLocalAccountSecret } from '@/lib/chain/storage';
import type { LocalAccount } from '@/lib/chain/types';
import { getAssetId, getAssetSymbol } from '@/lib/assets/asset-symbols';
import { hotels } from '@/data/hotels';
import { getPropertyTokenSymbol } from '@/data/property-tokens';
import { buildGuidedFlowSteps, calculateGuidedFlowProgress } from './guided-flow';

const REPAY_BUFFER_RATE = 0.002;
const FULL_REPAY_BUFFER_RATE = 0.0001;
const REPAY_DECIMALS = 6;

function roundUpAmount(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}

function withRepayBuffer(baseAmount: number, bufferRate: number = REPAY_BUFFER_RATE): number {
  const buffered = baseAmount * (1 + bufferRate);
  return roundUpAmount(buffered, REPAY_DECIMALS);
}

interface TokenBalance {
  currency: string;
  value: string;
  assetId?: string;
  issuer?: string;
}

export default function LendingPage() {
  return (
    <Suspense fallback={<LendingPageFallback />}>
      <LendingPageContent />
    </Suspense>
  );
}

function LendingPageFallback() {
  return (
    <div className="lp-light-surface flex min-h-screen items-center justify-center bg-background pt-24 text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function LendingPageContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<LendingConfig | null>(null);
  const [configError, setConfigError] = useState('');
  const [wallet, setWallet] = useState<LocalAccount | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [metrics, setMetrics] = useState<PositionMetrics | null>(null);
  const [events, setEvents] = useState<BorrowerEvent[]>([]);
  const [loanRepayment, setLoanRepayment] = useState<LoanRepaymentOverview | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [positionHydrated, setPositionHydrated] = useState(false);
  const [loading, setLoading] = useState('');
  const [networkPendingCount, setNetworkPendingCount] = useState(0);
  const [collateralAssetReady, setCollateralAssetReady] = useState(false);
  const [debtAssetReady, setDebtAssetReady] = useState(false);

  const [depositAmount, setDepositAmount] = useState('1');
  const [borrowAmount, setBorrowAmount] = useState('50');
  const [repayAmount, setRepayAmount] = useState('0');
  const [repayKind, setRepayKind] = useState<RepayKind>('regular');
  const [withdrawAmount, setWithdrawAmount] = useState('1');
  const [actionTab, setActionTab] = useState('deposit');
  const [reinvestTokenAmount, setReinvestTokenAmount] = useState('1');
  const [reinvestCompleted, setReinvestCompleted] = useState(false);

  const requestedHotelId = searchParams.get('hotelId') ?? '';
  const requestedUnitId = searchParams.get('unitId') ?? '';
  const isGuidedReinvestFlow = searchParams.get('flow') === 'reinvest';
  const requestedCollateralSymbol = getPropertyTokenSymbol(requestedHotelId);

  const selectedMarket = useMemo(
    () => config?.markets.find((market) => market.id === selectedMarketId) ?? null,
    [config?.markets, selectedMarketId]
  );

  const reinvestTarget = useMemo(() => {
    const fallbackHotel = hotels.find((entry) => entry.id === 'the-sail') ?? hotels[0];
    const hotel = hotels.find((entry) => entry.id === requestedHotelId) ?? fallbackHotel;
    const unit = hotel.units.find((entry) => entry.id === requestedUnitId) ?? hotel.units[0];

    return { hotel, unit };
  }, [requestedHotelId, requestedUnitId]);

  const reinvestTokenPrice = selectedMarket?.prices?.collateralPriceUsd ?? reinvestTarget.hotel.tokenPrice;
  const parsedReinvestTokenAmount = Number(reinvestTokenAmount);
  const safeReinvestTokenAmount =
    Number.isFinite(parsedReinvestTokenAmount) && parsedReinvestTokenAmount > 0 ? parsedReinvestTokenAmount : 0;
  const reinvestTotalPrice = safeReinvestTokenAmount * reinvestTokenPrice;
  const reinvestTargetName = `${reinvestTarget.hotel.name} / ${reinvestTarget.unit.name}`;
  const guidedFlowSteps = useMemo(
    () =>
      buildGuidedFlowSteps({
        hasWallet: Boolean(wallet),
        isGuidedReinvestFlow,
        actionTab,
        collateralAmount: position?.collateralAmount ?? 0,
        totalDebt: metrics?.totalDebt ?? 0,
        reinvestCompleted,
      }),
    [actionTab, isGuidedReinvestFlow, metrics?.totalDebt, position?.collateralAmount, reinvestCompleted, wallet]
  );
  const guidedFlowProgress = useMemo(() => calculateGuidedFlowProgress(guidedFlowSteps), [guidedFlowSteps]);

  const showGlobalLoading = networkPendingCount > 0;

  const beginNetworkRequest = useCallback(() => {
    setNetworkPendingCount((count) => count + 1);
  }, []);

  const endNetworkRequest = useCallback(() => {
    setNetworkPendingCount((count) => Math.max(0, count - 1));
  }, []);

  const withNetworkLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      beginNetworkRequest();
      try {
        return await fn();
      } finally {
        endNetworkRequest();
      }
    },
    [beginNetworkRequest, endNetworkRequest]
  );

  const getBalance = useCallback(
    (symbol: string, assetId?: string): number => {
      const code = getAssetId(symbol);
      const targetAssetId = assetId?.toUpperCase();
      const item = balances.find((balance) => {
        const currency = balance.currency.toUpperCase();
        const currencyMatch = currency === symbol.toUpperCase() || (code ? currency === code : false);
        if (!currencyMatch) return false;
        if (!targetAssetId) return true;
        return (balance.assetId ?? balance.issuer ?? '').toUpperCase() === targetAssetId;
      });
      return item ? Number(item.value) : 0;
    },
    [balances]
  );

  const refreshBalances = useCallback(async () => {
    if (!wallet?.address) return;
    setBalancesLoading(true);
    try {
      const response = await withNetworkLoading(() => fetch(`/api/balances?address=${wallet.address}`));
      const payload = await response.json();
      if (payload.success) {
        setBalances(payload.balances);
      }
    } catch (error) {
      console.error('Failed to refresh balances', error);
    } finally {
      setBalancesLoading(false);
    }
  }, [wallet?.address, withNetworkLoading]);

  const refreshPosition = useCallback(async () => {
    if (!wallet?.address || !selectedMarketId) {
      setPosition(null);
      setMetrics(null);
      setEvents([]);
      setLoanRepayment(null);
      setPositionLoading(false);
      setPositionHydrated(true);
      return;
    }

    setPositionHydrated(false);
    setPositionLoading(true);
    try {
      const response = await withNetworkLoading(() =>
        fetch(`/api/lending/position?userAddress=${wallet.address}&marketId=${selectedMarketId}`)
      );
      const payload = await response.json();
      if (!payload.success) return;
      setPosition(payload.data.position);
      setMetrics(payload.data.metrics);
      setLoanRepayment(payload.data.loan ?? null);
      setEvents(payload.data.events ?? []);
    } catch (error) {
      console.error('Failed to refresh position', error);
    } finally {
      setPositionLoading(false);
      setPositionHydrated(true);
    }
  }, [selectedMarketId, wallet?.address, withNetworkLoading]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await withNetworkLoading(() => fetch('/api/lending/config'));
        const payload = await response.json();
        if (!payload.success) {
          setConfigError(payload.error?.message ?? 'Failed to load lending config');
          return;
        }

        setConfig(payload.data);
        const markets = payload.data.markets as Market[];
        if (markets.length > 0) {
          const requestedMarket = requestedCollateralSymbol
            ? markets.find(
                (market) =>
                  getAssetSymbol(market.collateralCurrency).toUpperCase() === requestedCollateralSymbol ||
                  getAssetSymbol(market.collateralAssetId).toUpperCase() === requestedCollateralSymbol
              )
            : null;
          const sailMarket = markets.find((market) => {
            const nameHasSail = market.name.toUpperCase().includes('SAIL');
            const collateralIsSail = getAssetSymbol(market.collateralCurrency).toUpperCase() === 'SAIL';
            const debtIsSail = getAssetSymbol(market.debtCurrency).toUpperCase() === 'SAIL';
            return nameHasSail || collateralIsSail || debtIsSail;
          });
          setSelectedMarketId((requestedMarket ?? sailMarket ?? markets[0]).id);
        }

        const secret = loadLocalAccountSecret();
        if (secret) {
          setWallet(restoreLocalAccount(secret));
        }
      } catch {
        setConfigError('Failed to connect to server');
      }
    }

    bootstrap();
  }, [requestedCollateralSymbol, withNetworkLoading]);

  useEffect(() => {
    if (!wallet?.address) return;
    refreshBalances();
    if (selectedMarketId) {
      refreshPosition();
    }
  }, [refreshBalances, refreshPosition, selectedMarketId, wallet?.address]);

  useEffect(() => {
    if (!selectedMarket) return;

    setDepositAmount(String(Math.max(1, selectedMarket.minCollateralAmount)));
    setWithdrawAmount(String(Math.max(1, selectedMarket.minCollateralAmount)));
    setBorrowAmount(String(Math.max(1, selectedMarket.minBorrowAmount)));
  }, [selectedMarket]);

  useEffect(() => {
    if (!wallet?.address || !selectedMarket) {
      setCollateralAssetReady(false);
      setDebtAssetReady(false);
      return;
    }

    const hasAssetBalance = (assetId: string, currency: string): boolean => {
      const normalizedCurrency = getAssetSymbol(currency).toUpperCase();
      const normalizedAssetId = assetId.toUpperCase();

      return balances.some((balance) => {
        if ((balance.assetId ?? balance.issuer ?? '').toUpperCase() !== normalizedAssetId) return false;
        return getAssetSymbol(balance.currency).toUpperCase() === normalizedCurrency;
      });
    };

    setCollateralAssetReady(hasAssetBalance(selectedMarket.collateralAssetId, selectedMarket.collateralCurrency));
    setDebtAssetReady(hasAssetBalance(selectedMarket.debtAssetId, selectedMarket.debtCurrency));
  }, [balances, selectedMarket, wallet?.address]);

  const withAction = useCallback(async (action: string, fn: () => Promise<void>) => {
    setLoading(action);
    try {
      await fn();
    } finally {
      setLoading('');
    }
  }, []);

  const handleDeposit = useCallback(async () => {
    if (!wallet || !selectedMarket) return;
    if (!selectedMarket.collateralLockEnabled) {
      toast.error('Collateral locking is not enabled for this market yet');
      return;
    }
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    await withAction('deposit', async () => {
      const response = await withNetworkLoading(() =>
        fetch('/api/lending/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderAddress: wallet.address,
            marketId: selectedMarket.id,
            amount,
            accountSecret: wallet.secret,
          }),
        })
      );
      const payload = await response.json();
      if (!payload.success) {
        toast.error(payload.error?.message ?? 'Deposit failed');
        return;
      }

      toast.success('Collateral locked');
      await refreshPosition();
      if (isGuidedReinvestFlow) {
        setActionTab('borrow');
      }
    });
  }, [
    depositAmount,
    isGuidedReinvestFlow,
    refreshPosition,
    selectedMarket,
    wallet,
    withNetworkLoading,
    withAction,
  ]);

  const handleBorrow = useCallback(async () => {
    if (!wallet || !selectedMarket) return;
    const amount = Number(borrowAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (metrics && amount > metrics.maxBorrowableAmount) {
      toast.error(
        `Borrow amount exceeds available limit (${metrics.maxBorrowableAmount.toFixed(4)} ${getAssetSymbol(selectedMarket.debtCurrency)})`
      );
      return;
    }

    await withAction('borrow', async () => {
      const response = await withNetworkLoading(() =>
        fetch('/api/lending/borrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: wallet.address,
            marketId: selectedMarket.id,
            amount,
            accountSecret: wallet.secret,
          }),
        })
      );
      const payload = await response.json();
      if (!payload.success) {
        toast.error(payload.error?.message ?? 'Borrow failed');
        return;
      }

      toast.success('Borrow successful');
      await refreshPosition();
      if (isGuidedReinvestFlow) {
        setActionTab('reinvest');
      }
    });
  }, [
    borrowAmount,
    isGuidedReinvestFlow,
    metrics,
    refreshPosition,
    selectedMarket,
    wallet,
    withAction,
    withNetworkLoading,
  ]);

  const handleReinvest = useCallback(async () => {
    if (!wallet || !selectedMarket) return;
    const tokenAmount = Number(reinvestTokenAmount);
    if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) return;

    await withAction('reinvest', async () => {
      const response = await withNetworkLoading(() =>
        fetch('/api/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: wallet.address,
            accountSecret: wallet.secret,
            hotelId: reinvestTarget.hotel.id,
            unitId: reinvestTarget.unit.id,
            tokenAmount,
            pricePerToken: reinvestTokenPrice,
            totalPrice: tokenAmount * reinvestTokenPrice,
            paymentMethod: 'wallet',
            idempotencyKey: crypto.randomUUID(),
          }),
        })
      );
      const payload = await response.json();
      if (!payload.success) {
        toast.error(payload.error?.message ?? 'Reinvest failed');
        return;
      }

      toast.success('Reinvest complete');
      setReinvestCompleted(true);
      void refreshBalances();
    });
  }, [
    refreshBalances,
    reinvestTarget.hotel.id,
    reinvestTarget.unit.id,
    reinvestTokenAmount,
    reinvestTokenPrice,
    selectedMarket,
    wallet,
    withAction,
    withNetworkLoading,
  ]);

  const handleRepay = useCallback(async () => {
    if (!wallet || !selectedMarket) return;
    if (!loanRepayment) {
      toast.error('No active on-chain loan to repay');
      return;
    }
    const amount = Number(repayAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    await withAction('repay', async () => {
      const response = await withNetworkLoading(() =>
        fetch('/api/lending/repay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: wallet.address,
            marketId: selectedMarket.id,
            amount,
            accountSecret: wallet.secret,
            repayKind,
          }),
        })
      );
      const payload = await response.json();
      if (!payload.success) {
        toast.error(payload.error?.message ?? 'Repay failed');
        return;
      }

      toast.success('Repayment successful');
      await refreshPosition();
    });
  }, [
    loanRepayment,
    refreshPosition,
    repayAmount,
    repayKind,
    selectedMarket,
    wallet,
    withNetworkLoading,
    withAction,
  ]);

  const applyRepayPreset = useCallback(
    (kind: RepayKind) => {
      setRepayKind(kind);
      const baseAmount =
        kind === 'full'
          ? metrics?.totalDebt ?? loanRepayment?.minimumRepayment
          : kind === 'overpayment'
          ? loanRepayment?.suggestedOverpayment
          : loanRepayment?.minimumRepayment;
      if (typeof baseAmount === 'number' && Number.isFinite(baseAmount) && baseAmount > 0) {
        const bufferedAmount =
          kind === 'full'
            ? withRepayBuffer(baseAmount, FULL_REPAY_BUFFER_RATE)
            : withRepayBuffer(baseAmount);
        setRepayAmount(bufferedAmount.toFixed(REPAY_DECIMALS));
      }
    },
    [loanRepayment, metrics?.totalDebt]
  );

  const handleWithdraw = useCallback(async () => {
    if (!wallet || !selectedMarket) return;
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    await withAction('withdraw', async () => {
      const response = await withNetworkLoading(() =>
        fetch('/api/lending/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: wallet.address,
            marketId: selectedMarket.id,
            amount,
            accountSecret: wallet.secret,
          }),
        })
      );
      const payload = await response.json();
      if (!payload.success) {
        toast.error(payload.error?.message ?? 'Withdraw failed');
        return;
      }

      toast.success('Withdrawal successful');
      await refreshPosition();
    });
  }, [refreshPosition, selectedMarket, wallet, withdrawAmount, withAction, withNetworkLoading]);

  if (configError) {
    return (
      <div className="lp-light-surface min-h-screen bg-background pt-24 text-foreground">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Card className="rounded-none border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Configuration Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{configError}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="lp-light-surface flex min-h-screen items-center justify-center bg-background pt-24 text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="lp-light-surface relative min-h-screen bg-background pt-24 text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden">
        <div
          className={`h-full bg-primary transition-opacity duration-150 ${showGlobalLoading ? 'animate-pulse opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-12 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-eyebrow text-primary mb-3">Credit</p>
            <h1 className="font-serif text-4xl font-light text-foreground md:text-5xl">Laplace On-Chain Credit for RWAs</h1>
            <p className="mt-3 text-sm text-muted-foreground">Collateralized borrowing flow with pre-funded wallet assumptions.</p>
          </div>
          <div className="flex items-center justify-end gap-2">
              <select
                value={selectedMarketId}
                onChange={(event) => setSelectedMarketId(event.target.value)}
                className="border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {config.markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {selectedMarket && (
          <Tabs defaultValue="market-action" className="space-y-6">
            <TabsList>
              <TabsTrigger value="market-action">Market Action</TabsTrigger>
              <TabsTrigger value="general-info">General Info</TabsTrigger>
            </TabsList>

            <TabsContent value="market-action" className="space-y-6">
              {isGuidedReinvestFlow && (
                <section
                  className="border-y border-border px-1 py-7 sm:px-4"
                  data-testid="guided-flow-card"
                >
                  <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-eyebrow text-muted-foreground">DeFi Finance</p>
                      <h2 className="mt-2 font-serif text-2xl font-light leading-tight text-foreground">
                        Borrow Against Your Portfolio
                      </h2>
                    </div>
                    <div className="text-right text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                      {reinvestTargetName}
                    </div>
                  </div>
                  <div className="overflow-hidden pb-1" aria-label="Connect to Reinvest flow">
                    <div className="relative w-full px-1 pb-1 pt-2 sm:px-2">
                      <div className="absolute left-[10%] top-[26px] h-px w-[80%] bg-border" />
                      <div
                        className="absolute left-[10%] top-[26px] h-px bg-foreground transition-[width] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
                        style={{ width: `${guidedFlowProgress * 0.8}%` }}
                      />
                      <div className="relative z-10 grid grid-cols-5">
                        {guidedFlowSteps.map((step, index) => {
                          const isCurrent = step.state === 'current';
                          const isComplete = step.state === 'complete';
                          const numberClassName = isComplete
                            ? 'border-foreground bg-foreground text-background'
                            : isCurrent
                            ? 'border-foreground bg-card text-foreground shadow-[0_0_0_4px_rgba(23,21,16,0.04)]'
                            : 'border-border bg-background text-muted-foreground';
                          const labelClassName = isComplete || isCurrent ? 'text-foreground' : 'text-muted-foreground';

                          return (
                            <div
                              key={step.id}
                              data-testid={`guided-flow-step-${step.id}`}
                              data-flow-state={step.state}
                              className="group flex min-w-0 flex-col items-center text-center"
                            >
                              <div
                                className={`flex h-8 w-8 items-center justify-center border text-[9px] transition-all duration-300 sm:h-9 sm:w-9 sm:text-[10px] ${numberClassName}`}
                              >
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <div
                                className={`mt-3 max-w-full truncate text-[6.5px] uppercase tracking-[0.08em] transition-colors sm:text-[8px] sm:tracking-[0.2em] ${labelClassName}`}
                              >
                                {step.label}
                              </div>
                              <div
                                className={`mt-3 h-px w-4 transition-colors sm:w-6 ${
                                  isComplete || isCurrent ? 'bg-foreground' : 'bg-border'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <MarketActionsCard
                market={selectedMarket}
                walletConnected={Boolean(wallet)}
                loading={loading}
                actionTab={actionTab}
                onActionTabChange={setActionTab}
                collateralAssetReady={collateralAssetReady}
                debtAssetReady={debtAssetReady}
                poolLoading={Boolean(wallet?.address && selectedMarketId) && (positionLoading || !positionHydrated)}
                metrics={metrics}
                loanRepayment={loanRepayment}
                repayBufferRate={REPAY_BUFFER_RATE}
                depositAmount={depositAmount}
                setDepositAmount={setDepositAmount}
                borrowAmount={borrowAmount}
                setBorrowAmount={setBorrowAmount}
                repayAmount={repayAmount}
                setRepayAmount={setRepayAmount}
                repayKind={repayKind}
                withdrawAmount={withdrawAmount}
                setWithdrawAmount={setWithdrawAmount}
                reinvestTokenAmount={reinvestTokenAmount}
                setReinvestTokenAmount={setReinvestTokenAmount}
                reinvestTokenPrice={reinvestTokenPrice}
                reinvestTotalPrice={reinvestTotalPrice}
                reinvestTargetName={reinvestTargetName}
                reinvestYieldPercentage={reinvestTarget.hotel.roiPercentage}
                onDeposit={handleDeposit}
                onBorrow={handleBorrow}
                onRepay={handleRepay}
                onWithdraw={handleWithdraw}
                onReinvest={handleReinvest}
                onApplyRepayPreset={applyRepayPreset}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <PositionBalanceCard
                  market={selectedMarket}
                  position={position}
                  metrics={metrics}
                  positionLoading={positionLoading || (!positionHydrated && Boolean(wallet?.address && selectedMarketId))}
                  balancesLoading={balancesLoading}
                  getBalance={getBalance}
                  onRefresh={() => {
                    void Promise.all([refreshBalances(), refreshPosition()]);
                  }}
                />

                <EstimateCalculatorCard
                  market={selectedMarket}
                  position={position}
                  loanRepayment={loanRepayment}
                  initialSimulatedBorrowAmount={borrowAmount}
                />
              </div>

              {wallet && (
                <BorrowerActivityCard
                  isLoading={positionLoading || (!positionHydrated && Boolean(wallet?.address && selectedMarketId))}
                  events={events}
                />
              )}
            </TabsContent>

            <TabsContent value="general-info">
                <TokenHolderBenefits
                  selectedMarketName={selectedMarket.name}
                  explorerUrl={config?.explorerUrl}
                  walletBalance={getBalance(selectedMarket.collateralCurrency, selectedMarket.collateralAssetId)}
                  collateralDeposited={position?.collateralAmount ?? 0}
                />
            </TabsContent>
          </Tabs>
        )}

        {config.explorerUrl && wallet?.address && (
          <div className="text-center">
            <a
              href={getChainExplorerLink('address', wallet.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View wallet on Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
