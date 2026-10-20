/**
 * Post-build step for Apache shared hosting: writes dist/.htaccess for the
 * configured BASE_PATH and removes Cloudflare's _headers file.
 *
 *   BASE_PATH=/twig-field-finder SITE_URL=https://example.com pnpm build:apache
 */
import { rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderHtaccess } from './htaccess';

const dist = join(dirname(fileURLToPath(import.meta.url)), '../dist');
const base = process.env.BASE_PATH ?? '/';

await writeFile(join(dist, '.htaccess'), renderHtaccess(base));
await rm(join(dist, '_headers'), { force: true });
console.log(`Wrote dist/.htaccess for base path "${base}".`);
