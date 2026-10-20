import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { adjustForContrast, CODE_BACKGROUNDS, contrastRatio, MIN_CONTRAST } from './contrast';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../styles/global.css'),
  'utf8',
);

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('composites translucent colours over the background', () => {
    expect(contrastRatio('#00000000', '#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('adjustForContrast', () => {
  it('leaves passing colours alone', () => {
    expect(adjustForContrast('#1c1f22', '#ffffff')).toBe('#1c1f22');
  });

  it('darkens on light backgrounds and lightens on dark ones until AA passes', () => {
    const light = adjustForContrast('#999999', CODE_BACKGROUNDS.light);
    const dark = adjustForContrast('#666666', CODE_BACKGROUNDS.dark);
    expect(contrastRatio(light, CODE_BACKGROUNDS.light)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    expect(contrastRatio(dark, CODE_BACKGROUNDS.dark)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    expect(parseInt(light.slice(1, 3), 16)).toBeLessThan(0x99);
    expect(parseInt(dark.slice(1, 3), 16)).toBeGreaterThan(0x66);
  });
});

describe('CODE_BACKGROUNDS', () => {
  it('matches --code-bg in global.css for both themes', () => {
    const values = [...css.matchAll(/--code-bg:\s*(#[0-9a-f]{6})/g)].map((m) => m[1]);
    expect(values[0]).toBe(CODE_BACKGROUNDS.light);
    expect(values.slice(1)).toEqual([CODE_BACKGROUNDS.dark, CODE_BACKGROUNDS.dark]);
  });
});
