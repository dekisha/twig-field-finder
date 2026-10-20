/**
 * One-off migration: `data/twig-field-entries.json` → `src/content/**`.
 *
 * Kept in the repo for provenance. Re-running it overwrites the content
 * collection with the seed, so only do that deliberately:
 *
 *   pnpm seed:split
 *
 * Snippet strings are copied verbatim; `scripts/split-seed.test.ts` asserts the
 * generated collection still matches the seed byte for byte.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

import { slugify, type SeedFile } from './seed';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seedPath = join(root, 'data/twig-field-entries.json');
const contentDir = join(root, 'src/content');

/** Display names for the contrib modules referenced by helper snippets. */
const MODULE_NAMES: Record<string, string> = {
  twig_field_value: 'Twig Field Value',
  bamboo_twig: 'Bamboo Twig',
  twig_tweak: 'Twig Tweak',
  config_pages: 'Config Pages',
};

const yamlOptions = { lineWidth: 0 } as const;

async function write(path: string, data: unknown, header?: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const body = stringify(data, yamlOptions);
  await writeFile(path, header ? `${header}\n${body}` : body);
}

async function main(): Promise<void> {
  const seed = JSON.parse(await readFile(seedPath, 'utf8')) as SeedFile;

  // Groups keep the order in which they first appear in the seed.
  const groups = [...new Set(seed.entries.map((e) => e.group))].map((label, i) => ({
    id: slugify(label),
    label,
    order: (i + 1) * 10,
  }));

  await rm(join(contentDir, 'entries'), { recursive: true, force: true });

  const positionInGroup = new Map<string, number>();
  for (const { id, group, ...rest } of seed.entries) {
    // Steps of 10 leave room to insert entries without renumbering.
    const order = ((positionInGroup.get(group) ?? 0) + 1) * 10;
    positionInGroup.set(group, order / 10);
    // Fixed key order keeps the files predictable to read and diff.
    const { label, usesField, raw, render, helper, notes, review } = rest;
    const data = {
      label,
      group: slugify(group),
      order,
      ...(usesField !== undefined && { usesField }),
      ...(raw && { raw }),
      ...(render && { render }),
      ...(helper && { helper }),
      ...(notes && { notes }),
      ...(review && { review }),
    };
    await write(join(contentDir, 'entries', slugify(group), `${id}.yaml`), data);
  }

  await write(
    join(contentDir, 'groups.yaml'),
    groups,
    '# Groups, shown in ascending `order` in the picker and browse view.',
  );
  await write(
    join(contentDir, 'modules.yaml'),
    // Descriptions are site copy added after the migration; see modules.yaml.
    Object.entries(seed.modules).map(([id, url]) => ({ id, name: MODULE_NAMES[id] ?? id, url })),
  );
  await write(
    join(contentDir, 'helper-filters.yaml'),
    seed.helperFilters.map(({ name, ...rest }) => ({ id: name, ...rest })),
  );

  console.log(`Wrote ${seed.entries.length} entries in ${groups.length} groups.`);
}

await main();
