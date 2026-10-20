/**
 * Twig syntax highlighting with Shiki's fine-grained core bundle: one trimmed,
 * precompiled grammar, two themes, and the raw JavaScript regex engine (no
 * WASM, no Oniguruma→JS conversion at runtime). See scripts/build-twig-grammar.ts.
 *
 * Used at build time by static pages and lazily on the client by the builder
 * island (`import('@/highlight/highlighter')`), so it stays out of the initial
 * bundle.
 */
import type { HighlighterCore } from 'shiki/core';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRawEngine } from 'shiki/engine/javascript';

import twig from './twig.precompiled';

export const THEMES = {
  light: 'vitesse-light',
  dark: 'vitesse-dark',
} as const;

let highlighter: Promise<HighlighterCore> | undefined;

export function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [import('@shikijs/themes/vitesse-light'), import('@shikijs/themes/vitesse-dark')],
    langs: [twig],
    engine: createJavaScriptRawEngine(),
  });
  return highlighter;
}

/**
 * Highlight Twig as HTML. Colours are emitted only as `--shiki-light` /
 * `--shiki-dark` CSS variables (`defaultColor: false`); global CSS picks one
 * based on the active theme, so switching themes never re-highlights.
 */
export async function highlightTwig(code: string): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, { lang: 'twig', themes: THEMES, defaultColor: false });
}
