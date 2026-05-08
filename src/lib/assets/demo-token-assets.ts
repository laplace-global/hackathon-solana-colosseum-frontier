import { APP_DEFAULTS } from '@/lib/config/defaults';
import type { AssetDefinition } from '@/lib/chain/types';
import {
  PROPERTY_TOKEN_BY_HOTEL_ID,
  type PropertyTokenSymbol,
} from '@/data/property-tokens';

export type DemoTokenSymbol = PropertyTokenSymbol | 'USDC';

export const DEMO_PROPERTY_TOKEN_SYMBOLS = Object.values(
  PROPERTY_TOKEN_BY_HOTEL_ID
) as PropertyTokenSymbol[];

export const DEMO_TOKEN_SYMBOLS: DemoTokenSymbol[] = [
  ...DEMO_PROPERTY_TOKEN_SYMBOLS,
  'USDC',
];

const TOKEN_MINT_ENV_KEYS = {
  SAIL: 'SAIL_MINT_ADDRESS',
  NYRA: 'NYRA_MINT_ADDRESS',
  ZAABEL: 'ZAABEL_MINT_ADDRESS',
  BURJV: 'BURJV_MINT_ADDRESS',
  AMANT: 'AMANT_MINT_ADDRESS',
  LEMARAIS: 'LEMARAIS_MINT_ADDRESS',
  '432PK': 'PARK432_MINT_ADDRESS',
  USDC: 'USDC_MINT_ADDRESS',
} as const satisfies Record<DemoTokenSymbol, string>;

function optionalEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getDemoTokenMintAddresses(): Record<DemoTokenSymbol, string> {
  const addresses: Record<DemoTokenSymbol, string> = { ...APP_DEFAULTS.demoMintAddresses };
  for (const [symbol, envKey] of Object.entries(TOKEN_MINT_ENV_KEYS)) {
    const override = optionalEnv(envKey);
    if (override) {
      addresses[symbol as DemoTokenSymbol] = override;
    }
  }
  return addresses;
}

export function createDemoTokenRecord<T>(
  factory: (symbol: DemoTokenSymbol) => T
): Record<DemoTokenSymbol, T> {
  return Object.fromEntries(
    DEMO_TOKEN_SYMBOLS.map((symbol) => [symbol, factory(symbol)])
  ) as Record<DemoTokenSymbol, T>;
}

export function withDemoTokenAssetDefinitions(
  assetDefinitions: AssetDefinition[]
): AssetDefinition[] {
  const definitions = new Map(assetDefinitions.map((asset) => [asset.symbol, asset]));
  const addresses = getDemoTokenMintAddresses();

  for (const symbol of DEMO_TOKEN_SYMBOLS) {
    if (definitions.has(symbol)) continue;

    definitions.set(symbol, {
      symbol,
      assetId: addresses[symbol],
      kind: 'token',
    });
  }

  return Array.from(definitions.values());
}
