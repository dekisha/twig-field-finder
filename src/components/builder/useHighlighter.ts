import { useEffect, useState } from 'react';

import type { Highlighter } from './SnippetCode';

/**
 * Lazy-load Shiki after hydration. Until it resolves (or if it fails), callers
 * render plain code, which uses the same font and layout, so nothing shifts.
 */
export function useHighlighter(): Highlighter | null {
  const [loaded, setLoaded] = useState<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('@/highlight/highlighter')
      .then(async (mod) => {
        const hl = await mod.getHighlighter();
        if (!cancelled) setLoaded({ hl, render: mod.renderTwig });
      })
      .catch((error: unknown) => {
        // Highlighting is an enhancement: plain code stays fully usable.
        console.warn('Syntax highlighting unavailable', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return loaded;
}
