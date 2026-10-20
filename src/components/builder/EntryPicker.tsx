import { useMemo, useState } from 'react';
import {
  Button,
  Collection,
  ComboBox,
  Header,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
  Text,
  type Key,
} from 'react-aria-components';

import type { Group } from '@/data/types';
import type { Entry } from '@/lib/entry';
import { createEntrySearch } from '@/lib/search';

interface Section {
  id: string;
  label: string;
  items: Entry[];
}

interface Props {
  entries: readonly Entry[];
  groups: readonly Group[];
  value: string;
  onChange: (id: string) => void;
  showReview: boolean;
}

/**
 * Searchable, grouped field-type picker. React Aria provides the WAI-ARIA
 * combobox pattern (focus management, `aria-activedescendant`, announcements);
 * filtering and ranking are ours (Fuse), so `items` is controlled.
 */
export function EntryPicker({ entries, groups, value, onChange, showReview }: Props) {
  const groupLabels = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g.label])),
    [groups],
  );
  const search = useMemo(() => createEntrySearch(entries, groupLabels), [entries, groupLabels]);
  const selectedLabel = entries.find((e) => e.id === value)?.label ?? '';

  const [inputValue, setInputValue] = useState(selectedLabel);
  const [query, setQuery] = useState('');

  // Follow external selection changes (state restored from the URL) by
  // adjusting state during render rather than in an effect.
  const [syncedLabel, setSyncedLabel] = useState(selectedLabel);
  if (syncedLabel !== selectedLabel) {
    setSyncedLabel(selectedLabel);
    setInputValue(selectedLabel);
    setQuery('');
  }

  const sections = useMemo(
    () => toSections(search(query), groups, query !== ''),
    [search, query, groups],
  );

  return (
    <ComboBox
      className="group/picker flex flex-col gap-1.5"
      items={sections}
      value={value}
      inputValue={inputValue}
      onInputChange={(next) => {
        setInputValue(next);
        // Typing the selected label back in (React Aria does this on close)
        // isn't a search.
        setQuery(next === selectedLabel ? '' : next);
      }}
      onChange={(key: Key | null) => {
        if (key === null) return;
        onChange(String(key));
        setQuery('');
      }}
      onOpenChange={(isOpen, trigger) => {
        // The button shows the full list rather than the current text's matches.
        if (isOpen && trigger === 'manual') setQuery('');
      }}
      allowsEmptyCollection
    >
      <Label className="text-sm font-medium text-ink">What do you want to get?</Label>
      <div className="relative">
        <Input
          className="w-full rounded-lg border border-control bg-surface py-2.5 pr-11 pl-3 text-base text-ink placeholder:text-subtle data-focused:border-accent data-focused:outline-2 data-focused:outline-offset-0 data-focused:outline-accent/30"
          placeholder="Search field types, e.g. image alt"
          // Typing starts a new search instead of appending to the current label.
          // Only while it still shows that label: focus also bounces when the
          // popover opens, and re-selecting then would eat keystrokes mid-search.
          onFocus={(event) => {
            if (event.currentTarget.value === selectedLabel) event.currentTarget.select();
          }}
        />
        <Button
          aria-label="Show all field types"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted hover:text-ink data-focus-visible:outline-2 data-focus-visible:outline-focus"
        >
          <ChevronIcon />
        </Button>
      </div>
      <Text slot="description" className="text-sm text-muted">
        Fuzzy search across field types, properties and groups.
      </Text>
      <Popover
        offset={6}
        // React Aria sizes the popover to the space available (inline max-height);
        // the list flexes into it and scrolls internally. Scrolling the selected
        // item into view must never scroll the page: that closes the popover.
        className="flex w-(--trigger-width) flex-col overflow-hidden rounded-lg border border-line-strong bg-surface shadow-lg shadow-black/10"
      >
        <ListBox<Section>
          className="max-h-96 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 outline-none"
          renderEmptyState={() => (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No field types match “{query}”.
            </p>
          )}
        >
          {(section) => (
            <ListBoxSection id={section.id} className="not-first:mt-1">
              <Header className="sticky top-0 z-10 bg-surface px-2.5 pt-2 pb-1 text-xs font-semibold tracking-wider text-subtle uppercase">
                {section.label}
              </Header>
              <Collection items={section.items}>
                {(entry) => (
                  <ListBoxItem
                    id={entry.id}
                    textValue={entry.label}
                    className="flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink outline-none data-focused:bg-accent-soft data-focused:shadow-[inset_3px_0_0_var(--color-accent)] data-selected:font-medium"
                  >
                    {({ isSelected }) => (
                      <>
                        <span className="flex-1">{entry.label}</span>
                        {showReview && entry.review !== undefined && (
                          <span
                            className="size-2 shrink-0 rounded-full bg-review-line"
                            title="Needs verification"
                          >
                            <span className="sr-only">, needs verification</span>
                          </span>
                        )}
                        {isSelected && <CheckIcon />}
                      </>
                    )}
                  </ListBoxItem>
                )}
              </Collection>
            </ListBoxSection>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

/**
 * Group results into sections. Without a query, groups keep their configured
 * order; with one, a group ranks by its best match and items keep their rank.
 */
function toSections(results: Entry[], groups: readonly Group[], ranked: boolean): Section[] {
  const byGroup = new Map<string, Entry[]>();
  for (const entry of results) {
    byGroup.set(entry.group, [...(byGroup.get(entry.group) ?? []), entry]);
  }
  const order = ranked ? [...byGroup.keys()] : groups.map((g) => g.id);
  const labels = new Map(groups.map((g) => [g.id, g.label]));
  return order.flatMap((id) => {
    const items = byGroup.get(id);
    // Section keys share one key space with item keys, and some groups hold an
    // entry with the same id (`address`, `config-pages`): namespace them.
    return items ? [{ id: `group:${id}`, label: labels.get(id) ?? id, items }] : [];
  });
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
      <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 text-accent" fill="none">
      <path
        d="m4.5 10.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
