/**
 * Guards rule 3 of the project brief: snippet content is never changed by the
 * migration. Every snippet in the collection must match the seed exactly.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { slugify, type SeedEntry, type SeedFile } from './seed';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = JSON.parse(
  readFileSync(join(root, 'data/twig-field-entries.json'), 'utf8'),
) as SeedFile;

/** Review notes added after the migration, with the user's approval. */
const REVIEW_ADDED = new Set(['boolean']);
const REVIEW_EXTENDED = new Set(['ref-url']);
/** Verified against Drupal source: review note resolved, notes may differ. */
const VERIFIED = new Set(['address', 'ref-label']);

describe.each(seed.entries)('seed entry $id', (original) => {
  const path = join(root, 'src/content/entries', slugify(original.group), `${original.id}.yaml`);
  const stored = parse(readFileSync(path, 'utf8')) as Omit<SeedEntry, 'id'>;

  it('keeps snippets byte for byte', () => {
    expect(stored.raw).toEqual(original.raw);
    expect(stored.render).toEqual(original.render);
    expect(stored.helper).toEqual(original.helper);
  });

  it('keeps label, usesField and notes', () => {
    expect(stored.label).toBe(original.label);
    expect(stored.usesField).toBe(original.usesField);
    if (!VERIFIED.has(original.id)) expect(stored.notes).toBe(original.notes);
  });

  it('keeps the review note', () => {
    if (VERIFIED.has(original.id)) {
      expect(stored.review).toBeUndefined();
    } else if (REVIEW_ADDED.has(original.id)) {
      expect(original.review).toBeUndefined();
      expect(stored.review).toEqual(expect.any(String));
    } else if (REVIEW_EXTENDED.has(original.id)) {
      expect(stored.review).toEqual(expect.stringContaining(original.review ?? '∅'));
    } else {
      expect(stored.review).toBe(original.review);
    }
  });
});
