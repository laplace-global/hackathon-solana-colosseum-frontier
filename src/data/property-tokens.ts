import type { SupportedAssetSymbol } from '@/lib/assets/asset-symbols';

export const PROPERTY_TOKEN_BY_HOTEL_ID = {
  'the-sail': 'SAIL',
  nyra: 'NYRA',
  zaabel: 'ZAABEL',
  burjv: 'BURJV',
  amant: 'AMANT',
  lemarais: 'LEMARAIS',
  '432pk': '432PK',
} as const satisfies Record<string, Exclude<SupportedAssetSymbol, 'USDC'>>;

export type PurchasableHotelId = keyof typeof PROPERTY_TOKEN_BY_HOTEL_ID;
export type PropertyTokenSymbol = (typeof PROPERTY_TOKEN_BY_HOTEL_ID)[PurchasableHotelId];

export const HOTEL_ID_BY_PROPERTY_TOKEN = Object.fromEntries(
  Object.entries(PROPERTY_TOKEN_BY_HOTEL_ID).map(([hotelId, token]) => [token, hotelId])
) as Record<PropertyTokenSymbol, PurchasableHotelId>;

export function isPurchasableHotelId(hotelId: string): hotelId is PurchasableHotelId {
  return hotelId in PROPERTY_TOKEN_BY_HOTEL_ID;
}

export function getPropertyTokenSymbol(hotelId: string): PropertyTokenSymbol | null {
  return isPurchasableHotelId(hotelId) ? PROPERTY_TOKEN_BY_HOTEL_ID[hotelId] : null;
}

export function getHotelIdByPropertyToken(token: string): PurchasableHotelId | null {
  const normalized = token.toUpperCase() as PropertyTokenSymbol;
  return HOTEL_ID_BY_PROPERTY_TOKEN[normalized] ?? null;
}
