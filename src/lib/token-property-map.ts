import { catalogProperties } from '@/data/catalog-properties';
import { getPropertyTokenSymbol } from '@/data/property-tokens';

export interface TokenPropertyLink {
  token: string;
  propertyName: string;
  propertyPath: string;
}

const TOKEN_PROPERTY_LINKS = Object.fromEntries(
  catalogProperties.flatMap((property) => {
    const token = getPropertyTokenSymbol(property.id);
    if (!token) return [];

    return [
      [
        token,
        {
          token,
          propertyName: property.name,
          propertyPath: `/hotel/${property.id}`,
        },
      ],
    ];
  })
) as Record<string, TokenPropertyLink>;

export function getTokenPropertyLink(token: string): TokenPropertyLink | null {
  return TOKEN_PROPERTY_LINKS[token.toUpperCase()] ?? null;
}
