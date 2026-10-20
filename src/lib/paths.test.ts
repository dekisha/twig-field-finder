import { describe, expect, it } from 'vitest';

import { joinBase } from './paths';

describe('joinBase', () => {
  it.each([
    ['/', 'fields/link-url', '/fields/link-url'],
    ['/', '/fields/link-url', '/fields/link-url'],
    ['/twig-field-finder', 'fields/', '/twig-field-finder/fields/'],
    ['/twig-field-finder/', '/modules', '/twig-field-finder/modules'],
    ['/twig-field-finder/', '', '/twig-field-finder/'],
    ['/', '', '/'],
  ])('joinBase(%j, %j) → %j', (base, path, expected) => {
    expect(joinBase(base, path)).toBe(expected);
  });
});
