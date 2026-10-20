/** WCAG 2.x contrast helpers. */

export const MIN_CONTRAST = 4.5;

/**
 * Background of code blocks per theme. Must match `--code-bg` in
 * src/styles/global.css (a test checks this).
 */
export const CODE_BACKGROUNDS = { light: '#fbfaf6', dark: '#10161a' } as const;

type Rgb = [number, number, number];

function parseHex(hex: string): { rgb: Rgb; alpha: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 || h.length === 4 ? h.replace(/./g, '$&$&') : h;
  const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
  return { rgb: [n(0), n(2), n(4)], alpha: full.length === 8 ? n(6) / 255 : 1 };
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Composite a possibly translucent colour over an opaque background. */
function composite(color: string, background: string): Rgb {
  const { rgb, alpha } = parseHex(color);
  const bg = parseHex(background).rgb;
  return [0, 1, 2].map((i) => (rgb[i] ?? 0) * alpha + (bg[i] ?? 0) * (1 - alpha)) as Rgb;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(composite(foreground, background));
  const b = luminance(parseHex(background).rgb);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function rgbToHsl([r, g, b]: Rgb): Rgb {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rn
      ? (gn - bn) / d + (gn < bn ? 6 : 0)
      : max === gn
        ? (bn - rn) / d + 2
        : (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb([h, s, l]: Rgb): Rgb {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

/**
 * Return `color` unchanged if it reaches `min` contrast on `background`;
 * otherwise the nearest colour with the same hue and saturation that does
 * (darker on light backgrounds, lighter on dark ones), as opaque hex.
 */
export function adjustForContrast(color: string, background: string, min = MIN_CONTRAST): string {
  if (contrastRatio(color, background) >= min) return color;
  const [h, s, l] = rgbToHsl(composite(color, background));
  const darken = luminance(parseHex(background).rgb) > 0.5;
  for (let step = 1; step <= 100; step++) {
    const next = Math.min(1, Math.max(0, darken ? l - step / 100 : l + step / 100));
    const candidate = toHex(hslToRgb([h, s, next]));
    if (contrastRatio(candidate, background) >= min) return candidate;
  }
  return darken ? '#000000' : '#ffffff';
}
