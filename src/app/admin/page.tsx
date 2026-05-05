'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getAssetSymbol } from '@/lib/assets/asset-symbols';
import {
  createLocalAccount,
  restoreLocalAccount,
} from '@/lib/chain/client';
import {
  clearLocalAccountSecret,
  clearLocalConnection,
  loadLocalAccountSecret,
  saveLocalAccountSecret,
} from '@/lib/chain/storage';
import type { AssetBalance, LocalAccount } from '@/lib/chain/types';
import { useWallet } from '@/contexts/wallet-context';
import { useMarketPrices } from '@/contexts/market-prices-context';
import { LocalWalletCard } from './components/local-wallet-card';
import {
  MarketLiquidityManagementCard,
  type AdminMarket,
} from './components/market-liquidity-management-card';
import { WalletBalancesCard } from './components/wallet-balances-card';
import { WalletToolsGrid } from './components/wallet-tools-grid';

const TOKEN_LIST = ['SAIL', 'NYRA', 'USDC'] as const;
type TokenCode = (typeof TOKEN_LIST)[number];

function formatPriceDraft(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  return String(value);
}

function parsePriceDraft(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export default function AdminPage() {
  const {
    disconnect,
    connectLocalWallet,
    assetStatusByToken,
    hasAssetByToken,
    refreshAssetStatuses,
  } = useWallet();
  const { refreshPrices } = useMarketPrices();
  const [wallet, setWallet] = useState<LocalAccount | null>(null);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState<string>('');
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [manualLiquidityPoolId, setManualLiquidityPoolId] = useState('');
  const [manualPositionTokenAssetId, setManualPositionTokenAssetId] = useState('');
  const [manualCollateralPriceUsd, setManualCollateralPriceUsd] = useState('');
  const [manualDebtPriceUsd, setManualDebtPriceUsd] = useState('');
  const [assetProvisioning, setAssetProvisioning] = useState<Record<TokenCode, boolean>>({
    SAIL: false,
    NYRA: false,
    USDC: false,
  });

  const assetIdByToken = useMemo(() => {
    const mapping: Record<TokenCode, string | null> = {
      SAIL: null,
      NYRA: null,
      USDC: null,
    };

    for (const market of markets) {
      const collateralSymbol = getAssetSymbol(market.collateralCurrency) as TokenCode;
      const debtSymbol = getAssetSymbol(market.debtCurrency) as TokenCode;

      if (collateralSymbol in mapping) {
        mapping[collateralSymbol] = market.collateralAssetId;
      }
      if (debtSymbol in mapping) {
        mapping[debtSymbol] = market.debtAssetId;
      }
    }

    return mapping;
  }, [markets]);

  const refreshBalances = useCallback(async (address: string) => {
    const response = await fetch(`/api/balances?address=${address}`);
    const payload = await response.json();
    if (payload.success) {
      setBalances(payload.balances);
    }
  }, []);

  const getBalance = useCallback(
    (symbol: TokenCode | 'SOL') => {
      const item = balances.find((entry) => entry.symbol === symbol);
      const value = Number(item?.displayAmount ?? '0');
      return Number.isFinite(value) ? value : 0;
    },
    [balances]
  );

  const refreshMarkets = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading('refresh-markets');
    }

    try {
      const response = await fetch('/api/admin/markets');
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to load markets');
      }

      const nextMarkets: AdminMarket[] = payload.markets as AdminMarket[];
      setMarkets(nextMarkets);
      setSelectedMarketId((current) => {
        if (!current) return current;
        const exists = nextMarkets.some((market) => market.id === current);
        return exists ? current : null;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh markets');
    } finally {
      if (!silent) {
        setLoading('');
      }
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const secret = loadLocalAccountSecret();
        if (secret) {
          const restored = restoreLocalAccount(secret);
          setWallet(restored);
          await connectLocalWallet();
        }

        await refreshMarkets({ silent: true });
      } catch (error) {
        console.error('Admin init error:', error);
      }
    }

    init();
  }, [connectLocalWallet, refreshMarkets]);

  const copyAddress = useCallback(() => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address);
    toast.success('Wallet address copied');
  }, [wallet]);

  const copyText = useCallback((value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }, []);

  const handleGenerateWallet = useCallback(async () => {
    setLoading('generate');
    try {
      await disconnect();
      const nextWallet = createLocalAccount();
      saveLocalAccountSecret(nextWallet.secret);
      setWallet(nextWallet);
      setAssetProvisioning({ SAIL: true, NYRA: true, USDC: true });

      const response = await fetch('/api/admin/sol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: nextWallet.address,
          amount: '0.05',
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to fund local wallet with SOL');
      }

      await connectLocalWallet();
      setAssetProvisioning({ SAIL: false, NYRA: false, USDC: false });
      toast.success('New local wallet generated and funded with SOL on devnet.');
    } catch (error) {
      setAssetProvisioning({ SAIL: false, NYRA: false, USDC: false });
      toast.error(error instanceof Error ? error.message : 'Failed to generate wallet');
    } finally {
      setLoading('');
    }
  }, [connectLocalWallet, disconnect]);

  const handleClearLocalWallet = useCallback(async () => {
    setLoading('clear-local-wallet');

    try {
      clearLocalAccountSecret();
      clearLocalConnection();
      await disconnect();

      setWallet(null);
      setBalances([]);
      setAssetProvisioning({ SAIL: false, NYRA: false, USDC: false });
      toast.success('Local wallet and wallet connection state cleared');
    } catch {
      setWallet(null);
      setBalances([]);
      setAssetProvisioning({ SAIL: false, NYRA: false, USDC: false });
      toast.error('Failed to fully disconnect active session, but local wallet metadata was cleared');
    } finally {
      setLoading('');
    }
  }, [disconnect]);

  const handleRequestSolAirdrop = useCallback(async () => {
    if (!wallet) {
      toast.error('Generate or restore a local wallet first');
      return;
    }

    setLoading('airdrop-sol');
    try {
      const response = await fetch('/api/admin/sol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: wallet.address,
          amount: '0.1',
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to send SOL');
      }

      await refreshBalances(wallet.address);
      toast.success('Requested 1 SOL on devnet');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request SOL airdrop');
    } finally {
      setLoading('');
    }
  }, [refreshBalances, wallet]);

  const handleRequestTokenFaucet = useCallback(async (token: TokenCode) => {
    if (!wallet) {
      toast.error('Generate or restore a local wallet first');
      return;
    }

    setLoading(`faucet-${token}`);
    setAssetProvisioning((current) => ({ ...current, [token]: true }));
    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: wallet.address,
          token,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Failed to request ${token} faucet`);
      }

      await refreshBalances(wallet.address);
      await refreshAssetStatuses();
      toast.success(`Sent ${payload.amount} ${token} to the local wallet`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to request ${token} faucet`);
    } finally {
      setAssetProvisioning((current) => ({ ...current, [token]: false }));
      setLoading('');
    }
  }, [refreshAssetStatuses, refreshBalances, wallet]);

  const handleSaveMarketReferences = useCallback(async (marketId: string) => {
    const liquidityPoolId = manualLiquidityPoolId.trim();
    const positionTokenAssetId = manualPositionTokenAssetId.trim();

    if (Boolean(liquidityPoolId) !== Boolean(positionTokenAssetId)) {
      toast.error('Supply reference ID と Position token reference ID は両方入力するか、両方空にしてください');
      return;
    }

    setLoading(`save-market-references-${marketId}`);
    try {
      const response = await fetch(`/api/admin/markets/${marketId}/liquidity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liquidityPoolId,
          positionTokenAssetId,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to save market references');
      }

      toast.success(
        liquidityPoolId && positionTokenAssetId
          ? 'Market references updated'
          : 'Market references cleared'
      );
      await refreshMarkets({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save market references');
    } finally {
      setLoading('');
    }
  }, [manualPositionTokenAssetId, manualLiquidityPoolId, refreshMarkets]);

  const handleToggleStatus = useCallback(async (marketId: string, currentStatus: boolean) => {
    setLoading(`toggle-status-${marketId}`);
    try {
      const response = await fetch(`/api/admin/markets/${marketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to update market status');
      }

      toast.success(`Market ${currentStatus ? 'deactivated' : 'activated'}`);
      await refreshMarkets({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update market status');
    } finally {
      setLoading('');
    }
  }, [refreshMarkets]);

  const handleSavePrices = useCallback(async (marketId: string) => {
    const collateralPriceUsd = parsePriceDraft(manualCollateralPriceUsd);
    const debtPriceUsd = parsePriceDraft(manualDebtPriceUsd);

    if (collateralPriceUsd === null || debtPriceUsd === null) {
      toast.error('Prices must be zero or positive numbers');
      return;
    }

    setLoading(`save-market-prices-${marketId}`);
    try {
      const response = await fetch('/api/lending/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          collateralPriceUsd,
          debtPriceUsd,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || payload.error || 'Failed to save prices');
      }

      setManualCollateralPriceUsd(formatPriceDraft(payload.data?.collateralPriceUsd));
      setManualDebtPriceUsd(formatPriceDraft(payload.data?.debtPriceUsd));
      toast.success('Market prices updated');
      await Promise.all([refreshMarkets({ silent: true }), refreshPrices()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save prices');
    } finally {
      setLoading('');
    }
  }, [manualCollateralPriceUsd, manualDebtPriceUsd, refreshMarkets, refreshPrices]);

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <p className="text-eyebrow text-primary mb-3">Operations</p>
          <h1 className="font-serif text-3xl font-light text-foreground md:text-4xl">Admin Wallet Tools</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This page is for local Solana devnet setup. The local account secret is persisted in localStorage.
          </p>
        </div>

        <LocalWalletCard
          wallet={wallet}
          loading={loading}
          onCopyAddress={copyAddress}
          onClearLocalWallet={() => void handleClearLocalWallet()}
        />

        <WalletToolsGrid
          tokenList={TOKEN_LIST}
          walletAddress={wallet?.address ?? null}
          assetIdByToken={assetIdByToken}
          assetProvisioning={assetProvisioning}
          assetStatusByToken={assetStatusByToken as Record<string, string | undefined>}
          hasAssetByToken={hasAssetByToken as Record<string, boolean | undefined>}
          loading={loading}
          onGenerateWallet={() => void handleGenerateWallet()}
          onRequestSolAirdrop={() => void handleRequestSolAirdrop()}
          onRequestTokenFaucet={(token) => void handleRequestTokenFaucet(token as TokenCode)}
        />

        <WalletBalancesCard
          walletConnected={Boolean(wallet)}
          nativeAssetSymbol="SOL"
          tokenList={TOKEN_LIST}
          getBalance={getBalance as (symbol: string) => number}
        />

        <MarketLiquidityManagementCard
          markets={markets}
          selectedMarketId={selectedMarketId}
          manualLiquidityPoolId={manualLiquidityPoolId}
          manualPositionTokenAssetId={manualPositionTokenAssetId}
          manualCollateralPriceUsd={manualCollateralPriceUsd}
          manualDebtPriceUsd={manualDebtPriceUsd}
          loading={loading}
          onRefresh={() => void refreshMarkets()}
          onSelectMarket={(market) => {
            setSelectedMarketId(market.id);
            setManualLiquidityPoolId(market.liquidityPoolId ?? '');
            setManualPositionTokenAssetId(market.positionTokenAssetId ?? '');
            setManualCollateralPriceUsd(formatPriceDraft(market.prices?.collateralPriceUsd));
            setManualDebtPriceUsd(formatPriceDraft(market.prices?.debtPriceUsd));
          }}
          onDeselectMarket={() => setSelectedMarketId(null)}
          onSetManualLiquidityPoolId={setManualLiquidityPoolId}
          onSetManualPositionTokenAssetId={setManualPositionTokenAssetId}
          onSetManualCollateralPriceUsd={setManualCollateralPriceUsd}
          onSetManualDebtPriceUsd={setManualDebtPriceUsd}
          onToggleStatus={(marketId, currentStatus) => void handleToggleStatus(marketId, currentStatus)}
          onSaveReferences={(marketId) => void handleSaveMarketReferences(marketId)}
          onSavePrices={(marketId) => void handleSavePrices(marketId)}
          onCopyText={copyText}
        />
      </div>
    </div>
  );
}
