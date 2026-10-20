import { expect, test } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('entry page shows every approach and links into the builder', async ({ page }) => {
  await page.goto('/fields/image-path/');
  await expect(page).toHaveTitle('Image — public URL / image style — Twig Field Finder');
  for (const name of ['Raw entity', 'Render array', 'Helper module']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: /bamboo_twig/ }).first()).toHaveAttribute(
    'href',
    'https://www.drupal.org/project/bamboo_twig',
  );

  await page.getByRole('link', { name: 'Open in builder (Helper module)' }).click();
  await expect(page.getByRole('tab', { name: 'Helper module' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('static copy buttons work', async ({ page }) => {
  await page.goto('/fields/link-url/');
  const button = page.locator('main li:has(.snippet-code)').first().getByRole('button');
  await button.click();
  await expect(button).toHaveAttribute('data-copied', '');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '{{ node.field_name.0.url|render }}',
  );
});

test('browse filters by group and module, and restores from the URL', async ({ page }) => {
  await page.goto('/fields/');
  const status = page.locator('[data-browse-status]');
  await expect(status).toHaveText('Showing all 52 entries');

  await page.getByLabel('Contrib module').selectOption('twig_tweak');
  await expect(status).toHaveText('Showing 2 of 52 entries');
  await page.getByLabel('Group').selectOption('link');
  await expect(page.getByText('No entries match these filters.')).toBeVisible();
  await expect(page).toHaveURL(/group=link&module=twig_tweak/);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(status).toHaveText('Showing all 52 entries');

  await page.goto('/fields/?group=image');
  await expect(page.getByLabel('Group')).toHaveValue('image');
  await expect(status).toHaveText('Showing 5 of 52 entries');
});

test('modules page lists every module with its filters', async ({ page }) => {
  await page.goto('/modules/');
  for (const name of ['Twig Field Value', 'Bamboo Twig', 'Twig Tweak', 'Config Pages']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.locator('dt')).toHaveText([
    '|field_label',
    '|field_raw',
    '|field_target_entity',
    '|field_value',
  ]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content stays complete and dead controls stay hidden', async ({ page }) => {
    await page.goto('/fields/');
    await expect(page.locator('form[data-browse-filters]')).toBeHidden();
    await expect(page.locator('[data-browse-item]')).toHaveCount(52);

    await page.goto('/fields/link-url/');
    await expect(page.locator('.snippet-code pre')).toHaveCount(3);
    await expect(page.locator('button[data-copy]:visible')).toHaveCount(0);
  });
});

test('pages never scroll horizontally', async ({ page }) => {
  for (const path of ['/', '/?entry=image-path', '/fields/', '/fields/ref-image/', '/modules/']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBe(0);
  }
});
