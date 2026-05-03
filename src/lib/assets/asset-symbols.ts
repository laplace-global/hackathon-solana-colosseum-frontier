export const ASSET_ID_BY_SYMBOL = {
  SAIL: '5341494C00000000000000000000000000000000',
  NYRA: '4E59524100000000000000000000000000000000',
  USDC: '5553444300000000000000000000000000000000',
} as const;

export type SupportedAssetSymbol = keyof typeof ASSET_ID_BY_SYMBOL;

const LEGACY_USDC_ALIASES = new Set([
  'RLUSD',
  'RUSD',
  '524C555344000000000000000000000000000000',
]);

export function getAssetId(symbol: string): string | null {
  const normalized = getAssetSymbol(symbol).toUpperCase() as SupportedAssetSymbol;
  return ASSET_ID_BY_SYMBOL[normalized] ?? null;
}

export function getAssetSymbol(assetIdOrSymbol: string): string {
  const normalized = assetIdOrSymbol.toUpperCase();
  if (LEGACY_USDC_ALIASES.has(normalized)) {
    return 'USDC';
  }

  for (const [symbol, assetId] of Object.entries(ASSET_ID_BY_SYMBOL)) {
    if (normalized === assetId || normalized === symbol) {
      return symbol;
    }
  }

  return assetIdOrSymbol;
}

export function normalizeAssetId(assetIdOrSymbol: string): string {
  const symbol = getAssetSymbol(assetIdOrSymbol);
  const canonical = getAssetId(symbol);
  return (canonical ?? assetIdOrSymbol).toUpperCase();
}
