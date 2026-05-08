import { Hotel } from "@/types/hotel";
import { catalogProperties, type CatalogProperty } from "@/data/catalog-properties";
import { isPurchasableHotelId } from "@/data/property-tokens";

const primaryHotels: Hotel[] = [
  {
    id: "the-sail",
    name: "THE SAIL Hotel Tower",
    location: "Melaka",
    country: "Malaysia",
    description:
      "An architectural icon in Melaka, offering breathtaking views of the Strait of Malacca. This luxury hotel combines modern design with exceptional hospitality.",
    roiGuaranteed: "8% p.a.",
    roiPercentage: 8,
    buybackYear: 19,
    buybackPercentage: 170,
    thumbnail: "/images/sail-thumb.png",
    images: [
      "/images/sail-1.jpg",
      "/images/sail-2.jpg",
      "/images/sail-3.jpg",
      "/images/sail-4.jpg",
    ],
    totalUnits: 150,
    availableUnits: 87,
    minInvestment: 1000,
    tokenPrice: 100,
    currency: "USD",
    features: [
      "Ocean view",
      "Premium location",
      "Professional management",
      "Guaranteed returns",
      "Buyback clause",
    ],
    units: [
      {
        id: "sail-a",
        type: "A",
        name: "Studio Deluxe",
        size: 38,
        sizeUnit: "m²",
        totalPrice: 350000,
        pricePerSqm: 9210.53,
        totalTokens: 3500,
        availableTokens: 2625,
        floor: "15-20",
        view: "Ocean View",
        features: ["Balcony", "Full kitchen", "Air conditioning"],
      },
      {
        id: "sail-b",
        type: "B",
        name: "Suite Executive",
        size: 56,
        sizeUnit: "m²",
        totalPrice: 450000,
        pricePerSqm: 8035.71,
        totalTokens: 4500,
        availableTokens: 2340,
        floor: "21-30",
        view: "Panoramic Ocean View",
        features: [
          "Large balcony",
          "Living room",
          "Gourmet kitchen",
          "Bathtub",
        ],
      },
      {
        id: "sail-c",
        type: "C",
        name: "Compact Suite",
        size: 27,
        sizeUnit: "m²",
        totalPrice: 300000,
        pricePerSqm: 11111.11,
        totalTokens: 3000,
        availableTokens: 2670,
        floor: "10-14",
        view: "City View",
        features: ["Kitchenette", "Work area", "Smart TV"],
      },
    ],
  },
  {
    id: "nyra",
    name: "NYRA Oceanview Hotel",
    location: "Melaka",
    country: "Malaysia",
    description:
      "Contemporary beachfront resort with sustainable design and exclusive experiences. NYRA redefines hospitality with technology and comfort.",
    roiGuaranteed: "8% p.a.",
    roiPercentage: 8,
    buybackYear: 9,
    buybackPercentage: 100,
    thumbnail: "/images/nyra-thumb.png",
    images: [
      "/images/nyra-1.jpg",
      "/images/nyra-2.jpg",
      "/images/nyra-3.jpg",
      "/images/nyra-4.jpg",
    ],
    totalUnits: 200,
    availableUnits: 142,
    minInvestment: 1000,
    tokenPrice: 100,
    currency: "USD",
    features: [
      "Oceanfront location",
      "Sustainable design",
      "Fixed 8% ROI",
      "9-year buyback",
      "International management",
    ],
    units: [
      {
        id: "nyra-a",
        type: "A",
        name: "Ocean Studio",
        size: 44.5,
        sizeUnit: "m²",
        totalPrice: 380000,
        pricePerSqm: 8539.33,
        totalTokens: 3800,
        availableTokens: 2584,
        floor: "5-15",
        view: "Lateral Ocean View",
        features: ["Balcony", "Mini kitchen", "Work area", "Safe"],
      },
      {
        id: "nyra-b",
        type: "B",
        name: "Premium Suite",
        size: 53.1,
        sizeUnit: "m²",
        totalPrice: 480000,
        pricePerSqm: 9039.02,
        totalTokens: 4800,
        availableTokens: 2064,
        floor: "16-25",
        view: "Frontal Ocean View",
        features: [
          "Panoramic balcony",
          "Separate living room",
          "Full kitchen",
          "Jacuzzi",
        ],
      },
      {
        id: "nyra-e",
        type: "E",
        name: "Penthouse",
        size: 70.3,
        sizeUnit: "m²",
        totalPrice: 550000,
        pricePerSqm: 7823.19,
        totalTokens: 5500,
        availableTokens: 5060,
        floor: "26-30",
        view: "360° View",
        features: [
          "Private terrace",
          "2 bedrooms",
          "Gourmet kitchen",
          "Home theater",
          "Private pool",
        ],
      },
    ],
  },
];

