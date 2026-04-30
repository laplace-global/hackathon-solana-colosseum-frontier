'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const [depositAmount, setDepositAmount] = useState('100');
  const [borrowAmount, setBorrowAmount] = useState('50');
  const [repayAmount, setRepayAmount] = useState('0');
  const [repayKind, setRepayKind] = useState<RepayKind>('regular');
  const [withdrawAmount, setWithdrawAmount] = useState('100');

  const selectedMarket = useMemo(
    () => config?.markets.find((market) => market.id === selectedMarketId) ?? null,
    [config?.markets, selectedMarketId]
  );

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
          const sailMarket = markets.find((market) => {
            const nameHasSail = market.name.toUpperCase().includes('SAIL');
            const collateralIsSail = getAssetSymbol(market.collateralCurrency).toUpperCase() === 'SAIL';
            const debtIsSail = getAssetSymbol(market.debtCurrency).toUpperCase() === 'SAIL';
            return nameHasSail || collateralIsSail || debtIsSail;
          });
          setSelectedMarketId((sailMarket ?? markets[0]).id);
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
  }, [withNetworkLoading]);

  useEffect(() => {
    if (!wallet?.address) return;
    refreshBalances();
    if (selectedMarketId) {
      refreshPosition();
    }
  }, [refreshBalances, refreshPosition, selectedMarketId, wallet?.address]);

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
      await Promise.all([refreshBalances(), refreshPosition()]);
    });
  }, [
    depositAmount,
    refreshBalances,
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
      await Promise.all([refreshBalances(), refreshPosition()]);
    });
  }, [borrowAmount, metrics, refreshBalances, refreshPosition, selectedMarket, wallet, withAction, withNetworkLoading]);

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
      await Promise.all([refreshBalances(), refreshPosition()]);
    });
  }, [
    refreshBalances,
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
      await Promise.all([refreshBalances(), refreshPosition()]);
    });
  }, [refreshBalances, refreshPosition, selectedMarket, wallet, withdrawAmount, withAction, withNetworkLoading]);

  if (configError) {
    return (
      <div className="min-h-screen bg-background pt-24">
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
      <div className="flex min-h-screen items-center justify-center bg-background pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pt-24">
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
              <MarketActionsCard
                market={selectedMarket}
                walletConnected={Boolean(wallet)}
                loading={loading}
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
                onDeposit={handleDeposit}
                onBorrow={handleBorrow}
                onRepay={handleRepay}
                onWithdraw={handleWithdraw}
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
