import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { gotoBuilder, openPicker } from './helpers';

const PAGES = [
  { name: 'builder', path: '/?entry=ref-image&field=field_media&sub=field_image' },
  { name: 'builder (render tab, disabled entity)', path: '/?entry=link-url&tab=render' },
  { name: 'entry page', path: '/fields/image-path/' },
  { name: 'browse', path: '/fields/' },
  { name: 'modules', path: '/modules/' },
  { name: '404', path: '/no-such-page/' },
];

async function audit(page: Page, { disableRules = [] }: { disableRules?: string[] } = {}) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .disableRules(disableRules)
    .analyze();
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
  }));
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const { name, path } of PAGES) {
      test(`${name} has no axe violations`, async ({ page }) => {
        if (path.startsWith('/?')) await gotoBuilder(page, path.slice(1));
        else await page.goto(path);
        expect(await audit(page)).toEqual([]);
      });
    }

    test('open picker has no axe violations', async ({ page }) => {
      await gotoBuilder(page);
      await openPicker(page);
      // While the listbox is open, React Aria aria-hides the rest of the page so
      // screen readers stay in the popup (its documented combobox behaviour).
      // That trips three rules which can't pass in this state by design: no
      // visible <h1> or landmarks, and hidden-but-focusable controls (they
      // aren't reachable: Tab closes the popup first).
      expect(
        await audit(page, {
          disableRules: ['page-has-heading-one', 'region', 'aria-hidden-focus'],
        }),
      ).toEqual([]);
    });

    test('invalid field name state has no axe violations', async ({ page }) => {
      await gotoBuilder(page);
      await page.getByRole('textbox', { name: 'Field machine name' }).fill('Bad-Name');
      expect(await audit(page)).toEqual([]);
    });
  });
}

test('every interactive element can be reached and shows a focus ring', async ({ page }) => {
  await gotoBuilder(page, '?entry=ref-label');
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const text = (el as HTMLElement).innerText.trim().slice(0, 40);
      const label = el.getAttribute('aria-label') ?? (text || el.tagName);
      return {
        key: `${el.tagName}:${label}`,
        ring: style.outlineStyle !== 'none' && style.outlineWidth !== '0px',
      };
    });
    if (!info) continue;
    expect(info.ring, `focus ring on ${info.key}`).toBe(true);
    seen.add(info.key);
  }
  expect(seen.size).toBeGreaterThan(10);
});
