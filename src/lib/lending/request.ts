import { isValidChainAddress } from '@/lib/chain/client';

export function isValidLendingBackendAddress(address: unknown): address is string {
  return isValidChainAddress(address);
}

export function getInvalidLendingBackendAddressMessage(): string {
  return 'Invalid address format for the current lending backend';
}

export function readAccountSecret(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function readAccountSecretFromPayload(payload: Record<string, unknown>): string | null {
  return (
    readAccountSecret(payload.accountSecret) ??
    readAccountSecret(payload.borrowerSeed) ??
    readAccountSecret(payload.walletSeed)
  );
}
