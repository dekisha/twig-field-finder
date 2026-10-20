/**
 * Post-build guard: review notes are a development aid and must never ship.
 * Fails if any `review` text from the collection appears anywhere in `dist/`.
 *
 *   pnpm build && pnpm verify:dist
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const entriesDir = join(root, 'src/content/entries');

const reviews = readdirSync(entriesDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.yaml'))
  .flatMap((f) => {
    const { review } = parse(readFileSync(join(entriesDir, f), 'utf8')) as { review?: string };
    return review ? [{ file: f, review }] : [];
  });

const outputs = readdirSync(distDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => /\.(html|js|json|txt|xml)$/.test(f))
  .map((f) => ({ file: f, text: readFileSync(join(distDir, f), 'utf8') }));

// Match on a distinctive slice so escaping of quotes/backticks doesn't hide a leak.
const leaks = reviews.flatMap(({ file, review }) => {
  const needle = review.slice(0, 40);
  return outputs.filter((o) => o.text.includes(needle)).map((o) => `${file} → dist/${o.file}`);
});

if (leaks.length > 0) {
  console.error(`Review notes found in the production build:\n  ${leaks.join('\n  ')}`);
  process.exit(1);
}
console.log(`OK: none of ${reviews.length} review notes appear in ${outputs.length} build files.`);
