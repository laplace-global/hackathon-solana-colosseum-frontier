import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { catalogProperties } from '../../src/data/catalog-properties';
import { PROPERTY_TOKEN_BY_HOTEL_ID } from '../../src/data/property-tokens';
import { ASSET_ID_BY_SYMBOL } from '../../src/lib/assets/asset-symbols';
import { getDemoTokenMintAddresses } from '../../src/lib/assets/demo-token-assets';

type DefaultMarketConfig = {
  name: string;
  collateralCurrency: string;
  debtCurrency: string;
  collateralIssuer: string;
  debtIssuer: string;
  collateralPriceUsd: string;
  maxLtvRatio: string;
  liquidationLtvRatio: string;
  minCollateralAmount: string;
};

describe('lending market defaults', () => {
  it('builds a USDC lending market for every purchasable property token', async () => {
    const seedModule = await import('../../src/lib/db/seed') as {
      buildDefaultMarketConfigs?: (assets: ReturnType<typeof getDemoTokenMintAddresses>) => DefaultMarketConfig[];
    };

    const buildDefaultMarketConfigs = seedModule.buildDefaultMarketConfigs;
    if (typeof buildDefaultMarketConfigs !== 'function') {
      assert.fail('buildDefaultMarketConfigs should be exported');
    }

    const demoMints = getDemoTokenMintAddresses();
    const marketConfigs = buildDefaultMarketConfigs(demoMints);
    const expectedSymbols = Object.values(PROPERTY_TOKEN_BY_HOTEL_ID);
    const catalogBySymbol = new Map(catalogProperties.map((property) => [property.symbol, property]));

    assert.deepEqual(
      marketConfigs.map((market) => market.name),
      expectedSymbols.map((symbol) => `${symbol}-USDC`),
    );

    for (const market of marketConfigs) {
      const symbol = market.name.replace(/-USDC$/, '') as keyof typeof demoMints;
      const property = catalogBySymbol.get(symbol);

      assert.ok(property, `${symbol} should have a catalog property`);
      assert.equal(market.collateralCurrency, ASSET_ID_BY_SYMBOL[symbol as keyof typeof ASSET_ID_BY_SYMBOL]);
      assert.equal(market.debtCurrency, ASSET_ID_BY_SYMBOL.USDC);
      assert.equal(market.collateralIssuer, demoMints[symbol]);
      assert.equal(market.debtIssuer, demoMints.USDC);
      assert.equal(market.collateralPriceUsd, property.tokenPriceUsd.toFixed(1));
      assert.equal(market.maxLtvRatio, (property.ltvRatio / 100).toFixed(2));
      assert.equal(market.liquidationLtvRatio, '0.85');
      assert.equal(market.minCollateralAmount, '1');
    }
  });
});
