import { expect, test } from '@playwright/test';

import { gotoBuilder, openPicker, pickEntry, resultPanel } from './helpers';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('builds a snippet from entry, field name and entity', async ({ page }) => {
  await gotoBuilder(page);
  await pickEntry(page, 'alt image', 'Image — alt');

  const field = page.getByRole('textbox', { name: 'Field machine name' });
  await field.fill('hero_image');
  await page.getByRole('button', { name: /Use field_hero_image/ }).click();
  await expect(field).toHaveValue('field_hero_image');

  await page.locator('label', { hasText: 'Term' }).click();
  await expect(resultPanel(page).locator('pre').first()).toHaveText(
    '{{ term.field_hero_image.alt }}',
  );
});

test('validates the machine name without rewriting it', async ({ page }) => {
  await gotoBuilder(page);
  const field = page.getByRole('textbox', { name: 'Field machine name' });
  await field.fill('Hero Image');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(
    page.getByText('Use only lowercase letters, numbers and underscores.'),
  ).toBeVisible();
  await expect(field).toHaveValue('Hero Image');
});

test('disables inputs that do not apply, and says why', async ({ page }) => {
  await gotoBuilder(page, '?entry=bundle-machine-name');
  await expect(page.getByRole('textbox', { name: 'Field machine name' })).toBeDisabled();
  await expect(page.getByText(/is a property of the entity itself/)).toBeVisible();

  await gotoBuilder(page, '?entry=link-url&tab=render');
  await expect(page.getByRole('radio', { name: 'Node' })).toBeDisabled();
  await expect(page.getByText(/Render-array snippets read/)).toBeVisible();

  await gotoBuilder(page, '?entry=ref-subfield');
  await expect(page.getByRole('textbox', { name: 'Field on the referenced entity' })).toBeVisible();
});

test('copies a snippet and announces it', async ({ page }) => {
  await gotoBuilder(page, '?entry=link-url&field=field_cta');
  const button = resultPanel(page).locator('li').first().getByRole('button');
  await button.click();
  await expect(button).toHaveText(/Copied/);
  await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveText(
    'Copied to clipboard',
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '{{ node.field_cta.0.url|render }}',
  );
});

test('restores shared state from the URL and keeps it in sync', async ({ page }) => {
  await gotoBuilder(page, '?entry=link-url&field=field_cta&entity=media&tab=helper');
  await expect(page.locator('#result-heading')).toHaveText('Link — URL');
  await expect(page.getByRole('tab', { name: 'Helper module' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('textbox', { name: 'Field machine name' })).toHaveValue('field_cta');

  await page.getByRole('tab', { name: 'Raw entity' }).click();
  await expect(page).toHaveURL(/tab=raw/);
  await expect(page).toHaveURL(/entity=media/);
});

test('ignores invalid URL state', async ({ page }) => {
  await gotoBuilder(page, '?entry=nope&entity=planet&tab=magic');
  await expect(page.locator('#result-heading')).toHaveText(
    'Reference — label (term name / node title)',
  );
});

test.describe('short viewport', () => {
  test.use({ viewport: { width: 1024, height: 560 } });

  // Regression: scrolling the selected option into view used to scroll the
  // page, and React Aria closes the popover on page scroll.
  test('the full list stays open and keeps the page still', async ({ page }) => {
    for (const entry of ['ref-label', 'config-pages']) {
      await gotoBuilder(page, `?entry=${entry}`);
      await openPicker(page);
      await page.waitForTimeout(300);
      await expect(page.getByRole('listbox')).toBeVisible();
      await expect(page.getByRole('option', { selected: true })).toBeInViewport();
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
  });
});

test('groups are listed in their configured order', async ({ page }) => {
  await gotoBuilder(page);
  await openPicker(page);
  const groups = await page
    .getByRole('listbox')
    .getByRole('group')
    .evaluateAll((els) =>
      els.map((g) => document.getElementById(g.getAttribute('aria-labelledby') ?? '')?.textContent),
    );
  expect(groups.slice(0, 4)).toEqual(['Entity basics', 'Utilities', 'Text', 'Simple values']);
});

test('typing in the picker starts a new search', async ({ page }) => {
  await gotoBuilder(page);
  const combo = page.getByRole('combobox', { name: 'What do you want to get?' });
  await combo.focus();
  await page.keyboard.type('image alt');
  await expect(combo).toHaveValue('image alt');
  await expect(page.getByRole('option', { name: 'Image — alt', exact: true })).toBeVisible();
});
