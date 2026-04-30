'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearLocalConnection,
  loadLocalAccountSecret,
  loadLocalConnection,
  saveLocalConnection,
} from '@/lib/chain/storage';
import { getAssetAvailability, restoreLocalAccount } from '@/lib/chain/client';
import { getAssetDefinitionBySymbol } from '@/lib/chain/config';
import type { AssetBalance, AssetDefinition } from '@/lib/chain/types';

export type ConnectionType = 'disconnected' | 'local';
export type AppToken = 'RLUSD' | 'SAIL' | 'NYRA';
type AssetStatus = 'idle' | 'checking' | 'ready' | 'missing' | 'error';

const APP_TOKENS: AppToken[] = ['RLUSD', 'SAIL', 'NYRA'];

function createDefaultAssetStatus(): Record<AppToken, AssetStatus> {
  return {
    RLUSD: 'idle',
    SAIL: 'idle',
    NYRA: 'idle',
  };
}

function createDefaultAssetAvailability(): Record<AppToken, boolean> {
  return {
    RLUSD: false,
    SAIL: false,
    NYRA: false,
  };
}

function toStatusMap(flags: Record<AppToken, boolean>): Record<AppToken, AssetStatus> {
  return {
    RLUSD: flags.RLUSD ? 'ready' : 'missing',
    SAIL: flags.SAIL ? 'ready' : 'missing',
    NYRA: flags.NYRA ? 'ready' : 'missing',
  };
}

interface WalletContextType {
  connectionType: ConnectionType;
  address: string | null;
  balances: AssetBalance[];
  rlusdBalance: number;
  isConnecting: boolean;
  isRefreshing: boolean;
  assetStatus: AssetStatus;
  hasRlusdAsset: boolean;
  assetStatusByToken: Record<AppToken, AssetStatus>;
  hasAssetByToken: Record<AppToken, boolean>;
  error: string | null;
  isLocalWalletAvailable: boolean;
  connectLocalWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<WalletRefreshSnapshot | null>;
  refreshAssetStatus: () => Promise<boolean>;
  refreshAssetStatuses: () => Promise<Record<AppToken, boolean>>;
}

