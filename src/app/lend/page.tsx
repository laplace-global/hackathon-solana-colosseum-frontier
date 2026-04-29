'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { InstitutionalUnderwriting } from './components/institutional-underwriting';
import { LendMarketActionsCard } from './components/lend-market-actions-card';
import { LendPositionBalanceCard } from './components/lend-position-balance-card';
import { SupplierActivityCard } from './components/supplier-activity-card';
import { YieldEstimatorCard } from './components/yield-estimator-card';
import type {
  LendingConfig,
  MarketConfig,
  PoolMetrics,
  SupplierEvent,
  SupplyPosition,
  SupplyPositionMetrics,
} from './types';

import { getChainExplorerLink, restoreLocalAccount } from '@/lib/chain/client';
import { loadLocalAccountSecret } from '@/lib/chain/storage';
import type { LocalAccount } from '@/lib/chain/types';
import { getAssetSymbol, normalizeAssetId } from '@/lib/assets/asset-symbols';

function formatAmount(value: number, decimals = 2): string {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: decimals }) : '0';
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function normalizeShares(rawShares: string, scale: number): number {
  const parsed = Number(rawShares);
  if (!Number.isFinite(parsed)) return 0;
  const divisor = Math.pow(10, Math.max(0, scale));
  if (!Number.isFinite(divisor) || divisor <= 0) return parsed;
  return parsed / divisor;
}

