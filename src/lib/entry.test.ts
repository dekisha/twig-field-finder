import { describe, expect, it } from 'vitest';

import {
  allPlaceholders,
  approachesFor,
  modulesFor,
  placeholdersFor,
  resolveApproach,
  snippetsFor,
  toPublicEntry,
  type Entry,
} from './entry';

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test',
    group: 'test',
    label: 'Test',
    usesField: true,
    raw: [],
    render: [],
    helper: [],
    ...overrides,
  };
}

describe('approachesFor', () => {
  it('lists only approaches with snippets, in canonical order', () => {
    expect(approachesFor(entry({ helper: [{ code: 'h', module: 'm' }], raw: ['r'] }))).toEqual([
      'raw',
      'helper',
    ]);
    expect(approachesFor(entry({ render: ['x'] }))).toEqual(['render']);
  });
});

describe('resolveApproach', () => {
  const e = entry({ raw: ['r'], helper: [{ code: 'h', module: 'm' }] });

  it('keeps an available requested approach', () => {
    expect(resolveApproach(e, 'helper')).toBe('helper');
  });

  it('falls back to the first available approach', () => {
    expect(resolveApproach(e, 'render')).toBe('raw');
    expect(resolveApproach(e, undefined)).toBe('raw');
    expect(resolveApproach(entry({ helper: [{ code: 'h', module: 'm' }] }), 'raw')).toBe('helper');
  });
});

describe('snippetsFor', () => {
  it('normalises raw/render strings and helper objects', () => {
    const e = entry({ raw: ['a'], helper: [{ code: 'b', module: 'twig_tweak' }] });
    expect(snippetsFor(e, 'raw')).toEqual([{ code: 'a' }]);
    expect(snippetsFor(e, 'helper')).toEqual([{ code: 'b', module: 'twig_tweak' }]);
    expect(snippetsFor(e, 'render')).toEqual([]);
  });
});

describe('placeholders', () => {
  const e = entry({
    raw: ['{{ __ENTITY__.__FIELD__.entity.__SUBFIELD__.value }}'],
    helper: [
      { code: '{{ content.__FIELD__|field_target_entity.__SUBFIELD__.value }}', module: 'm' },
    ],
  });

  it('are computed per approach', () => {
    expect(placeholdersFor(e, 'raw')).toEqual(new Set(['entity', 'field', 'subfield']));
    expect(placeholdersFor(e, 'helper')).toEqual(new Set(['field', 'subfield']));
  });

  it('are computed across the entry', () => {
    expect(allPlaceholders(e)).toEqual(new Set(['entity', 'field', 'subfield']));
  });
});

describe('modulesFor', () => {
  it('de-duplicates in order', () => {
    const e = entry({
      helper: [
        { code: 'a', module: 'bamboo_twig' },
        { code: 'b', module: 'bamboo_twig' },
        { code: 'c', module: 'twig_tweak' },
      ],
    });
    expect(modulesFor(e)).toEqual(['bamboo_twig', 'twig_tweak']);
  });
});

describe('toPublicEntry', () => {
  const e = entry({ raw: ['x'], review: 'Check me' });

  it('strips the review note for production', () => {
    const result = toPublicEntry(e, { includeReview: false });
    expect(result).not.toHaveProperty('review');
    expect(result.raw).toEqual(['x']);
  });

  it('keeps the review note in development', () => {
    expect(toPublicEntry(e, { includeReview: true }).review).toBe('Check me');
  });
});
