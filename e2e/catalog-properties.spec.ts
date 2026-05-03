import { expect, type Page, test } from '@playwright/test';

const CATALOG_PROPERTY_NAMES = [
  "One Za'abeel Sky Penthouse",
  'Burj Vista Infinity Villa',
  'Aman Tokyo Sky Residence',
  'Le Marais Grand Haussmann',
  '432 Park Pinnacle Penthouse',
];

const PURCHASE_ALERT =
  '現在購入できるのは THE SAIL Hotel Tower と NYRA Oceanview Hotel のみです。';

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

async function expectPurchaseGateAlert(page: Page, action: () => Promise<void>) {
  const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 });
  const actionPromise = action();
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe(PURCHASE_ALERT);
  await dialog.accept();
  await actionPromise;
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

test('home page presents the Solana global catalog entry point', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForClientHandlers(page);

  await expect(page.getByRole('heading', { name: 'Buy real estate, 1-click, from 1 SOL.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "One Za'abeel Sky Penthouse" }).first()).toBeVisible();
});

test('discover catalog shows the five HTML properties and keeps investment gated', async ({ page }) => {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' });
  await waitForClientHandlers(page);

  await expect(page.getByText('Explore the world portfolio.')).toBeVisible();

  for (const propertyName of CATALOG_PROPERTY_NAMES) {
    await expect(page.getByText(propertyName, { exact: true }).first()).toBeVisible();
  }

  await expectPurchaseGateAlert(page, () => page.getByTestId('catalog-featured-invest').click());

  await page.getByTestId('catalog-featured-notify').click();
  await expect(page.getByTestId('catalog-featured-notify')).toContainText('Notified');
  await expect.poll(() => readStoredIds(page, 'laplace:property-notify')).toContain('zaabel');

  await page.getByTestId('catalog-card-burjv-watchlist').click();
  await expect(page.getByTestId('catalog-card-burjv-watchlist')).toHaveAttribute(
    'aria-label',
    'Remove from watchlist',
  );
  await expect.poll(() => readStoredIds(page, 'laplace:property-watchlist')).toContain('burjv');
});

test('catalog property detail saves notify and watchlist locally without purchase API', async ({ page }) => {
  let purchaseApiCalled = false;

  await page.route('**/api/purchase', async (route) => {
    purchaseApiCalled = true;
    await route.fulfill({
      status: 500,
      json: { error: 'Catalog-only properties must not call purchase API' },
    });
  });

  await page.goto('/hotel/zaabel', { waitUntil: 'domcontentloaded' });
  await waitForClientHandlers(page);

  await expect(page.getByRole('heading', { name: "One Za'abeel Sky Penthouse" })).toBeVisible();
  await expect(page.getByText('Priority access opens soon.')).toBeVisible();

  await expectPurchaseGateAlert(page, () => page.getByTestId('catalog-detail-invest').click());
  expect(purchaseApiCalled).toBe(false);

  await page.getByTestId('catalog-detail-notify').click();
  await expect(page.getByTestId('catalog-detail-notify')).toContainText('Notification Saved');
  await expect.poll(() => readStoredIds(page, 'laplace:property-notify')).toContain('zaabel');

  await page.getByTestId('catalog-detail-watchlist').click();
  await expect(page.getByTestId('catalog-detail-watchlist')).toContainText('Watching');
  await expect.poll(() => readStoredIds(page, 'laplace:property-watchlist')).toContain('zaabel');
});
