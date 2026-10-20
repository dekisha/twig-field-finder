import { DEFAULT_ENTITY_CONTEXT, isEntityContextId, type EntityContextId } from './entities';
import { isApproach, type Approach } from './entry';

/** Builder state that is mirrored in the query string. */
export interface BuilderState {
  entry: string;
  field: string;
  subfield: string;
  entity: EntityContextId;
  /** Requested approach; the builder falls back if the entry lacks it. */
  approach: Approach | undefined;
}

/** Query-string keys. Short but readable, so shared links stay legible. */
export const PARAMS = {
  entry: 'entry',
  field: 'field',
  subfield: 'sub',
  entity: 'entity',
  approach: 'tab',
} as const;

/** Upper bound for free-text params, well above Drupal's 32-char limit. */
const MAX_TEXT_LENGTH = 64;

function readText(params: URLSearchParams, key: string): string {
  return (params.get(key) ?? '').trim().slice(0, MAX_TEXT_LENGTH);
}

/**
 * Parse builder state from a query string. Unknown or invalid values fall back
 * to defaults, so a hand-edited or stale link never breaks the page.
 */
export function parseBuilderState(
  search: string | URLSearchParams,
  { entryIds, defaultEntry }: { entryIds: ReadonlySet<string>; defaultEntry: string },
): BuilderState {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const entry = params.get(PARAMS.entry);
  const entity = params.get(PARAMS.entity);
  const approach = params.get(PARAMS.approach);
  return {
    entry: entry !== null && entryIds.has(entry) ? entry : defaultEntry,
    field: readText(params, PARAMS.field),
    subfield: readText(params, PARAMS.subfield),
    entity: isEntityContextId(entity) ? entity : DEFAULT_ENTITY_CONTEXT,
    approach: isApproach(approach) ? approach : undefined,
  };
}

/**
 * Serialise builder state to a query string (without `?`). Empty and default
 * values are omitted to keep links short.
 */
export function serializeBuilderState(state: Partial<BuilderState>): string {
  const params = new URLSearchParams();
  if (state.entry) params.set(PARAMS.entry, state.entry);
  if (state.field) params.set(PARAMS.field, state.field);
  if (state.subfield) params.set(PARAMS.subfield, state.subfield);
  if (state.entity && state.entity !== DEFAULT_ENTITY_CONTEXT) {
    params.set(PARAMS.entity, state.entity);
  }
  if (state.approach) params.set(PARAMS.approach, state.approach);
  return params.toString();
}
