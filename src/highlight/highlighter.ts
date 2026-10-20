/**
 * Twig syntax highlighting with Shiki's fine-grained core bundle: one trimmed,
 * precompiled grammar, two themes, and the raw JavaScript regex engine (no
 * WASM, no Oniguruma→JS conversion at runtime). See scripts/build-twig-grammar.ts.
 *
 * Used at build time by static pages and lazily on the client by the builder
 * island (`import('@/highlight/highlighter')`), so it stays out of the initial
 * bundle.
 */
import type { Element, ElementContent, Root } from 'hast';
import type { HighlighterCore, ShikiTransformer, ThemeRegistration } from 'shiki/core';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRawEngine } from 'shiki/engine/javascript';

import { endsWithBreakPoint, splitAtBreakPoints } from '@/lib/line-breaks';

import twig from './twig.precompiled';

/** Vitesse, adjusted to WCAG AA on our code backgrounds (scripts/build-themes.ts). */
export const THEMES = {
  light: 'tff-light',
  dark: 'tff-dark',
} as const;

let highlighter: Promise<HighlighterCore> | undefined;

export function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    // Generated JSON is typed loosely by TypeScript; it is a ThemeRegistration.
    themes: [
      import('./themes/tff-light.json').then((m) => m.default as ThemeRegistration),
      import('./themes/tff-dark.json').then((m) => m.default as ThemeRegistration),
    ],
    langs: [twig],
    engine: createJavaScriptRawEngine(),
  });
  return highlighter;
}

/** A character range to wrap in a class, e.g. a substituted placeholder value. */
export interface Mark {
  start: number;
  end: number;
  className: string;
}

/**
 * Highlight Twig as HTML with an already-loaded highlighter (synchronous, so
 * the builder can re-render on every keystroke). Colours are emitted only as
 * `--shiki-light` / `--shiki-dark` CSS variables (`defaultColor: false`);
 * global CSS picks one for the active theme, so switching themes never
 * re-highlights.
 */
export function renderTwig(hl: HighlighterCore, code: string, marks: readonly Mark[] = []): string {
  return hl.codeToHtml(code, {
    lang: 'twig',
    themes: THEMES,
    defaultColor: false,
    // Blocks wrap instead of scrolling, so they needn't be tab stops.
    tabindex: false,
    decorations: marks
      .filter((m) => m.end > m.start)
      .map(({ start, end, className }) => ({ start, end, properties: { class: className } })),
    transformers: [breakHints],
  });
}

/** Insert `<wbr>` after path separators so wrapped lines break between segments. */
const breakHints: ShikiTransformer = {
  name: 'twig-field-finder:break-hints',
  root(root: Root) {
    insertBreaks(root);
    return root;
  },
};

function insertBreaks(node: Root | Element): void {
  const children: ElementContent[] = [];
  for (const child of node.children) {
    if (child.type === 'element') {
      insertBreaks(child);
      children.push(child);
    } else if (child.type === 'text') {
      // Shiki often gives a separator its own token (`.`), so a hint goes
      // after any text ending in a break point, not only between parts.
      for (const value of splitAtBreakPoints(child.value)) {
        children.push({ type: 'text', value });
        if (endsWithBreakPoint(value)) {
          children.push({ type: 'element', tagName: 'wbr', properties: {}, children: [] });
        }
      }
    } else if (child.type !== 'doctype') {
      children.push(child);
    }
  }
  node.children = children;
}

export async function highlightTwig(code: string, marks: readonly Mark[] = []): Promise<string> {
  return renderTwig(await getHighlighter(), code, marks);
}
