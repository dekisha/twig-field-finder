import { Fragment, type ReactNode } from 'react';
import type { HighlighterCore } from 'shiki/core';

import type { Mark, renderTwig } from '@/highlight/highlighter';
import { endsWithBreakPoint, splitAtBreakPoints } from '@/lib/line-breaks';
import type { SubstitutedRange } from '@/lib/placeholders';

export interface Highlighter {
  hl: HighlighterCore;
  render: typeof renderTwig;
}

interface Props {
  code: string;
  ranges: readonly SubstitutedRange[];
  highlighter: Highlighter | null;
}

function markClass(range: SubstitutedRange): string {
  return range.isDefault ? 'code-default' : 'code-value';
}

/**
 * A Twig snippet with substituted values marked. Renders plain (but marked)
 * code until Shiki has loaded, then swaps in the highlighted version. Both use
 * the same box, font and wrapping, so the swap doesn't shift layout.
 */
export function SnippetCode({ code, ranges, highlighter }: Props) {
  const className = 'snippet-code';

  if (highlighter) {
    const marks: Mark[] = ranges.map((r) => ({
      start: r.start,
      end: r.end,
      className: markClass(r),
    }));
    return (
      <div
        className={className}
        // Shiki escapes the code; marks only add class attributes.
        dangerouslySetInnerHTML={{ __html: highlighter.render(highlighter.hl, code, marks) }}
      />
    );
  }

  const pieces: ReactNode[] = [];
  let offset = 0;
  for (const range of ranges) {
    if (range.start > offset) pieces.push(withBreaks(code.slice(offset, range.start), offset));
    pieces.push(
      <span key={range.start} className={markClass(range)}>
        {withBreaks(code.slice(range.start, range.end), range.start)}
      </span>,
    );
    offset = range.end;
  }
  if (offset < code.length) pieces.push(withBreaks(code.slice(offset), offset));

  return (
    <div className={className}>
      <pre className="shiki">
        <code>{pieces}</code>
      </pre>
    </div>
  );
}

/** Same `<wbr>` hints as the highlighted version (see highlighter.ts). */
function withBreaks(text: string, offset: number): ReactNode {
  let at = offset;
  return splitAtBreakPoints(text).map((part) => {
    const key = at;
    at += part.length;
    return (
      <Fragment key={key}>
        {part}
        {endsWithBreakPoint(part) && <wbr />}
      </Fragment>
    );
  });
}
