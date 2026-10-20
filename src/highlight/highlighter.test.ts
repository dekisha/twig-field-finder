import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import grammar from './twig.tmLanguage.json';
import { getHighlighter, highlightTwig, THEMES } from './highlighter';

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
      themes: [import('@shikijs/themes/vitesse-light')],
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
