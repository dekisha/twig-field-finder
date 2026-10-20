import { useEffect, useMemo, useReducer, useRef } from 'react';

import { DEFAULT_ENTITY_CONTEXT, entityVariable, type EntityContextId } from '@/lib/entities';
import {
  allPlaceholders,
  approachesFor,
  placeholdersFor,
  resolveApproach,
  snippetsFor,
  type Approach,
  type Entry,
} from '@/lib/entry';
import { substituteWithRanges, type SubstitutedRange } from '@/lib/placeholders';
import { parseBuilderState, serializeBuilderState, type BuilderState } from '@/lib/url-state';

type Action =
  | { type: 'restore'; state: BuilderState }
  | { type: 'entry'; id: string }
  | { type: 'field'; value: string }
  | { type: 'subfield'; value: string }
  | { type: 'entity'; value: EntityContextId }
  | { type: 'approach'; value: Approach };

function reducer(state: BuilderState, action: Action): BuilderState {
  switch (action.type) {
    case 'restore':
      return action.state;
    case 'entry':
      // Field names and the chosen approach carry over: people usually look up
      // several properties of the same field.
      return { ...state, entry: action.id };
    case 'field':
      return { ...state, field: action.value };
    case 'subfield':
      return { ...state, subfield: action.value };
    case 'entity':
      return { ...state, entity: action.value };
    case 'approach':
      return { ...state, approach: action.value };
  }
}

export interface ResolvedSnippet {
  /** Template code with placeholders as stored, used as a stable key. */
  template: string;
  code: string;
  ranges: SubstitutedRange[];
  module?: string;
}

const URL_DEBOUNCE_MS = 250;

export function useBuilderState(entries: readonly Entry[], defaultEntry: string) {
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const entryIds = useMemo(() => new Set(byId.keys()), [byId]);

  // The server render (and therefore hydration) always uses the defaults; the
  // URL is applied right after hydration so the two never mismatch.
  const [state, dispatch] = useReducer(reducer, {
    entry: defaultEntry,
    field: '',
    subfield: '',
    entity: DEFAULT_ENTITY_CONTEXT,
    approach: undefined,
  });

  const restored = useRef(false);
  useEffect(() => {
    dispatch({
      type: 'restore',
      state: parseBuilderState(window.location.search, { entryIds, defaultEntry }),
    });
    restored.current = true;
  }, [entryIds, defaultEntry]);

  const fallback = entries[0];
  if (!fallback) throw new Error('The builder needs at least one entry.');
  const entry = byId.get(state.entry) ?? fallback;
  const approaches = approachesFor(entry);
  const approach = resolveApproach(entry, state.approach);

  // Mirror state in the query string (replace, not push: typing shouldn't
  // flood the history). Only the resolved approach is written, so links never
  // point at a tab the entry doesn't have.
  useEffect(() => {
    if (!restored.current) return;
    const timer = window.setTimeout(() => {
      const query = serializeBuilderState({
        entry: entry.id,
        field: entry.usesField ? state.field : '',
        subfield: allPlaceholders(entry).has('subfield') ? state.subfield : '',
        entity: state.entity,
        approach: approaches.length > 1 ? approach : undefined,
      });
      const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(window.history.state, '', url);
      }
    }, URL_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [entry, state.field, state.subfield, state.entity, approach, approaches.length]);

  const usesEntity = placeholdersFor(entry, approach).has('entity');
  const usesSubfield = allPlaceholders(entry).has('subfield');

  const snippets: ResolvedSnippet[] = useMemo(() => {
    const values = {
      entity: entityVariable(state.entity),
      field: state.field,
      subfield: state.subfield,
    };
    return snippetsFor(entry, approach).map(({ code, module }) => ({
      template: code,
      ...substituteWithRanges(code, values),
      ...(module !== undefined && { module }),
    }));
  }, [entry, approach, state.entity, state.field, state.subfield]);

  return {
    state,
    entry,
    approaches,
    approach,
    usesEntity,
    usesSubfield,
    snippets,
    setEntry: (id: string) => {
      dispatch({ type: 'entry', id });
    },
    setField: (value: string) => {
      dispatch({ type: 'field', value });
    },
    setSubfield: (value: string) => {
      dispatch({ type: 'subfield', value });
    },
    setEntity: (value: EntityContextId) => {
      dispatch({ type: 'entity', value });
    },
    setApproach: (value: Approach) => {
      dispatch({ type: 'approach', value });
    },
  };
}
