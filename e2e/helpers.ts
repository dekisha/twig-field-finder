import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page } from '@playwright/test';
import { parse } from 'yaml';

/** Wait until the builder island has hydrated and Shiki has highlighted. */
export async function gotoBuilder(page: Page, query = ''): Promise<void> {
  await page.goto(`/${query}`);
  await expect(page.locator('astro-island:not([ssr])')).toHaveCount(1);
  await expect(page.locator('.snippet-code pre span[style]').first()).toBeVisible();
}

/** Pick an entry through the combobox using only the keyboard. */
export async function pickEntry(page: Page, query: string, label: string): Promise<void> {
  const combo = page.getByRole('combobox', { name: 'What do you want to get?' });
  await combo.fill(query);
  await page.getByRole('option', { name: label, exact: true }).waitFor();
  // Move to the option by keyboard rather than clicking it.
  for (let i = 0; i < 20; i++) {
    await combo.press('ArrowDown');
    const active = await combo.getAttribute('aria-activedescendant');
    const text = active ? await page.locator(`[id="${active}"]`).innerText() : '';
    if (text.trim() === label) break;
  }
  await combo.press('Enter');
  await expect(page.locator('#result-heading')).toHaveText(label);
}

export function resultPanel(page: Page) {
  return page.locator('section[aria-labelledby="result-heading"]');
}

/** Open the full list with the picker's button (a tap on touch devices). */
export async function openPicker(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Show all field types' });
  const hasTouch = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  if (hasTouch) await button.tap();
  else await button.click();
  await expect(page.getByRole('listbox')).toBeVisible();
}

/** Counts derived from the content collection, so tests don't hard-code them. */
export function contentStats() {
  const dir = join(import.meta.dirname, '../src/content/entries');
  const entries = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.yaml'))
    .map(
      (f) =>
        parse(readFileSync(join(dir, f), 'utf8')) as {
          group: string;
          helper?: { module: string }[];
        },
    );
  return {
    total: entries.length,
    byGroup: (group: string) => entries.filter((e) => e.group === group).length,
    byModule: (module: string) =>
      entries.filter((e) => (e.helper ?? []).some((h) => h.module === module)).length,
  };
}
