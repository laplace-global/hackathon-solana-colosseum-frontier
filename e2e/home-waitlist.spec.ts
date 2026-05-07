import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://images.unsplash.com/**', async (route) => {
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="#141310"/></svg>',
    });
  });
});

test('hero waitlist gives inline feedback without calling an API', async ({ page }) => {
  let waitlistApiCalled = false;
  await page.route('**/api/waitlist', async (route) => {
    waitlistApiCalled = true;
    await route.fulfill({ status: 500, json: { error: 'waitlist API should not be called' } });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const heroForm = page.locator('form#founding');
  await heroForm.locator('input[type="email"]').fill('founder@example.com');
  await heroForm.getByRole('button', { name: /Join Waitlist/i }).click();

  await expect(heroForm.getByText("You're on the list")).toBeVisible();
  await expect(heroForm.getByText("We'll reach out before anyone else.")).toBeVisible();
  await expect(heroForm.locator('input[type="email"]')).toBeHidden();
  expect(waitlistApiCalled).toBe(false);
});

test('footer waitlist validates email and swaps the form for a success state', async ({ page }) => {
  let waitlistApiCalled = false;
  await page.route('**/api/waitlist', async (route) => {
    waitlistApiCalled = true;
    await route.fulfill({ status: 500, json: { error: 'waitlist API should not be called' } });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const emailInput = page.locator('#waitlist-email');
  await emailInput.scrollIntoViewIfNeeded();
  await emailInput.fill('not-an-email');
  await page.locator('form').filter({ has: emailInput }).getByRole('button', { name: /Join Waitlist/i }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();

  await emailInput.fill('founder@example.com');
  await page.locator('form').filter({ has: emailInput }).getByRole('button', { name: /Join Waitlist/i }).click();

  const successState = page.getByRole('status').filter({ hasText: "You're on the list." });
  await expect(successState).toBeVisible();
  await expect(successState.getByRole('link', { name: /Explore Properties/i })).toBeVisible();
  await expect(emailInput).toBeHidden();
  expect(waitlistApiCalled).toBe(false);
});