export default function LenderPage() {
  const [config, setConfig] = useState<LendingConfig | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [wallet, setWallet] = useState<LocalAccount | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [walletReadyChecked, setWalletReadyChecked] = useState(false);
  const [pool, setPool] = useState<PoolMetrics | null>(null);
  const [position, setPosition] = useState<SupplyPosition | null>(null);
  const [positionMetrics, setPositionMetrics] = useState<SupplyPositionMetrics | null>(null);
  const [shareBalance, setShareBalance] = useState('0');
  const [walletBalance, setWalletBalance] = useState(0);
  const [events, setEvents] = useState<SupplierEvent[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [positionLoading, setPositionLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [poolHydrated, setPoolHydrated] = useState(false);
  const [positionHydrated, setPositionHydrated] = useState(false);
  const [eventsHydrated, setEventsHydrated] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [networkPendingCount, setNetworkPendingCount] = useState(0);

  const [supplyAmount, setSupplyAmount] = useState('1000');
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
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

  const selectedMarket = useMemo(
    () => config?.markets.find((market) => market.id === selectedMarketId) ?? null,
    [config?.markets, selectedMarketId]
  );

  const refreshPool = useCallback(async () => {
    if (!selectedMarketId) {
      setPoolHydrated(true);
      return;
    }
    setPoolLoading(true);
    setPoolHydrated(false);
    try {
      const response = await withNetworkLoading(() => fetch(`/api/lending/markets/${selectedMarketId}`));
      const payload = await response.json();
      if (payload.success) {
        setPool(payload.data.pool);
      }
    } finally {
      setPoolLoading(false);
      setPoolHydrated(true);
    }
  }, [selectedMarketId, withNetworkLoading]);

  const refreshPosition = useCallback(async () => {
    if (!selectedMarketId || !wallet?.address) {
      setPosition(null);
      setPositionMetrics(null);
      setShareBalance('0');
      setWalletBalance(0);
      setPositionLoading(false);
      setPositionHydrated(true);
      return;
    }

    setPositionLoading(true);
    setPositionHydrated(false);
    try {
      try {
        const response = await withNetworkLoading(() => fetch(`/api/balances?address=${wallet.address}`));
        const payload = await response.json();
        const balances = Array.isArray(payload.balances)
          ? (payload.balances as Array<{ currency?: string; value?: string; assetId?: string; issuer?: string }>)
          : [];
        const marketCurrency = normalizeAssetId(selectedMarket?.debtCurrency ?? '');
        const walletTokenBalance = balances.find((tokenBalance) => {
          const sameCurrency = normalizeAssetId(tokenBalance.currency ?? '') === marketCurrency;
          const sameAssetId =
            !selectedMarket?.debtAssetId ||
            (tokenBalance.assetId ?? tokenBalance.issuer) === selectedMarket.debtAssetId;
          return sameCurrency && sameAssetId;
        });

        const parsedWalletBalance = Number(walletTokenBalance?.value ?? '0');
        setWalletBalance(Number.isFinite(parsedWalletBalance) ? parsedWalletBalance : 0);
      } catch {
        setWalletBalance(0);
      }

      const response = await withNetworkLoading(() =>
        fetch(`/api/lending/markets/${selectedMarketId}/supply-positions/${wallet.address}`)
      );
      const payload = await response.json();

      if (response.status === 404 || payload.error?.code === 'SUPPLY_POSITION_NOT_FOUND') {
        setPosition(null);
        setPositionMetrics(null);
        setShareBalance('0');
        return;
      }

      if (payload.success) {
        setPosition(payload.data.position);
        setPositionMetrics(payload.data.metrics);
        setShareBalance(String(payload.data.position?.supplyAmount ?? 0));
      }
    } finally {
      setPositionLoading(false);
      setPositionHydrated(true);
    }
  }, [
    selectedMarket?.debtCurrency,
    selectedMarket?.debtAssetId,
    selectedMarketId,
    wallet?.address,
    withNetworkLoading,
  ]);

  const refreshEvents = useCallback(async () => {
    if (!wallet?.address || !selectedMarketId) {
      setEvents([]);
      setEventsLoading(false);
      setEventsHydrated(true);
      return;
    }

    setEventsLoading(true);
    setEventsHydrated(false);
    try {
      const response = await withNetworkLoading(() =>
        fetch(`/api/lending/lenders/${wallet.address}/supply-positions?marketId=${selectedMarketId}`)
      );
      const payload = await response.json();
      if (payload.success) {
        setEvents(payload.data.events ?? []);
      }
    } finally {
      setEventsLoading(false);
      setEventsHydrated(true);
    }
  }, [selectedMarketId, wallet?.address, withNetworkLoading]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([refreshPool(), refreshPosition(), refreshEvents()]);
  }, [refreshEvents, refreshPool, refreshPosition]);

  useEffect(() => {
    async function loadConfig() {
      setPageLoading(true);
      try {
        const response = await withNetworkLoading(() => fetch('/api/lending/config'));
        const payload = await response.json();
        if (!payload.success) {
          setErrorMessage(payload.error?.message ?? 'Failed to load lending config');
          return;
        }

        setConfig(payload.data);
        const markets = payload.data.markets as MarketConfig[];
        const sailMarket = markets.find((market) => {
          const nameHasSail = market.name.toUpperCase().includes('SAIL');
          const debtIsSail = getAssetSymbol(market.debtCurrency).toUpperCase() === 'SAIL';
          return nameHasSail || debtIsSail;
        });
        const firstMarket = sailMarket ?? markets[0];
        if (firstMarket) {
          setSelectedMarketId(firstMarket.id);
        }

        const storedSecret = loadLocalAccountSecret();
        if (storedSecret) {
          setWallet(restoreLocalAccount(storedSecret));
        }
      } catch {
        setErrorMessage('Failed to connect to lending API');
      } finally {
        setPageLoading(false);
      }
    }

    loadConfig();
  }, [withNetworkLoading]);

  useEffect(() => {
    if (!selectedMarketId) return;
    refreshPool();
  }, [selectedMarketId, refreshPool]);

  useEffect(() => {
    setWalletReady(Boolean(wallet));
    setWalletReadyChecked(true);
  }, [wallet]);

  useEffect(() => {
    if (!walletReady || !wallet?.address || !selectedMarketId) return;
    refreshDashboard();
  }, [refreshDashboard, selectedMarketId, wallet?.address, walletReady]);

  const handleSupply = useCallback(async () => {
    if (!wallet || !walletReady || !selectedMarket) return;

    const amount = Number(supplyAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Supply amount must be positive');
      return;
    }
    if (amount < selectedMarket.minSupplyAmount) {
      toast.error(`Minimum supply is ${selectedMarket.minSupplyAmount} ${getAssetSymbol(selectedMarket.debtCurrency)}`);
      return;
    }

    setLoadingAction('supply');
    try {
      const response = await withNetworkLoading(() =>
        fetch(`/api/lending/markets/${selectedMarket.id}/supply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderAddress: wallet.address,
            amount,
            accountSecret: wallet.secret,
          }),
        })
      );

      const payload = await response.json();
      if (!payload.success) {
        toast.error(payload.error?.message ?? 'Supply registration failed');
        return;
      }

      toast.success(`Supplied ${payload.data.suppliedAmount} ${getAssetSymbol(selectedMarket.debtCurrency)}`);
      await refreshDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Supply failed');
    } finally {
      setLoadingAction('');
    }
  }, [
    refreshDashboard,
    selectedMarket,
    supplyAmount,
    wallet,
    walletReady,
    withNetworkLoading,
  ]);

  const handleWithdrawSupply = useCallback(async () => {
    if (!wallet || !walletReady || !selectedMarket) return;

    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Withdraw amount must be positive');
      return;
    }

    setLoadingAction('withdraw-supply');
    try {
      const response = await withNetworkLoading(() =>
        fetch(`/api/lending/markets/${selectedMarket.id}/withdraw-supply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: wallet.address,
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

      toast.success(`Withdrawn ${payload.data.withdrawnAmount} ${getAssetSymbol(selectedMarket.debtCurrency)}`);
      await refreshDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Withdraw failed');
    } finally {
      setLoadingAction('');
    }
  }, [refreshDashboard, selectedMarket, wallet, walletReady, withdrawAmount, withNetworkLoading]);

  const handleWithdrawAll = useCallback(async () => {
    if (!wallet || !walletReady || !selectedMarket) return;
    if (!position || position.supplyAmount <= 0) {
      toast.error('No active supplied position to withdraw');
      return;
    }

    setLoadingAction('withdraw-all');
    try {
      const response = await withNetworkLoading(() =>
        fetch(`/api/lending/markets/${selectedMarket.id}/withdraw-supply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: wallet.address,
            amount: position.supplyAmount,
            accountSecret: wallet.secret,
          }),
        })
      );
      const payload = await response.json();

      if (!payload.success) {
        toast.error(payload.error?.message ?? 'Full withdraw failed');
        return;
      }

      toast.success(`Withdrawn full position (${payload.data.withdrawnAmount} ${getAssetSymbol(selectedMarket.debtCurrency)})`);
      await refreshDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Full withdraw failed');
    } finally {
      setLoadingAction('');
    }
  }, [position, refreshDashboard, selectedMarket, wallet, walletReady, withNetworkLoading]);

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Card className="rounded-none border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Lender dashboard unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">{errorMessage}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden">
        <div
          className={`h-full bg-primary transition-opacity duration-150 ${showGlobalLoading ? 'animate-pulse opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="border border-border bg-card p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-eyebrow text-primary mb-3">Liquidity</p>
              <h1 className="font-serif text-4xl font-light text-foreground md:text-5xl">Lender Dashboard</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Supply {selectedMarket ? getAssetSymbol(selectedMarket.debtCurrency) : 'debt asset'} liquidity through on-chain pools.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedMarketId}
                onChange={(event) => setSelectedMarketId(event.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground sm:w-72"
              >
                {config?.markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name} ({getAssetSymbol(market.debtCurrency)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="market-action" className="space-y-6">
          <TabsList>
            <TabsTrigger value="market-action">Market Action</TabsTrigger>
            <TabsTrigger value="general-info">General Info</TabsTrigger>
          </TabsList>

          <TabsContent value="market-action" className="space-y-6">
            {selectedMarket ? (
              <>
                <LendMarketActionsCard
                  market={selectedMarket}
                  pool={pool}
                  position={position}
                  positionMetrics={positionMetrics}
                  isLoading={poolLoading || (!poolHydrated && Boolean(selectedMarketId))}
                  walletReady={walletReady}
                  walletReadyChecked={walletReadyChecked}
                  loadingAction={loadingAction}
                  supplyAmount={supplyAmount}
                  setSupplyAmount={setSupplyAmount}
                  withdrawAmount={withdrawAmount}
                  setWithdrawAmount={setWithdrawAmount}
                  formatAmount={formatAmount}
                  formatPercent={formatPercent}
                  onSupply={handleSupply}
                  onWithdrawSupply={handleWithdrawSupply}
                  onWithdrawAll={handleWithdrawAll}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <LendPositionBalanceCard
                    market={selectedMarket}
                    position={position}
                    positionMetrics={positionMetrics}
                    totalSupplied={pool?.totalSupplied ?? 0}
                    walletBalance={walletBalance}
                    shareBalance={shareBalance}
                    isLoading={
                      positionLoading || (!positionHydrated && walletReady && Boolean(wallet?.address && selectedMarketId))
                    }
                    walletReady={walletReady}
                    walletReadyChecked={walletReadyChecked}
                    formatAmount={formatAmount}
                    normalizeShares={normalizeShares}
                  />

                  <YieldEstimatorCard
                    market={selectedMarket}
                    pool={pool}
                    position={position}
                    positionMetrics={positionMetrics}
                    isLoading={
                      poolLoading || positionLoading || (!poolHydrated && Boolean(selectedMarketId)) ||
                      (!positionHydrated && walletReady && Boolean(wallet?.address && selectedMarketId))
                    }
                    formatAmount={formatAmount}
                    formatPercent={formatPercent}
                  />
                </div>

                <SupplierActivityCard
                  isLoading={eventsLoading || (!eventsHydrated && walletReady && Boolean(wallet?.address && selectedMarketId))}
                  events={events}
                />
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="general-info">
            <InstitutionalUnderwriting
              selectedMarketName={selectedMarket?.name}
              selectedMarketId={selectedMarket?.id}
              collateralCurrency={selectedMarket?.collateralCurrency}
            />
          </TabsContent>
        </Tabs>

        {config?.explorerUrl && wallet?.address && (
          <div className="pb-6 text-center">
            <a
              href={getChainExplorerLink('address', wallet.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View wallet on explorer
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
