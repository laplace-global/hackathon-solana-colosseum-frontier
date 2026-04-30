import { restoreLocalAccount } from './client';
import type { LocalAccount } from './types';

function readFirstEnv(names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function requireFirstEnv(names: string[], errorMessage: string): string {
  const value = readFirstEnv(names);
  if (!value) {
    throw new Error(errorMessage);
  }
  return value;
}

export function getTreasurySecret(): string {
  return requireFirstEnv(
    ['TREASURY_WALLET_SECRET', 'TREASURY_SECRET', 'ISSUER_WALLET_SECRET', 'ISSUER_WALLET_SEED'],
    'Treasury wallet secret is not configured'
  );
}

export function getTreasuryAccount(): LocalAccount {
  return restoreLocalAccount(getTreasurySecret());
}

export function getTreasuryAddress(): string {
  return readFirstEnv(['TREASURY_ADDRESS', 'ISSUER_ADDRESS']) ?? getTreasuryAccount().address;
}

export function getOperatorSecret(): string {
  return requireFirstEnv(
    ['OPERATOR_WALLET_SECRET', 'OPERATOR_SECRET', 'BACKEND_WALLET_SECRET', 'BACKEND_WALLET_SEED'],
    'Operator wallet secret is not configured'
  );
}

export function getOperatorAccount(): LocalAccount {
  return restoreLocalAccount(getOperatorSecret());
}

export function getOperatorAddress(): string {
  return readFirstEnv(['OPERATOR_ADDRESS', 'BACKEND_ADDRESS']) ?? getOperatorAccount().address;
}

export function getFaucetSecret(): string {
  return (
    readFirstEnv(['FAUCET_WALLET_SECRET', 'FAUCET_SECRET']) ??
    getTreasurySecret()
  );
}

export function getFaucetAccount(): LocalAccount {
  return restoreLocalAccount(getFaucetSecret());
}

export function getFaucetAddress(): string {
  return readFirstEnv(['FAUCET_ADDRESS']) ?? getFaucetAccount().address;
}
