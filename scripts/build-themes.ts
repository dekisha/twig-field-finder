/**
 * Generate WCAG AA versions of the Vitesse themes for our code backgrounds.
 *
 * Vitesse's palette is lovely but many token colours sit around 2.3–4.4:1 on a
 * light background (variables, strings, punctuation). Each foreground below
 * 4.5:1 keeps its hue and saturation and only moves in lightness until it
 * passes; colours that already pass are untouched.
 *
 *   pnpm highlight:build
 *
 * Source themes: https://github.com/antfu/vscode-theme-vitesse (MIT).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import vitesseDark from '@shikijs/themes/vitesse-dark';
import vitesseLight from '@shikijs/themes/vitesse-light';
import type { ThemeRegistration } from 'shiki/core';

import { CODE_BACKGROUNDS, MIN_CONTRAST, adjustForContrast } from '../src/lib/contrast';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/highlight/themes');

function accessible(theme: ThemeRegistration, name: string, background: string): ThemeRegistration {
  const fix = (color: string) => adjustForContrast(color, background, MIN_CONTRAST);
  return {
    ...theme,
    name,
    colors: Object.fromEntries(
      Object.entries(theme.colors ?? {}).map(([key, value]) => [
        key,
        key === 'editor.foreground' ? fix(value) : value,
      ]),
    ),
    tokenColors: (theme.tokenColors ?? []).map((rule) => ({
      ...rule,
      settings: {
        ...rule.settings,
        ...(rule.settings.foreground !== undefined && {
          foreground: fix(rule.settings.foreground),
        }),
      },
    })),
    ...(theme.fg !== undefined && { fg: fix(theme.fg) }),
  };
}

await mkdir(outDir, { recursive: true });
for (const [theme, name, background] of [
  [vitesseLight, 'tff-light', CODE_BACKGROUNDS.light],
  [vitesseDark, 'tff-dark', CODE_BACKGROUNDS.dark],
] as const) {
  const out = accessible(theme, name, background);
  await writeFile(join(outDir, `${name}.json`), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Wrote ${name}.json (on ${background})`);
}
