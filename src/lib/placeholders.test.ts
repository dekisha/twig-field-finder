import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VALUES,
  placeholdersIn,
  substitute,
  substituteSegments,
  substituteWithRanges,
  unknownPlaceholdersIn,
} from './placeholders';

const values = { entity: 'paragraph', field: 'field_cta', subfield: 'field_image' };

describe('substitute', () => {
  it('replaces every placeholder', () => {
    expect(substitute('{{ __ENTITY__.__FIELD__.entity.__SUBFIELD__.value }}', values)).toBe(
      '{{ paragraph.field_cta.entity.field_image.value }}',
    );
  });

  it('replaces repeated placeholders', () => {
    const code =
      '{% if not __ENTITY__.__FIELD__.isEmpty() %}\n  {{ content.__FIELD__ }}\n{% endif %}';
    expect(substitute(code, values)).toBe(
      '{% if not paragraph.field_cta.isEmpty() %}\n  {{ content.field_cta }}\n{% endif %}',
    );
  });

  it('leaves render-array access and literal variables alone', () => {
    expect(substitute("{{ content.__FIELD__[0]['#markup'] }}", values)).toBe(
      "{{ content.field_cta[0]['#markup'] }}",
    );
    expect(substitute('{{ node.type.entity.label() }}', values)).toBe(
      '{{ node.type.entity.label() }}',
    );
    expect(
      substitute('{{ paragraph.getParentEntity().__FIELD__.value }}', { field: 'field_x' }),
    ).toBe('{{ paragraph.getParentEntity().field_x.value }}');
  });

  it('replaces placeholders inside string literals', () => {
    expect(
      substitute("{{ config_pages_field('my_config_page', '__FIELD__', 'full') }}", values),
    ).toBe("{{ config_pages_field('my_config_page', 'field_cta', 'full') }}");
  });

  it('falls back to readable defaults for empty or blank values', () => {
    expect(substitute('{{ __ENTITY__.__FIELD__.__SUBFIELD__ }}', { field: '   ' })).toBe(
      `{{ ${DEFAULT_VALUES.entity}.${DEFAULT_VALUES.field}.${DEFAULT_VALUES.subfield} }}`,
    );
  });

  it('trims values', () => {
    expect(substitute('{{ node.__FIELD__ }}', { field: ' field_a ' })).toBe('{{ node.field_a }}');
  });

  it('keeps unknown tokens untouched', () => {
    expect(substitute('{{ __OTHER__.__FIELD__ }}', values)).toBe('{{ __OTHER__.field_cta }}');
  });

  it('does not match tokens inside longer identifiers in an unsafe way', () => {
    // `field__FIELD__` is not something the data contains, but the result must be predictable.
    expect(substitute('a__FIELD__b', values)).toBe('afield_ctab');
  });
});

describe('placeholdersIn', () => {
  it('finds placeholders across snippets', () => {
    expect(placeholdersIn(['{{ __ENTITY__.id() }}', '{{ content.__FIELD__ }}'])).toEqual(
      new Set(['entity', 'field']),
    );
  });

  it('returns an empty set when there are none', () => {
    expect(placeholdersIn('{{ url }}').size).toBe(0);
  });

  it('accepts a single string', () => {
    expect(placeholdersIn('{{ x.__SUBFIELD__ }}')).toEqual(new Set(['subfield']));
  });
});

describe('unknownPlaceholdersIn', () => {
  it('reports tokens that look like placeholders but are not known', () => {
    expect(unknownPlaceholdersIn('{{ __ENTITY__.__FEILD__ }}')).toEqual(['__FEILD__']);
  });

  it('ignores Twig dunder-ish names that are not upper-case tokens', () => {
    expect(unknownPlaceholdersIn('{{ item.__toString }}')).toEqual([]);
  });
});

describe('substituteSegments', () => {
  it('splits code into literal and substituted segments', () => {
    expect(substituteSegments('{{ __ENTITY__.__FIELD__ }}', { entity: 'node', field: '' })).toEqual(
      [
        { text: '{{ ' },
        { text: 'node', placeholder: 'entity' },
        { text: '.' },
        { text: DEFAULT_VALUES.field, placeholder: 'field', isDefault: true },
        { text: ' }}' },
      ],
    );
  });

  it('joins back to the same string as substitute()', () => {
    const code = '{{ file_url(__ENTITY__.__FIELD__.entity.__SUBFIELD__.entity.uri.value) }}';
    const joined = substituteSegments(code, values)
      .map((s) => s.text)
      .join('');
    expect(joined).toBe(substitute(code, values));
  });

  it('returns one literal segment when there are no placeholders', () => {
    expect(substituteSegments('{{ url }}', values)).toEqual([{ text: '{{ url }}' }]);
  });
});

describe('substituteWithRanges', () => {
  it('reports where each substituted value landed', () => {
    const { code, ranges } = substituteWithRanges('{{ __ENTITY__.__FIELD__ }}', {
      entity: 'term',
      field: '',
    });
    expect(code).toBe('{{ term.field_name }}');
    expect(ranges).toEqual([
      { start: 3, end: 7, placeholder: 'entity', isDefault: false },
      { start: 8, end: 18, placeholder: 'field', isDefault: true },
    ]);
    for (const r of ranges) expect(code.slice(r.start, r.end)).not.toContain('__');
  });
});
