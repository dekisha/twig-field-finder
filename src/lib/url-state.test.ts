import { describe, expect, it } from 'vitest';

import { parseBuilderState, serializeBuilderState, type BuilderState } from './url-state';

const options = { entryIds: new Set(['image-alt', 'link-url']), defaultEntry: 'image-alt' };

describe('parseBuilderState', () => {
  it('reads every parameter', () => {
    expect(
      parseBuilderState(
        '?entry=link-url&field=field_cta&sub=field_x&entity=media&tab=render',
        options,
      ),
    ).toEqual({
      entry: 'link-url',
      field: 'field_cta',
      subfield: 'field_x',
      entity: 'media',
      approach: 'render',
    });
  });

  it('falls back to defaults for an empty query', () => {
    expect(parseBuilderState('', options)).toEqual({
      entry: 'image-alt',
      field: '',
      subfield: '',
      entity: 'node',
      approach: undefined,
    });
  });

  it('ignores unknown or invalid values', () => {
    expect(parseBuilderState('?entry=nope&entity=term&tab=fancy', options)).toMatchObject({
      entry: 'image-alt',
      entity: 'node',
      approach: undefined,
    });
  });

  it('keeps field input verbatim (validation is the UI’s job) but bounds its length', () => {
    expect(parseBuilderState('?field=Hero%20Image', options).field).toBe('Hero Image');
    expect(parseBuilderState(`?field=${'a'.repeat(200)}`, options).field).toHaveLength(64);
  });

  it('accepts URLSearchParams', () => {
    expect(parseBuilderState(new URLSearchParams({ entry: 'link-url' }), options).entry).toBe(
      'link-url',
    );
  });
});

describe('serializeBuilderState', () => {
  it('omits empty and default values', () => {
    expect(
      serializeBuilderState({ entry: 'image-alt', field: '', subfield: '', entity: 'node' }),
    ).toBe('entry=image-alt');
  });

  it('round-trips through parseBuilderState', () => {
    const state: BuilderState = {
      entry: 'link-url',
      field: 'field_cta',
      subfield: '',
      entity: 'taxonomy_term',
      approach: 'helper',
    };
    expect(parseBuilderState(serializeBuilderState(state), options)).toEqual(state);
  });
});
