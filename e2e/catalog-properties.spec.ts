import { expect, type Page, test } from '@playwright/test';

const CATALOG_PROPERTY_NAMES = [
  'THE SAIL Hotel Tower',
  'NYRA Oceanview Hotel',
  "One Za'abeel Sky Penthouse",
  'Burj Vista Infinity Villa',
  'Aman Tokyo Sky Residence',
  'Le Marais Grand Haussmann',
  '432 Park Pinnacle Penthouse',
];

async function clearCatalogStorage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('laplace:property-watchlist');
    window.localStorage.removeItem('laplace:property-notify');
  });
}

async function waitForClientHandlers(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);
}

async function readStoredIds(page: Page, key: string): Promise<string[]> {
  return page.evaluate((storageKey) => {
    const value = window.localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as string[]) : [];
  }, key);
}

test.beforeEach(async ({ page }) => {
  await page.route('https://images.unsplash.com/**', async (route) => {
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="#141310"/></svg>',
    });
  });
  await page.route('**/api/lending/config', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          markets: [],
          assetDefinitions: [],
        },
      },
    });
  });
  await clearCatalogStorage(page);
});

test('home page presents live MVP properties in the catalog entry point', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForClientHandlers(page);

  await expect(page.getByRole('heading', { name: "The world's penthouses. 1 SOL. 1 click." })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'THE SAIL Hotel Tower' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NYRA Oceanview Hotel' }).first()).toBeVisible();
});

test('discover catalog shows purchase-capable properties first and routes every listing to purchase detail', async ({ page }) => {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' });
  await waitForClientHandlers(page);

  await expect(page.getByText('Explore the world portfolio.')).toBeVisible();
  await expect(page.getByText('THE SAIL Hotel Tower').first()).toBeVisible();
  await expect(page.getByText('NYRA Oceanview Hotel').first()).toBeVisible();
  await expect(page.getByTestId('catalog-featured-invest')).toContainText('Buy SAIL Tokens');

  for (const propertyName of CATALOG_PROPERTY_NAMES) {
    await expect(page.getByText(propertyName, { exact: true }).first()).toBeVisible();
  }

  await expect(page.getByTestId('catalog-featured-invest')).toHaveAttribute('href', '/hotel/the-sail');
  await expect(page.getByTestId('catalog-card-the-sail-invest')).toHaveAttribute('href', '/hotel/the-sail');
  await expect(page.getByTestId('catalog-card-nyra-invest')).toHaveAttribute('href', '/hotel/nyra');

  await expect(page.getByTestId('catalog-card-zaabel-invest')).toHaveAttribute('href', '/hotel/zaabel');
  await expect(page.getByTestId('catalog-card-zaabel-invest')).toContainText('Buy ZAABEL Tokens');

  await page.getByTestId('catalog-featured-notify').click();
  await expect(page.getByTestId('catalog-featured-notify')).toContainText('Notified');
  await expect.poll(() => readStoredIds(page, 'laplace:property-notify')).toContain('the-sail');

  await page.getByTestId('catalog-card-burjv-watchlist').click();
  await expect(page.getByTestId('catalog-card-burjv-watchlist')).toHaveAttribute(
    'aria-label',
    'Remove from watchlist',
  );
  await expect.poll(() => readStoredIds(page, 'laplace:property-watchlist')).toContain('burjv');
});

test('catalog property detail exposes the purchase unit flow', async ({ page }) => {
  let purchaseApiCalled = false;

  await page.route('**/api/purchase', async (route) => {
    purchaseApiCalled = true;
    await route.fulfill({
      status: 500,
      json: { error: 'Purchase API should not be called before confirming a purchase' },
    });
  });

  await page.goto('/hotel/zaabel', { waitUntil: 'domcontentloaded' });
  await waitForClientHandlers(page);

  await expect(page.getByRole('heading', { name: "One Za'abeel Sky Penthouse" })).toBeVisible();
  await page.getByRole('tab', { name: 'Units' }).click();
  await expect(page.getByText('Sky Penthouse Allocation')).toBeVisible();
  await expect(page.getByRole('link', { name: /Details/ })).toHaveAttribute('href', '/hotel/zaabel/unit/zaabel-a');
  expect(purchaseApiCalled).toBe(false);
});
