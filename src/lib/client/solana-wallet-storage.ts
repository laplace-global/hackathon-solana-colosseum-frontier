export const LOCAL_WALLET_SECRET_KEY = 'solana.dev.wallet.secret-key';
export const WALLET_CONNECTION_KEY = 'solana.wallet.connection';

export type WalletConnectionType = 'local';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function notifyWalletStorageChanged(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event('solana-wallet-storage-changed'));
}

export function saveWalletSecretKey(secretKey: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(LOCAL_WALLET_SECRET_KEY, secretKey);
  notifyWalletStorageChanged();
}

export function loadWalletSecretKey(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LOCAL_WALLET_SECRET_KEY);
}

export function clearWalletSecretKey(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(LOCAL_WALLET_SECRET_KEY);
  notifyWalletStorageChanged();
}

export function saveWalletConnection(type: WalletConnectionType): void {
  if (!isBrowser()) return;
  localStorage.setItem(WALLET_CONNECTION_KEY, type);
  notifyWalletStorageChanged();
}

export function loadWalletConnection(): WalletConnectionType | null {
  if (!isBrowser()) return null;
  const value = localStorage.getItem(WALLET_CONNECTION_KEY);
  return value === 'local' ? value : null;
}

export function clearWalletConnection(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(WALLET_CONNECTION_KEY);
  notifyWalletStorageChanged();
}
