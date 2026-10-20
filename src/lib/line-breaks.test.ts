import { describe, expect, it } from 'vitest';

import { endsWithBreakPoint, splitAtBreakPoints } from './line-breaks';

describe('splitAtBreakPoints', () => {
  it('splits after dots, pipes, commas and opening parentheses', () => {
    expect(splitAtBreakPoints("node.field_x|image_style('a', 'b')")).toEqual([
      'node.',
      'field_x|',
      'image_style(',
      "'a',",
      " 'b')",
    ]);
  });

  it('round-trips', () => {
    const text = '{{ file_url(node.field_x.entity.uri.value) }}';
    expect(splitAtBreakPoints(text).join('')).toBe(text);
  });

  it('leaves text without break points alone', () => {
    expect(splitAtBreakPoints('{{ url }}')).toEqual(['{{ url }}']);
    expect(splitAtBreakPoints('')).toEqual(['']);
  });
});

describe('endsWithBreakPoint', () => {
  it('detects a trailing break point', () => {
    expect(endsWithBreakPoint('.')).toBe(true);
    expect(endsWithBreakPoint('file_url(')).toBe(true);
    expect(endsWithBreakPoint('value')).toBe(false);
    expect(endsWithBreakPoint('')).toBe(false);
  });
});
