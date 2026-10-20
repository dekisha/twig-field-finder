import { describe, expect, it } from 'vitest';

import { suggestFieldPrefix, validateFieldName } from './field-name';

describe('validateFieldName', () => {
  it.each(['field_hero_image', 'body', 'a', 'field_2col', 'field__double'])(
    'accepts %s',
    (name) => {
      expect(validateFieldName(name)).toEqual({ valid: true });
    },
  );

  it.each([
    ['', 'empty'],
    ['Field_hero', 'uppercase'],
    ['FIELD_HERO', 'uppercase'],
    ['1field', 'leading-digit'],
    ['_field', 'leading-underscore'],
    ['field-hero', 'invalid-chars'],
    ['field hero', 'invalid-chars'],
    ['field.hero', 'invalid-chars'],
    ['fiéld', 'invalid-chars'],
    ['Field-Hero', 'invalid-chars'],
  ] as const)('rejects %j as %s', (name, error) => {
    expect(validateFieldName(name)).toEqual({ valid: false, error });
  });

  it('warns, without failing, above 32 characters', () => {
    expect(validateFieldName(`field_${'x'.repeat(26)}`)).toEqual({ valid: true });
    expect(validateFieldName(`field_${'x'.repeat(27)}`)).toEqual({
      valid: true,
      warning: 'too-long',
    });
  });
});

describe('suggestFieldPrefix', () => {
  it('suggests the field_ prefix for unprefixed names', () => {
    expect(suggestFieldPrefix('hero_image')).toBe('field_hero_image');
    expect(suggestFieldPrefix('cta')).toBe('field_cta');
  });

  it('does not suggest when the prefix is already there', () => {
    expect(suggestFieldPrefix('field_hero_image')).toBeNull();
  });

  it('does not suggest while the user is typing the prefix', () => {
    expect(suggestFieldPrefix('f')).toBeNull();
    expect(suggestFieldPrefix('fie')).toBeNull();
    expect(suggestFieldPrefix('field')).toBeNull();
  });

  it('suggests for names that merely start with "field"', () => {
    expect(suggestFieldPrefix('fieldset')).toBe('field_fieldset');
  });

  it('does not suggest for base fields', () => {
    expect(suggestFieldPrefix('body')).toBeNull();
    expect(suggestFieldPrefix('title')).toBeNull();
    expect(suggestFieldPrefix('uid')).toBeNull();
  });

  it('does not suggest for invalid names', () => {
    expect(suggestFieldPrefix('')).toBeNull();
    expect(suggestFieldPrefix('Hero')).toBeNull();
    expect(suggestFieldPrefix('hero-image')).toBeNull();
  });
});
