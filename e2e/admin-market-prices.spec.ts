import { expect, test } from '@playwright/test';

const market = {
  id: 'market-sail',
  name: 'SAIL-USDC',
  isActive: true,
  collateralCurrency: 'SAIL',
  collateralIssuer: 'sail-mint',
  collateralAssetId: 'sail-mint',
  debtCurrency: 'USDC',
  debtIssuer: 'usdc-mint',
  debtAssetId: 'usdc-mint',
  liquidityPoolId: null,
  positionTokenAssetId: null,
  liquidityShareScale: 6,
  totalSupplied: 0,
  totalBorrowed: 0,
  prices: {
    collateralPriceUsd: 100,
    debtPriceUsd: 1,
  },
};

test('admin can update mock market prices from market configuration', async ({ page }) => {
  let savedPayload: Record<string, unknown> | null = null;

  await page.route('**/api/lending/config', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          markets: [market],
          assetDefinitions: [],
          explorerUrl: 'https://explorer.solana.com',
        },
      },
    });
  });

  await page.route('**/api/admin/markets', async (route) => {
    await route.fulfill({
      json: {
        ok: true,
        markets: [market],
      },
    });
  });

  await page.route('**/api/lending/prices', async (route) => {
    savedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      json: {
        success: true,
        data: {
          marketId: 'market-sail',
          collateralPriceUsd: 125.5,
          debtPriceUsd: 1,
        },
      },
    });
  });

  await page.goto('/admin');
  await page.getByRole('button', { name: 'SAIL-USDC' }).click();

  await expect(page.getByLabel('Collateral price USD')).toHaveValue('100');
  await expect(page.getByLabel('Debt price USD')).toHaveValue('1');

  await page.getByLabel('Collateral price USD').fill('125.5');
  await page.getByLabel('Debt price USD').fill('1');
  await page.getByRole('button', { name: 'Save Prices' }).click();

  expect(savedPayload).toEqual({
    marketId: 'market-sail',
    collateralPriceUsd: 125.5,
    debtPriceUsd: 1,
  });
});
