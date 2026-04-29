import {
  clearWalletConnection,
  clearWalletSecretKey,
  loadWalletConnection,
  loadWalletSecretKey,
  saveWalletConnection,
  saveWalletSecretKey,
} from '@/lib/client/solana-wallet-storage';
import type { LocalConnectionType } from './types';

function notifyStorageChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('local-account-storage-changed'));
}

export function saveLocalAccountSecret(secret: string): void {
  saveWalletSecretKey(secret);
  notifyStorageChanged();
}

export function loadLocalAccountSecret(): string | null {
  return loadWalletSecretKey();
}

export function clearLocalAccountSecret(): void {
  clearWalletSecretKey();
  notifyStorageChanged();
}

export function saveLocalConnection(type: LocalConnectionType): void {
  saveWalletConnection(type);
  notifyStorageChanged();
}

export function loadLocalConnection(): LocalConnectionType | null {
  return loadWalletConnection();
}

export function clearLocalConnection(): void {
  clearWalletConnection();
  notifyStorageChanged();
}
