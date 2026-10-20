import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;
const baseURL = `http://localhost:${String(PORT)}`;

/**
 * Smoke tests against the production build (`pnpm build` first; CI does).
 * `--ignore-lock` keeps `astro preview` in the foreground: Astro otherwise
 * backgrounds itself when it detects an AI agent, which Playwright can't own.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } } },
  ],
  webServer: {
    command: `pnpm exec astro preview --ignore-lock --port ${String(PORT)}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
