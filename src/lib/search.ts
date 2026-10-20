import Fuse, { type IFuseOptions } from 'fuse.js';

import type { Entry } from './entry';

interface SearchDoc {
  entry: Entry;
  label: string;
  group: string;
  id: string;
}

const OPTIONS: IFuseOptions<SearchDoc> = {
  keys: [
    { name: 'label', weight: 0.6 },
    { name: 'group', weight: 0.25 },
    { name: 'id', weight: 0.15 },
  ],
  threshold: 0.35,
  // Match anywhere in the string, not just near the start.
  ignoreLocation: true,
};

export type EntrySearch = (query: string) => Entry[];

/**
 * Build a fuzzy search over entries. Group labels are resolved up front so
 * "image alt" can match the Image group as well as the "alt" label.
 * An empty query returns every entry in its original order.
 */
export function createEntrySearch(
  entries: readonly Entry[],
  groupLabels: Readonly<Record<string, string>>,
): EntrySearch {
  const docs: SearchDoc[] = entries.map((entry) => ({
    entry,
    label: entry.label,
    group: groupLabels[entry.group] ?? entry.group,
    id: entry.id,
  }));
  const fuse = new Fuse(docs, OPTIONS);

  return (query) => {
    const q = query.trim();
    if (!q) return [...entries];
    // Each word must match some key (a Fuse logical `$and` query), so word order
    // doesn't matter: "alt image" finds "Image — alt".
    return fuse
      .search({ $and: q.split(/\s+/).map((word) => ({ $or: keysFor(word) })) })
      .map((r) => r.item.entry);
  };
}

function keysFor(word: string): Record<string, string>[] {
  return [{ label: word }, { group: word }, { id: word }];
}
