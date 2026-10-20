import { expect, test } from '@playwright/test';

test('follows the system theme by default', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/fields/');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(15, 20, 24)');
});

test('remembers a manual choice across pages, without a flash', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.locator('label[title="Dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // The inline head script must apply the theme before any paint: check the
  // attribute as soon as the document is parsed, before other scripts run.
  await page.goto('/modules/', { waitUntil: 'commit' });
  await page.waitForSelector('html[data-theme="dark"]', { state: 'attached' });
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();

  await page.locator('label[title="System"]').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});

test('works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.locator('label[title="Dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});