interface WalletRefreshSnapshot {
  balances: AssetBalance[];
  rlusdBalance: number;
  hasRlusdAsset: boolean;
  hasAssetByToken: Record<AppToken, boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function parseRlusdBalance(balances: AssetBalance[]): number {
  const line = balances.find((entry) => entry.symbol === 'RLUSD');
  if (!line) return 0;

  const value = Number(line.displayAmount);
  return Number.isFinite(value) ? value : 0;
}

function selectTrackedAssets(assetDefinitions: AssetDefinition[]): AssetDefinition[] {
  return APP_TOKENS.map((token) => getAssetDefinitionBySymbol(assetDefinitions, token)).filter(
    (asset): asset is AssetDefinition => Boolean(asset)
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connectionType, setConnectionType] = useState<ConnectionType>('disconnected');
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [rlusdBalance, setRlusdBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assetStatusByToken, setAssetStatusByToken] = useState<Record<AppToken, AssetStatus>>(
    createDefaultAssetStatus
  );
  const [hasAssetByToken, setHasAssetByToken] = useState<Record<AppToken, boolean>>(
    createDefaultAssetAvailability
  );
  const [error, setError] = useState<string | null>(null);
  const [isLocalWalletAvailable, setIsLocalWalletAvailable] = useState(false);
  const [assetDefinitions, setAssetDefinitions] = useState<AssetDefinition[]>([]);

  const updateLocalWalletAvailability = useCallback(() => {
    setIsLocalWalletAvailable(Boolean(loadLocalAccountSecret()));
  }, []);

  const refreshAssetDefinitions = useCallback(async () => {
    try {
      const response = await fetch('/api/lending/config');
      const payload = await response.json();
      if (payload.success && Array.isArray(payload.data?.assetDefinitions)) {
        setAssetDefinitions(payload.data.assetDefinitions as AssetDefinition[]);
      }
    } catch {
      // Keep current definitions and allow balance-only hydration.
    }
  }, []);

  const refreshAssetAvailabilityForAddress = useCallback(
    async (nextAddress: string): Promise<Record<AppToken, boolean>> => {
      const trackedAssets = selectTrackedAssets(assetDefinitions);
      if (trackedAssets.length === 0) {
        setAssetStatusByToken(createDefaultAssetStatus());
        setHasAssetByToken(createDefaultAssetAvailability());
        return createDefaultAssetAvailability();
      }

      setAssetStatusByToken((prev) => {
        const next = { ...prev };
        for (const token of APP_TOKENS) {
          next[token] = 'checking';
        }
        return next;
      });

      try {
        const availability = await getAssetAvailability(nextAddress, trackedAssets);
        const nextFlags: Record<AppToken, boolean> = {
          RLUSD: Boolean(availability.RLUSD),
          SAIL: Boolean(availability.SAIL),
          NYRA: Boolean(availability.NYRA),
        };
        setHasAssetByToken(nextFlags);
        setAssetStatusByToken(toStatusMap(nextFlags));
        return nextFlags;
      } catch {
        setHasAssetByToken(createDefaultAssetAvailability());
        setAssetStatusByToken({
          RLUSD: 'error',
          SAIL: 'error',
          NYRA: 'error',
        });
        return createDefaultAssetAvailability();
      }
    },
    [assetDefinitions]
  );

  const refreshBalancesForAddress = useCallback(
    async (
      nextAddress: string,
      options?: {
        skipAssetRefresh?: boolean;
      }
    ): Promise<WalletRefreshSnapshot | null> => {
      setIsRefreshing(true);
      setError(null);

      try {
        const nextBalancesPromise = fetch(`/api/balances?address=${encodeURIComponent(nextAddress)}`).then(
          async (response) => {
            const payload = await response.json();
            if (!response.ok || !payload.success || !Array.isArray(payload.balances)) {
              throw new Error(payload.error ?? 'Failed to load balances');
            }
            return payload.balances as AssetBalance[];
          }
        );
        const assetAvailabilityPromise = options?.skipAssetRefresh
          ? Promise.resolve(hasAssetByToken)
          : refreshAssetAvailabilityForAddress(nextAddress);

        const [nextBalances, assetAvailability] = await Promise.all([
          nextBalancesPromise,
          assetAvailabilityPromise,
        ]);

        if (options?.skipAssetRefresh) {
          const normalizedFlags: Record<AppToken, boolean> = {
            RLUSD: Boolean(assetAvailability.RLUSD),
            SAIL: Boolean(assetAvailability.SAIL),
            NYRA: Boolean(assetAvailability.NYRA),
          };
          setHasAssetByToken(normalizedFlags);
          setAssetStatusByToken(toStatusMap(normalizedFlags));
        }

        const nextRlusdBalance = parseRlusdBalance(nextBalances);
        setBalances(nextBalances);
        setRlusdBalance(nextRlusdBalance);

        return {
          balances: nextBalances,
          rlusdBalance: nextRlusdBalance,
          hasRlusdAsset: assetAvailability.RLUSD,
          hasAssetByToken: assetAvailability,
        };
      } catch {
        setError('Failed to refresh wallet balances. Please try again.');
        setBalances([]);
        setRlusdBalance(0);
        setHasAssetByToken(createDefaultAssetAvailability());
        setAssetStatusByToken({
          RLUSD: 'error',
          SAIL: 'error',
          NYRA: 'error',
        });
        return null;
      } finally {
        setIsRefreshing(false);
      }
    },
    [hasAssetByToken, refreshAssetAvailabilityForAddress]
  );

  const resetDisconnectedState = useCallback(() => {
    setConnectionType('disconnected');
    setAddress(null);
    setBalances([]);
    setRlusdBalance(0);
    setHasAssetByToken(createDefaultAssetAvailability());
    setAssetStatusByToken(createDefaultAssetStatus());
    setError(null);
  }, []);

  const disconnect = useCallback(async () => {
    clearLocalConnection();
    resetDisconnectedState();
    updateLocalWalletAvailability();
  }, [resetDisconnectedState, updateLocalWalletAvailability]);

  const connectLocalWallet = useCallback(async () => {
    if (isConnecting) return;

    const secret = loadLocalAccountSecret();
    if (!secret) {
      setError('No local dev wallet found. Generate one from the Admin page first.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const localWallet = restoreLocalAccount(secret);
      setConnectionType('local');
      setAddress(localWallet.address);
      saveLocalConnection('local');
      await refreshBalancesForAddress(localWallet.address);
    } catch {
      clearLocalConnection();
      setError('Failed to connect local wallet.');
      resetDisconnectedState();
    } finally {
      setIsConnecting(false);
      updateLocalWalletAvailability();
    }
  }, [isConnecting, refreshBalancesForAddress, resetDisconnectedState, updateLocalWalletAvailability]);

  const refreshBalances = useCallback(async (): Promise<WalletRefreshSnapshot | null> => {
    if (!address) return null;
    return refreshBalancesForAddress(address);
  }, [address, refreshBalancesForAddress]);

  const refreshAssetStatus = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setAssetStatusByToken(createDefaultAssetStatus());
      setHasAssetByToken(createDefaultAssetAvailability());
      return false;
    }

    const flags = await refreshAssetAvailabilityForAddress(address);
    return flags.RLUSD;
  }, [address, refreshAssetAvailabilityForAddress]);

  const refreshAssetStatuses = useCallback(async (): Promise<Record<AppToken, boolean>> => {
    if (!address) {
      setAssetStatusByToken(createDefaultAssetStatus());
      setHasAssetByToken(createDefaultAssetAvailability());
      return createDefaultAssetAvailability();
    }

    return refreshAssetAvailabilityForAddress(address);
  }, [address, refreshAssetAvailabilityForAddress]);

  useEffect(() => {
    updateLocalWalletAvailability();
    void refreshAssetDefinitions();

    const onStorageChanged = () => {
      updateLocalWalletAvailability();
    };

    window.addEventListener('storage', onStorageChanged);
    window.addEventListener('local-account-storage-changed', onStorageChanged);

    return () => {
      window.removeEventListener('storage', onStorageChanged);
      window.removeEventListener('local-account-storage-changed', onStorageChanged);
    };
  }, [refreshAssetDefinitions, updateLocalWalletAvailability]);

  useEffect(() => {
    if (!address) {
      setRlusdBalance(0);
      setHasAssetByToken(createDefaultAssetAvailability());
      setAssetStatusByToken(createDefaultAssetStatus());
      return;
    }
    setRlusdBalance(parseRlusdBalance(balances));
  }, [address, balances]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const savedConnection = loadLocalConnection();
      const secret = loadLocalAccountSecret();
      setIsLocalWalletAvailable(Boolean(secret));

      if (!savedConnection) return;

      try {
        if (savedConnection === 'local') {
          if (!secret) {
            clearLocalConnection();
            return;
          }

          const localWallet = restoreLocalAccount(secret);
          if (cancelled) return;

          setConnectionType('local');
          setAddress(localWallet.address);
          await refreshBalancesForAddress(localWallet.address, { skipAssetRefresh: true });
          return;
        }
      } catch {
        clearLocalConnection();
        if (!cancelled) {
          resetDisconnectedState();
          setError('Failed to restore wallet session. Please reconnect your wallet.');
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [refreshBalancesForAddress, resetDisconnectedState]);

  useEffect(() => {
    if (!address || assetDefinitions.length === 0) return;
    void refreshAssetAvailabilityForAddress(address);
  }, [address, assetDefinitions, refreshAssetAvailabilityForAddress]);

  const value = useMemo<WalletContextType>(
    () => ({
      connectionType,
      address,
      balances,
      rlusdBalance,
      isConnecting,
      isRefreshing,
      error,
      assetStatus: assetStatusByToken.RLUSD,
      hasRlusdAsset: hasAssetByToken.RLUSD,
      assetStatusByToken,
      hasAssetByToken,
      isLocalWalletAvailable,
      connectLocalWallet,
      disconnect,
      refreshBalances,
      refreshAssetStatus,
      refreshAssetStatuses,
    }),
    [
      address,
      balances,
      connectLocalWallet,
      connectionType,
      disconnect,
      error,
      hasAssetByToken,
      isConnecting,
      isLocalWalletAvailable,
      isRefreshing,
      refreshBalances,
      refreshAssetStatus,
      refreshAssetStatuses,
      rlusdBalance,
      assetStatusByToken,
    ]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