const catalogUnitProfiles: Record<
  string,
  {
    unitName: string;
    size: number;
    floor: string;
    view: string;
    buybackYear: number;
    buybackPercentage: number;
  }
> = {
  zaabel: {
    unitName: "Sky Penthouse Allocation",
    size: 932,
    floor: "The Link, top residence",
    view: "Arabian Gulf and Dubai skyline",
    buybackYear: 10,
    buybackPercentage: 138,
  },
  burjv: {
    unitName: "Infinity Villa Allocation",
    size: 510,
    floor: "Sky villa level",
    view: "Burj Khalifa frontal view",
    buybackYear: 10,
    buybackPercentage: 142,
  },
  amant: {
    unitName: "Sky Residence Allocation",
    size: 420,
    floor: "Otemachi tower residence",
    view: "Imperial Palace and Tokyo skyline",
    buybackYear: 9,
    buybackPercentage: 129,
  },
  lemarais: {
    unitName: "Grand Appartement Allocation",
    size: 286,
    floor: "Heritage residence floor",
    view: "Private courtyard and Paris rooftops",
    buybackYear: 8,
    buybackPercentage: 124,
  },
  "432pk": {
    unitName: "Pinnacle Penthouse Allocation",
    size: 767,
    floor: "Pinnacle floor",
    view: "Central Park panorama",
    buybackYear: 10,
    buybackPercentage: 151,
  },
};

function toHotelLocation(property: CatalogProperty): string {
  const countrySuffix = `, ${property.country}`;
  return property.location.endsWith(countrySuffix)
    ? property.location.slice(0, -countrySuffix.length)
    : property.location;
}

function toCatalogHotel(property: CatalogProperty): Hotel {
  const profile = catalogUnitProfiles[property.id];
  const totalTokens = Math.round(property.raiseUsd / property.tokenPriceUsd);
  const availableTokens = Math.max(
    1,
    Math.round(totalTokens * ((100 - property.fundingProgress) / 100))
  );
  const size = profile.size;
  const totalPrice = totalTokens * property.tokenPriceUsd;

  return {
    id: property.id,
    name: property.name,
    location: toHotelLocation(property),
    country: property.country,
    description: property.description,
    roiGuaranteed: `${property.annualYield}% p.a.`,
    roiPercentage: property.annualYield,
    buybackYear: profile.buybackYear,
    buybackPercentage: profile.buybackPercentage,
    thumbnail: property.imageUrl,
    images: [
      property.imageUrl,
      property.imageUrl,
      property.imageUrl,
      property.imageUrl,
    ],
    totalUnits: 1,
    availableUnits: availableTokens > 0 ? 1 : 0,
    minInvestment: property.tokenPriceUsd,
    tokenPrice: property.tokenPriceUsd,
    currency: "USD",
    features: [
      ...property.amenities.slice(0, 4),
      "Solana devnet purchase flow",
      "Token holder portfolio tracking",
    ],
    units: [
      {
        id: `${property.id}-a`,
        type: property.symbol,
        name: profile.unitName,
        size,
        sizeUnit: "m²",
        totalPrice,
        pricePerSqm: Number((totalPrice / size).toFixed(2)),
        totalTokens,
        availableTokens,
        floor: profile.floor,
        view: profile.view,
        features: property.amenities.slice(0, 4),
      },
    ],
  };
}

const catalogHotels = catalogProperties
  .filter((property) => isPurchasableHotelId(property.id))
  .filter((property) => !primaryHotels.some((hotel) => hotel.id === property.id))
  .map(toCatalogHotel);

export const hotels: Hotel[] = [...primaryHotels, ...catalogHotels];
