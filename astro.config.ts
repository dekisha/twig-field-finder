import react from '@astrojs/react';
import optimizeLocales from '@react-aria/optimize-locales-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

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
  // Content-Security-Policy as a <meta> tag with hashes for every inline and
  // bundled script. Styles allow 'unsafe-inline' because Shiki colours tokens
  // with style attributes (Astro documents this limitation).
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  integrations: [react()],
  // Downloaded at build time and self-hosted from the site's own origin.
  fonts: [
    {
      name: 'Geist',
      cssVariable: '--font-geist',
      provider: fontProviders.google(),
      weights: ['400 700'],
      // The UI never uses italics.
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      provider: fontProviders.google(),
      weights: ['400 600'],
      // Italic marks placeholder stand-ins in code.
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },
  ],
  vite: {
    plugins: [
      tailwindcss(),
      // The UI is English-only: drop React Aria's strings for ~35 other locales.
      optimizeLocales.vite({ locales: ['en-US'] }),
    ],
  },
});
