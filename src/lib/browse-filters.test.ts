import { describe, expect, it } from 'vitest';

import {
  describeResults,
  matchesFilters,
  parseBrowseFilters,
  serializeBrowseFilters,
} from './browse-filters';

const item = { group: 'image', modules: ['bamboo_twig', 'twig_tweak'] };
const known = {
  groups: new Set(['image', 'link']),
  modules: new Set(['bamboo_twig', 'twig_tweak']),
};

describe('matchesFilters', () => {
  it('matches everything with no filters', () => {
    expect(matchesFilters(item, { group: '', module: '' })).toBe(true);
    expect(matchesFilters({ group: 'link', modules: [] }, { group: '', module: '' })).toBe(true);
  });

  it('filters by group and module, combined', () => {
    expect(matchesFilters(item, { group: 'image', module: '' })).toBe(true);
    expect(matchesFilters(item, { group: 'link', module: '' })).toBe(false);
    expect(matchesFilters(item, { group: '', module: 'twig_tweak' })).toBe(true);
    expect(matchesFilters(item, { group: 'image', module: 'config_pages' })).toBe(false);
    expect(
      matchesFilters({ group: 'link', modules: [] }, { group: '', module: 'twig_tweak' }),
    ).toBe(false);
  });
});

describe('parseBrowseFilters / serializeBrowseFilters', () => {
  it('round-trips', () => {
    const filters = { group: 'image', module: 'twig_tweak' };
    expect(parseBrowseFilters(`?${serializeBrowseFilters(filters)}`, known)).toEqual(filters);
  });

  it('ignores unknown values', () => {
    expect(parseBrowseFilters('?group=nope&module=evil', known)).toEqual({ group: '', module: '' });
  });

  it('omits empty filters', () => {
    expect(serializeBrowseFilters({ group: '', module: '' })).toBe('');
  });
});

describe('describeResults', () => {
  it('describes all, some and none', () => {
    expect(describeResults(52, 52)).toBe('Showing all 52 entries');
    expect(describeResults(5, 52)).toBe('Showing 5 of 52 entries');
    expect(describeResults(0, 52)).toBe('No entries match these filters');
  });
});
