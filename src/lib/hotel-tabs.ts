export const HOTEL_DETAIL_TABS = ['overview', 'units', 'faq'] as const;

export type HotelDetailTab = (typeof HOTEL_DETAIL_TABS)[number];

export const DEFAULT_HOTEL_DETAIL_TAB: HotelDetailTab = 'overview';

export function getHotelTabFromSearch(value: unknown): HotelDetailTab {
  return HOTEL_DETAIL_TABS.includes(value as HotelDetailTab)
    ? (value as HotelDetailTab)
    : DEFAULT_HOTEL_DETAIL_TAB;
}

export function buildHotelTabHref(hotelId: string, tab: HotelDetailTab): string {
  const params = new URLSearchParams({ tab });
  return `/hotel/${hotelId}?${params.toString()}`;
}
