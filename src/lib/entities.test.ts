import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENTITY_CONTEXT,
  ENTITY_CONTEXTS,
  entityVariable,
  isEntityContextId,
} from './entities';

describe('entity contexts', () => {
  it('maps each context to its template variable', () => {
    expect(entityVariable('node')).toBe('node');
    expect(entityVariable('paragraph')).toBe('paragraph');
    expect(entityVariable('media')).toBe('media');
    expect(entityVariable('taxonomy_term')).toBe('term');
    expect(entityVariable('user')).toBe('user');
    expect(entityVariable('block_content')).toBe("content['#block_content']");
  });

  it('lists contexts in the order shown in the UI', () => {
    expect(ENTITY_CONTEXTS.map((c) => c.id)).toEqual([
      'node',
      'paragraph',
      'media',
      'taxonomy_term',
      'user',
      'block_content',
    ]);
  });

  it('defaults to node', () => {
    expect(DEFAULT_ENTITY_CONTEXT).toBe('node');
  });

  it('guards context ids', () => {
    expect(isEntityContextId('taxonomy_term')).toBe(true);
    expect(isEntityContextId('term')).toBe(false);
    expect(isEntityContextId('')).toBe(false);
    expect(isEntityContextId(null)).toBe(false);
    expect(isEntityContextId('constructor')).toBe(false);
  });
});
