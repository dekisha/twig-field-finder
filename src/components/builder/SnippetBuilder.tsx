import { useMemo } from 'react';

import type { Group, Module } from '@/data/types';
import type { Approach, Entry } from '@/lib/entry';

import { AnnouncerProvider } from './Announcer';
import { EntityContextControl } from './EntityContextControl';
import { EntryPicker } from './EntryPicker';
import { FieldNameInput } from './FieldNameInput';
import { ResultPanel } from './ResultPanel';
import { useBuilderState } from './useBuilderState';
import { useHighlighter } from './useHighlighter';

export interface SnippetBuilderProps {
  entries: Entry[];
  groups: Group[];
  modules: Module[];
  defaultEntry: string;
  /** Show review notes (development builds only). */
  showReview: boolean;
}

/** Why the entity selector does nothing for the current snippets. */
function entityDisabledReason(approach: Approach): string {
  return approach === 'render'
    ? 'Render-array snippets read `content`, which is the same in every entity template.'
    : 'These snippets use a fixed variable, so they don’t change with the entity.';
}

export function SnippetBuilder({
  entries,
  groups,
  modules,
  defaultEntry,
  showReview,
}: SnippetBuilderProps) {
  const builder = useBuilderState(entries, defaultEntry);
  const highlighter = useHighlighter();
  const { entry, approach, state } = builder;

  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const groupLabel = groups.find((g) => g.id === entry.group)?.label ?? entry.group;

  return (
    <AnnouncerProvider>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <section aria-labelledby="controls-heading" className="flex flex-col gap-6">
          <h2 id="controls-heading" className="sr-only">
            Build your snippet
          </h2>
          <EntryPicker
            entries={entries}
            groups={groups}
            value={entry.id}
            onChange={builder.setEntry}
            showReview={showReview}
          />
          <FieldNameInput
            label="Field machine name"
            value={state.field}
            onChange={builder.setField}
            placeholder="field_hero_image"
            description="As shown in Manage fields, e.g. field_hero_image."
            disabledReason={
              entry.usesField
                ? undefined
                : `${entry.label} is a property of the entity itself, so there’s no field name.`
            }
          />
          {builder.usesSubfield && (
            <FieldNameInput
              label="Field on the referenced entity"
              value={state.subfield}
              onChange={builder.setSubfield}
              placeholder="field_image"
              description="The field to read from the entity that the reference points to."
            />
          )}
          <EntityContextControl
            value={state.entity}
            onChange={builder.setEntity}
            disabledReason={builder.usesEntity ? undefined : entityDisabledReason(approach)}
          />
        </section>

        <div className="lg:sticky lg:top-6">
          <ResultPanel
            entry={entry}
            groupLabel={groupLabel}
            approaches={builder.approaches}
            approach={approach}
            onApproachChange={builder.setApproach}
            snippets={builder.snippets}
            modules={moduleMap}
            highlighter={highlighter}
            showReview={showReview}
          />
        </div>
      </div>
    </AnnouncerProvider>
  );
}
