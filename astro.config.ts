import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/**
 * Deployment targets are configured through environment variables so the same
 * build works on a root domain, a subdomain or a subpath:
 *
 *   SITE_URL   Absolute origin used for canonical URLs and Open Graph tags.
 *   BASE_PATH  Path prefix when served from a subpath, e.g. `/twig-field-finder`.
 *              Defaults to `/` (Cloudflare Pages / subdomain).
 */
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
