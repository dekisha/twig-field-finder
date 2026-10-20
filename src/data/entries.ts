/**
 * The only module that reads the content collections. Pages and islands get
 * plain `Entry` objects from here, so the `review` note can be stripped in one
 * place before anything is rendered or serialised into island props.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

import { toPublicEntry, type Entry } from '@/lib/entry';

import type { Group, HelperFilter, Module } from './types';

export type { Group, HelperFilter, Module };

/** Review notes are a development aid and never ship in production builds. */
export const SHOW_REVIEW = import.meta.env.DEV;

function toEntry({ id, data }: CollectionEntry<'entries'>): Entry {
  return toPublicEntry(
    {
      id,
      group: data.group.id,
      label: data.label,
      usesField: data.usesField,
      ...(data.context !== undefined && { context: data.context }),
      raw: data.raw ?? [],
      render: data.render ?? [],
      helper: (data.helper ?? []).map((h) => ({ code: h.code, module: h.module.id })),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.review !== undefined && { review: data.review }),
    },
    { includeReview: SHOW_REVIEW },
  );
}

export async function getGroups(): Promise<Group[]> {
  // Collections come back sorted by id, so display order is explicit.
  return (await getCollection('groups'))
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ id, data }) => ({ id, label: data.label }));
}

/** All entries, ordered by group (as in groups.yaml), then by `order` within the group. */
export async function getEntries(): Promise<Entry[]> {
  const [groups, entries] = await Promise.all([getGroups(), getCollection('entries')]);
  const groupOrder = new Map(groups.map((g, i) => [g.id, i]));
  return entries
    .sort(
      (a, b) =>
        (groupOrder.get(a.data.group.id) ?? 0) - (groupOrder.get(b.data.group.id) ?? 0) ||
        a.data.order - b.data.order,
    )
    .map(toEntry);
}

/** Modules, most used first (then by name), so the main helper leads every list. */
export async function getModules(): Promise<Module[]> {
  const [modules, entries] = await Promise.all([
    getCollection('modules'),
    getCollection('entries'),
  ]);
  const usage = new Map<string, number>();
  for (const { data } of entries) {
    for (const id of new Set((data.helper ?? []).map((h) => h.module.id))) {
      usage.set(id, (usage.get(id) ?? 0) + 1);
    }
  }
  return modules
    .map(({ id, data }) => ({ id, ...data }))
    .sort(
      (a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name),
    );
}

export async function getHelperFilters(): Promise<HelperFilter[]> {
  return (await getCollection('helperFilters')).map(({ id, data }) => ({
    name: id,
    module: data.module.id,
    description: data.description,
  }));
}
