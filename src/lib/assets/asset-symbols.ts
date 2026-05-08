export const ASSET_ID_BY_SYMBOL = {
  SAIL: '5341494C00000000000000000000000000000000',
  NYRA: '4E59524100000000000000000000000000000000',
  ZAABEL: '5A414142454C0000000000000000000000000000',
  BURJV: '4255524A56000000000000000000000000000000',
  AMANT: '414D414E54000000000000000000000000000000',
  LEMARAIS: '4C454D4152414953000000000000000000000000',
  '432PK': '343332504B000000000000000000000000000000',
  USDC: '5553444300000000000000000000000000000000',
} as const;

export type SupportedAssetSymbol = keyof typeof ASSET_ID_BY_SYMBOL;

export function getAssetId(symbol: string): string | null {
  const normalized = getAssetSymbol(symbol).toUpperCase() as SupportedAssetSymbol;
  return ASSET_ID_BY_SYMBOL[normalized] ?? null;
}

export function getAssetSymbol(assetIdOrSymbol: string): string {
  const normalized = assetIdOrSymbol.toUpperCase();
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
