/**
 * Integrity rules for the content collection that the Zod schema can't
 * express. Reads the YAML directly so it runs without Astro's content layer.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { placeholdersIn, unknownPlaceholdersIn } from '@/lib/placeholders';

interface StoredEntry {
  label: string;
  group: string;
  order: number;
  usesField?: boolean;
  raw?: string[];
  render?: string[];
  helper?: { code: string; module: string }[];
  notes?: string;
  review?: string;
}

const contentDir = join(dirname(fileURLToPath(import.meta.url)), '../content');
const entriesDir = join(contentDir, 'entries');

function readYaml(path: string): unknown {
  return parse(readFileSync(path, 'utf8'));
}

const files = readdirSync(entriesDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => join(entriesDir, f));

const entries = files.map((path) => ({
  id: basename(path, '.yaml'),
  folder: relative(entriesDir, dirname(path)),
  data: readYaml(path) as StoredEntry,
}));

type IdList = { id: string }[];
const groupIds = new Set((readYaml(join(contentDir, 'groups.yaml')) as IdList).map((g) => g.id));
const moduleIds = new Set(
  (readYaml(join(contentDir, 'modules.yaml')) as IdList).map((m) => m.id),
);

function codeOf(e: StoredEntry): string[] {
  return [...(e.raw ?? []), ...(e.render ?? []), ...(e.helper ?? []).map((h) => h.code)];
}

describe('content collection', () => {
  it('has entries', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses kebab-case ids', () => {
    for (const { id } of entries) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  describe.each(entries)('$id', ({ id, folder, data }) => {
    const code = codeOf(data);
    const found = placeholdersIn(code);

    it('lives in the folder of its group', () => {
      expect(folder).toBe(data.group);
    });

    it('belongs to a known group', () => {
      expect(groupIds).toContain(data.group);
    });

    it('has at least one snippet', () => {
      expect(code.length).toBeGreaterThan(0);
    });

    it('declares usesField consistently with __FIELD__', () => {
      expect(found.has('field'), `${id}: usesField=${String(data.usesField ?? true)}`).toBe(
        data.usesField ?? true,
      );
    });

    it('only uses __SUBFIELD__ together with __FIELD__', () => {
      if (found.has('subfield')) expect(found.has('field')).toBe(true);
    });

    it('has no unknown placeholders', () => {
      for (const snippet of code) expect(unknownPlaceholdersIn(snippet)).toEqual([]);
    });

    it('references known modules', () => {
      for (const { module } of data.helper ?? []) expect(moduleIds).toContain(module);
    });
  });

  it('has unique order values within each group', () => {
    const byGroup = new Map<string, number[]>();
    for (const { data } of entries) byGroup.set(data.group, [...(byGroup.get(data.group) ?? []), data.order]);
    for (const [group, orders] of byGroup) {
      expect(new Set(orders).size, `duplicate order in ${group}`).toBe(orders.length);
    }
  });
});

describe('groups', () => {
  const groups = readYaml(join(contentDir, 'groups.yaml')) as { id: string; order: number }[];

  it('have unique order values', () => {
    expect(new Set(groups.map((g) => g.order)).size).toBe(groups.length);
  });

  it('are listed in display order, so the file reads the way the site does', () => {
    const orders = groups.map((g) => g.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
