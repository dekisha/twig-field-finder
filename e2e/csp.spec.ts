import { expect, test, type Page } from '@playwright/test';

import { gotoBuilder, openPicker } from './helpers';

declare global {
  interface Window {
    __cspViolations: string[];
  }
}

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push(`${e.violatedDirective}: ${e.blockedURI || 'inline'}`);
    });
  });
});

const violations = (page: Page) => page.evaluate(() => window.__cspViolations);

test('the builder runs under the Content-Security-Policy', async ({ page }) => {
  await gotoBuilder(page, '?entry=ref-image&field=field_media');
  await openPicker(page);
  await page.keyboard.press('Escape');
  await page.locator('label[title="Dark"]').click();
  await page
    .locator('section[aria-labelledby="result-heading"] li')
    .first()
    .getByRole('button')
    .click();
  expect(await violations(page)).toEqual([]);
});

for (const path of ['/fields/image-path/', '/fields/', '/modules/', '/no-such-page/']) {
  test(`${path} runs under the Content-Security-Policy`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveCount(1);
    expect(await violations(page)).toEqual([]);
  });
}
