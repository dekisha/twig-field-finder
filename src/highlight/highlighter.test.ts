import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createHighlighterCore, type ThemeRegistration } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { CODE_BACKGROUNDS, contrastRatio, MIN_CONTRAST } from '@/lib/contrast';

import { getHighlighter, highlightTwig, THEMES } from './highlighter';
import darkTheme from './themes/tff-dark.json';
import lightTheme from './themes/tff-light.json';
import grammar from './twig.tmLanguage.json';

const entriesDir = join(dirname(fileURLToPath(import.meta.url)), '../content/entries');

const corpus = readdirSync(entriesDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.yaml'))
  .flatMap((f) => {
    const e = parse(readFileSync(join(entriesDir, f), 'utf8')) as {
      raw?: string[];
      render?: string[];
      helper?: { code: string }[];
    };
    return [...(e.raw ?? []), ...(e.render ?? []), ...(e.helper ?? []).map((h) => h.code)];
  });

describe('trimmed Twig grammar', () => {
  it('has no embedded-language includes', () => {
    const external: string[] = [];
    JSON.stringify(grammar, (key, value: unknown) => {
      if (key === 'include' && typeof value === 'string' && !value.startsWith('#')) {
        external.push(value);
      }
      return value;
    });
    expect(external).toEqual([]);
  });

  it('stays small', () => {
    expect(JSON.stringify(grammar).length).toBeLessThan(20_000);
  });

  it('tokenises the corpus identically when precompiled', async () => {
    // Reference: the JSON grammar through Shiki's runtime Oniguruma→JS conversion.
    const reference = await createHighlighterCore({
      themes: [lightTheme as ThemeRegistration],
      langs: [grammar],
      engine: createJavaScriptRegexEngine({ target: 'ES2024' }),
    });
    const precompiled = await getHighlighter();
    for (const code of corpus) {
      const opts = { lang: 'twig', theme: THEMES.light, includeExplanation: 'scopeName' } as const;
      expect(precompiled.codeToTokensBase(code, opts), code).toEqual(
        reference.codeToTokensBase(code, opts),
      );
    }
  });
});

describe('highlightTwig', () => {
  it('emits dual-theme CSS variables without inline default colours', async () => {
    const html = await highlightTwig('{{ node.field_cta.value|render }}');
    expect(html).toContain('--shiki-light:');
    expect(html).toContain('--shiki-dark:');
    expect(html).not.toMatch(/[;"]color:/);
  });

  it('escapes HTML in snippets', async () => {
    const html = await highlightTwig("{{ '<script>' }}");
    expect(html).not.toContain('<script>');
    expect(html).toContain('&#x3C;script>');
  });

  it.each(corpus)('tokenises %s', async (code) => {
    const hl = await getHighlighter();
    const tokens = hl.codeToTokensBase(code, { lang: 'twig', theme: THEMES.light }).flat();
    // Tokenised into Twig scopes, not one plain-text run.
    expect(tokens.length).toBeGreaterThan(1);
    expect(new Set(tokens.map((t) => t.color)).size).toBeGreaterThan(1);
  });
});

describe('marks', () => {
  it('wraps substituted values, even when they span several tokens', async () => {
    const code = "{{ content['#block_content'].field_cta.value }}";
    const start = code.indexOf('content');
    const html = await highlightTwig(code, [
      { start, end: start + "content['#block_content']".length, className: 'code-value' },
    ]);
    expect(html).toContain('class="code-value"');
  });

  it('ignores empty ranges', async () => {
    const html = await highlightTwig('{{ x }}', [{ start: 3, end: 3, className: 'code-value' }]);
    expect(html).not.toContain('code-value');
  });
});

describe('break hints', () => {
  it('adds <wbr> after path separators without changing the text', async () => {
    const html = await highlightTwig('{{ node.field_x.value }}');
    expect(html).toContain('<wbr>');
    expect(html.replace(/<[^>]+>/g, '')).toBe('{{ node.field_x.value }}');
  });
});

describe('themes', () => {
  it.each([
    ['light', lightTheme, CODE_BACKGROUNDS.light],
    ['dark', darkTheme, CODE_BACKGROUNDS.dark],
  ] as const)('%s: every token colour meets AA on the code background', (_, theme, bg) => {
    const failing = theme.tokenColors
      .map((rule) => ('foreground' in rule.settings ? rule.settings.foreground : undefined))
      .filter((fg): fg is string => typeof fg === 'string')
      .filter((fg) => contrastRatio(fg, bg) < MIN_CONTRAST);
    expect(failing).toEqual([]);
  });

  it.each(['light', 'dark'] as const)('%s: every token in the corpus meets AA', async (mode) => {
    const hl = await getHighlighter();
    for (const code of corpus) {
      for (const token of hl.codeToTokensBase(code, { lang: 'twig', theme: THEMES[mode] }).flat()) {
        expect(
          contrastRatio(token.color ?? '#000000', CODE_BACKGROUNDS[mode]),
          code,
        ).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    }
  });
});
