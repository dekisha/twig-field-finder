/**
 * Post-build guards:
 *
 * 1. Review notes are a development aid and must never ship: fails if any
 *    `review` text from the collection appears anywhere in `dist/`.
 * 2. Every root-relative link and asset URL in the HTML stays under BASE_PATH,
 *    so a subpath deployment never points at the domain root.
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

const base = `/${(process.env.BASE_PATH ?? '/').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');
const outside = outputs
  .filter((o) => o.file.endsWith('.html'))
  .flatMap(({ file, text }) =>
    [...text.matchAll(/\b(?:href|src)="(\/[^"]*)"/g)]
      .map((m) => m[1] ?? '')
      .filter((url) => !url.startsWith('//') && !url.startsWith(base))
      .map((url) => `dist/${file}: ${url}`),
  );

let failed = false;
if (leaks.length > 0) {
  console.error(`Review notes found in the production build:\n  ${leaks.join('\n  ')}`);
  failed = true;
}
if (outside.length > 0) {
  console.error(`URLs outside the base path "${base}":\n  ${outside.slice(0, 20).join('\n  ')}`);
  failed = true;
}
if (failed) process.exit(1);
console.log(
  `OK: none of ${String(reviews.length)} review notes appear in ${String(outputs.length)} build files; all URLs are under "${base}".`,
);
