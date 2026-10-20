import type { EntityContextId } from './entities';
import { placeholdersIn, type PlaceholderKey } from './placeholders';

export const APPROACHES = ['raw', 'render', 'helper'] as const;
export type Approach = (typeof APPROACHES)[number];

export const APPROACH_LABELS: Readonly<Record<Approach, string>> = {
  raw: 'Raw entity',
  render: 'Render array',
  helper: 'Helper module',
};

export const APPROACH_DESCRIPTIONS: Readonly<Record<Approach, string>> = {
  raw: 'Reads the entity directly, before field formatters run.',
  render: 'Reads the `content` render array, after field formatters run.',
  helper: 'Uses a contrib module’s Twig filter or function.',
};

export interface HelperSnippet {
  code: string;
  /** Module machine name, a key of the modules collection. */
  module: string;
}

/**
 * A field entry as used by the app. Unlike the stored data, all snippet
 * arrays are present (possibly empty) and the id is part of the object.
 */
export interface Entry {
  id: string;
  /** Group id, a key of the groups collection. */
  group: string;
  label: string;
  usesField: boolean;
  /** Template the fixed-variable snippets are written for. */
  context?: EntityContextId;
  raw: string[];
  render: string[];
  helper: HelperSnippet[];
  notes?: string;
  /** Verification note. Only present in development builds. */
  review?: string;
}

export interface Snippet {
  code: string;
  module?: string;
}

export function isApproach(value: unknown): value is Approach {
  return typeof value === 'string' && (APPROACHES as readonly string[]).includes(value);
}

export function snippetsFor(entry: Entry, approach: Approach): Snippet[] {
  if (approach === 'helper') return entry.helper.map(({ code, module }) => ({ code, module }));
  return entry[approach].map((code) => ({ code }));
}

/** Approaches the entry has at least one snippet for, in canonical order. */
export function approachesFor(entry: Entry): Approach[] {
  return APPROACHES.filter((a) => snippetsFor(entry, a).length > 0);
}

/**
 * The approach to show: the requested one if the entry has it, otherwise the
 * entry's first available approach.
 */
export function resolveApproach(entry: Entry, requested: Approach | undefined): Approach {
  const available = approachesFor(entry);
  if (requested && available.includes(requested)) return requested;
  // Every entry has at least one approach (enforced by the content schema).
  return available[0] ?? 'raw';
}

/** Placeholders used by the snippets of one approach. */
export function placeholdersFor(entry: Entry, approach: Approach): Set<PlaceholderKey> {
  return placeholdersIn(snippetsFor(entry, approach).map((s) => s.code));
}

/** Placeholders used anywhere in the entry. */
export function allPlaceholders(entry: Entry): Set<PlaceholderKey> {
  return placeholdersIn(APPROACHES.flatMap((a) => snippetsFor(entry, a).map((s) => s.code)));
}

/** Modules required by an entry's helper snippets, de-duplicated, in order. */
export function modulesFor(entry: Entry): string[] {
  return [...new Set(entry.helper.map((h) => h.module))];
}

/** Remove fields that must not ship in production output. */
export function toPublicEntry(entry: Entry, { includeReview }: { includeReview: boolean }): Entry {
  if (includeReview || entry.review === undefined) return entry;
  const { review: _review, ...rest } = entry;
  return rest;
}
