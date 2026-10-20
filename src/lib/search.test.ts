import { describe, expect, it } from 'vitest';

import type { Entry } from './entry';
import { createEntrySearch } from './search';

function entry(id: string, group: string, label: string): Entry {
  return { id, group, label, usesField: true, raw: ['x'], render: [], helper: [] };
}

const entries = [
  entry('entity-id', 'entity-basics', 'ID'),
  entry('image-alt', 'image', 'Image — alt'),
  entry('image-title', 'image', 'Image — title'),
  entry('link-url', 'link', 'Link — URL'),
  entry('ref-label', 'entity-reference', 'Reference — label (term name / node title)'),
  entry('media-alt', 'media', 'Media image — alt'),
];
const groups = {
  'entity-basics': 'Entity basics',
  image: 'Image',
  link: 'Link',
  'entity-reference': 'Entity reference',
  media: 'Media',
};
const search = createEntrySearch(entries, groups);
const ids = (q: string) => search(q).map((e) => e.id);

describe('createEntrySearch', () => {
  it('returns every entry in order for an empty query', () => {
    expect(ids('')).toEqual(entries.map((e) => e.id));
    expect(ids('   ')).toEqual(entries.map((e) => e.id));
  });

  it('matches labels', () => {
    expect(ids('url')[0]).toBe('link-url');
  });

  it('tolerates typos', () => {
    expect(ids('refrence')).toContain('ref-label');
  });

  it('matches regardless of word order', () => {
    expect(ids('alt image')[0]).toBe('image-alt');
    expect(ids('alt image')).toContain('media-alt');
    expect(ids('alt image')).not.toContain('image-title');
  });

  it('matches group labels', () => {
    expect(ids('entity reference')).toContain('ref-label');
  });

  it('matches ids', () => {
    expect(ids('ref-label')[0]).toBe('ref-label');
  });

  it('returns nothing for nonsense', () => {
    expect(ids('zzzzqqq')).toEqual([]);
  });
});
