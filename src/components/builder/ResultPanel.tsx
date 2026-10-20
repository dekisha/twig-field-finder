import { Tab, TabList, TabPanel, Tabs, type Key } from 'react-aria-components';

import { InlineCode } from '@/components/InlineCode';
import { ModuleBadge } from '@/components/ModuleBadge';
import type { Module } from '@/data/types';
import {
  APPROACH_DESCRIPTIONS,
  APPROACH_LABELS,
  isApproach,
  type Approach,
  type Entry,
} from '@/lib/entry';
import { withBase } from '@/lib/paths';

import { CopyButton } from './CopyButton';
import { SnippetCode, type Highlighter } from './SnippetCode';
import type { ResolvedSnippet } from './useBuilderState';

interface Props {
  entry: Entry;
  groupLabel: string;
  approaches: readonly Approach[];
  approach: Approach;
  onApproachChange: (approach: Approach) => void;
  snippets: readonly ResolvedSnippet[];
  modules: ReadonlyMap<string, Module>;
  highlighter: Highlighter | null;
  showReview: boolean;
}

/** The hero: the finished Twig, ready to copy. */
export function ResultPanel({
  entry,
  groupLabel,
  approaches,
  approach,
  onApproachChange,
  snippets,
  modules,
  highlighter,
  showReview,
}: Props) {
  const body = (
    <ApproachBody
      approach={approach}
      snippets={snippets}
      modules={modules}
      highlighter={highlighter}
    />
  );

  return (
    <section
      aria-labelledby="result-heading"
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_0_rgb(0_0_0/0.03),0_12px_32px_-12px_rgb(0_0_0/0.12)]"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 pt-5 pb-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-subtle uppercase">{groupLabel}</p>
          <h2 id="result-heading" className="mt-1 text-xl font-semibold tracking-tight text-ink">
            {entry.label}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={withBase(`/fields/${entry.id}/`)}
            className="inline-flex min-h-8 items-center rounded-md px-2.5 text-sm font-medium text-muted hover:bg-sunken hover:text-ink"
          >
            Reference page<span className="sr-only">: {entry.label}</span>
          </a>
          {snippets.length > 1 && (
            <CopyButton
              text={snippets.map((s) => s.code).join('\n')}
              label={`Copy all ${String(snippets.length)} snippets`}
              variant="quiet"
            >
              Copy all
            </CopyButton>
          )}
        </div>
      </header>

      {approaches.length > 1 ? (
        <Tabs
          selectedKey={approach}
          onSelectionChange={(key: Key) => {
            if (isApproach(key)) onApproachChange(key);
          }}
        >
          <TabList
            aria-label="Approach"
            className="flex gap-1 overflow-x-auto border-b border-line px-3 sm:px-4"
          >
            {approaches.map((a) => (
              <Tab
                key={a}
                id={a}
                className="relative -mb-px cursor-default border-b-2 border-transparent px-2.5 py-3 text-sm font-medium whitespace-nowrap text-muted hover:text-ink data-focus-visible:rounded-t-md data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-focus data-selected:border-accent data-selected:text-ink"
              >
                {APPROACH_LABELS[a]}
              </Tab>
            ))}
          </TabList>
          {approaches.map((a) => (
            <TabPanel
              key={a}
              id={a}
              className="data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-focus"
            >
              {body}
            </TabPanel>
          ))}
        </Tabs>
      ) : (
        <div>
          <h3 className="border-b border-line px-5 py-3 text-sm font-medium text-ink sm:px-6">
            {APPROACH_LABELS[approach]}
            <span className="font-normal text-muted"> · the only approach for this field</span>
          </h3>
          {body}
        </div>
      )}

      {(entry.notes !== undefined || (showReview && entry.review !== undefined)) && (
        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:px-6">
          {entry.notes !== undefined && (
            <div
              role="note"
              className="rounded-lg border-l-4 border-note-line bg-note px-4 py-3 text-sm/6 text-ink"
            >
              <p className="mb-0.5 font-semibold">Gotcha</p>
              <p>
                <InlineCode text={entry.notes} />
              </p>
            </div>
          )}
          {showReview && entry.review !== undefined && (
            <div
              role="note"
              className="rounded-lg border-l-4 border-review-line bg-review px-4 py-3 text-sm/6 text-review-ink"
            >
              <p className="mb-0.5 font-semibold">Needs verification · dev only</p>
              <p>
                <InlineCode text={entry.review} />
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ApproachBody({
  approach,
  snippets,
  modules,
  highlighter,
}: {
  approach: Approach;
  snippets: readonly ResolvedSnippet[];
  modules: ReadonlyMap<string, Module>;
  highlighter: Highlighter | null;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-5 sm:px-6">
      <p className="text-sm text-muted">
        <InlineCode text={APPROACH_DESCRIPTIONS[approach]} />
      </p>
      <ol className="flex flex-col gap-3">
        {snippets.map((snippet, i) => {
          const module = snippet.module === undefined ? undefined : modules.get(snippet.module);
          return (
            <li
              key={`${String(i)}:${snippet.template}`}
              className="overflow-hidden rounded-xl border border-line bg-code"
            >
              <div className="flex items-center justify-between gap-3 border-b border-line py-1.5 pr-1.5 pl-4">
                <span className="text-xs text-subtle">
                  {module ? (
                    <ModuleBadge module={module} />
                  ) : snippets.length > 1 ? (
                    `Snippet ${String(i + 1)}`
                  ) : (
                    'Twig'
                  )}
                </span>
                <CopyButton
                  text={snippet.code}
                  {...(snippets.length > 1 && {
                    label: `Copy snippet ${String(i + 1)} of ${String(snippets.length)}`,
                  })}
                />
              </div>
              <SnippetCode code={snippet.code} ranges={snippet.ranges} highlighter={highlighter} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
