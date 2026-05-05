export type CatalogCountry = 'All' | 'UAE' | 'Japan' | 'France' | 'USA';

export interface CatalogProperty {
  id: string;
  name: string;
  location: string;
  country: Exclude<CatalogCountry, 'All'>;
  type: string;
  annualYield: number;
  fiveYearEstimate: number;
  tokenPriceUsd: number;
  raiseUsd: number;
  fundingProgress: number;
  symbol: string;
  ltvRatio: number;
  developer: string;
  imageUrl: string;
  description: string;
  amenities: string[];
}

export const purchasablePropertyNames = ['THE SAIL Hotel Tower', 'NYRA Oceanview Hotel'] as const;

export const purchasableOnlyMessage =
  `現在購入できるのは ${purchasablePropertyNames.join(' と ')} のみです。`;

export const catalogProperties: CatalogProperty[] = [
  {
    id: 'zaabel',
    name: "One Za'abeel Sky Penthouse",
    location: 'Dubai Marina, UAE',
    country: 'UAE',
    type: 'Penthouse',
    annualYield: 9.2,
    fiveYearEstimate: 38,
    tokenPriceUsd: 250,
    raiseUsd: 18_000_000,
    fundingProgress: 71,
    symbol: 'ZAABEL',
    ltvRatio: 65,
    developer: 'ICD Brookfield Place',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=90',
    description:
      "Perched atop the world's first double-cantilevered tower, this sky penthouse frames 360-degree views of the Arabian Gulf and Dubai skyline.",
    amenities: [
      'Private infinity pool',
      'Dedicated helipad',
      '24/7 concierge',
      'Private lift',
      'Smart home automation',
      'Temperature-controlled wine cellar',
    ],
  },
  {
    id: 'burjv',
    name: 'Burj Vista Infinity Villa',
    location: 'Downtown Dubai, UAE',
    country: 'UAE',
    type: 'Sky Villa',
    annualYield: 8.5,
    fiveYearEstimate: 42,
    tokenPriceUsd: 100,
    raiseUsd: 9_000_000,
    fundingProgress: 43,
    symbol: 'BURJV',
    ltvRatio: 65,
    developer: 'Emaar Properties',
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920&q=90',
    description:
      'Facing the Burj Khalifa at eye level, this infinity villa opens into wraparound terraces and a private skyline living canvas.',
    amenities: [
      'Infinity terrace',
      'Private gym',
      'Butler service',
      'Burj Khalifa view',
      'Smart building access',
      'Valet parking',
    ],
  },
  {
    id: 'amant',
    name: 'Aman Tokyo Sky Residence',
    location: 'Otemachi, Tokyo, Japan',
    country: 'Japan',
    type: 'Luxury Residence',
    annualYield: 7.4,
    fiveYearEstimate: 29,
    tokenPriceUsd: 500,
    raiseUsd: 22_000_000,
    fundingProgress: 58,
    symbol: 'AMANT',
    ltvRatio: 60,
    developer: 'Aman Resorts',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=90',
    description:
      'A serene sky residence above Otemachi, combining Japanese material restraint with full-height views across Tokyo and the Imperial Palace gardens.',
    amenities: [
      'Aman Spa access',
      'Personal chef service',
      'Imperial Palace views',
      'Japanese garden',
      'Private dining room',
      'Chauffeur service',
    ],
  },
  {
    id: 'lemarais',
    name: 'Le Marais Grand Haussmann',
    location: '3eme arrondissement, Paris',
    country: 'France',
    type: 'Heritage Residence',
    annualYield: 6.8,
    fiveYearEstimate: 24,
    tokenPriceUsd: 200,
    raiseUsd: 14_000_000,
    fundingProgress: 29,
    symbol: 'LEMARAIS',
    ltvRatio: 60,
    developer: 'Nexity Heritage',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=90',
    description:
      'A restored Haussmann-era grand appartement in Le Marais, preserving herringbone parquet, ornamental fireplaces, and private courtyard access.',
    amenities: [
      'Herringbone parquet floors',
      'Original fireplaces',
      'Private courtyard',
      'Cave a vins',
      'Gardien on-site',
      'Rooftop terrace',
    ],
  },
  {
    id: '432pk',
    name: '432 Park Pinnacle Penthouse',
    location: 'Midtown Manhattan, New York',
    country: 'USA',
    type: 'Ultra-Penthouse',
    annualYield: 9.8,
    fiveYearEstimate: 51,
    tokenPriceUsd: 1000,
    raiseUsd: 45_000_000,
    fundingProgress: 82,
    symbol: '432PK',
    ltvRatio: 70,
    developer: 'CIM Group & Macklowe Properties',
    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&q=90',
    description:
      "The pinnacle floor of 432 Park Avenue, with Central Park panoramas and private resident-club access from one of Manhattan's most recognizable towers.",
    amenities: [
      '1,396ft elevation',
      'Central Park panorama',
      'Private residents club',
      'Indoor lap pool',
      'White-glove concierge',
      'Dedicated art storage',
    ],
  },
];

export function getCatalogProperty(id: string): CatalogProperty | undefined {
  return catalogProperties.find((property) => property.id === id);
}
