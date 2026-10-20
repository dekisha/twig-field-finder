/** Filters for the browse view, mirrored in the query string (`?group=&module=`). */
export interface BrowseFilters {
  /** Group id, or '' for all groups. */
  group: string;
  /** Module id, or '' for any (including none). */
  module: string;
}

export interface Filterable {
  group: string;
  modules: readonly string[];
}

export function matchesFilters(item: Filterable, filters: BrowseFilters): boolean {
  return (
    (filters.group === '' || item.group === filters.group) &&
    (filters.module === '' || item.modules.includes(filters.module))
  );
}

/** Read filters from a query string; unknown values fall back to "all". */
export function parseBrowseFilters(
  search: string,
  { groups, modules }: { groups: ReadonlySet<string>; modules: ReadonlySet<string> },
): BrowseFilters {
  const params = new URLSearchParams(search);
  const group = params.get('group') ?? '';
  const module = params.get('module') ?? '';
  return {
    group: groups.has(group) ? group : '',
    module: modules.has(module) ? module : '',
  };
}

export function serializeBrowseFilters(filters: BrowseFilters): string {
  const params = new URLSearchParams();
  if (filters.group) params.set('group', filters.group);
  if (filters.module) params.set('module', filters.module);
  return params.toString();
}

export function describeResults(shown: number, total: number): string {
  if (shown === total) return `Showing all ${String(total)} entries`;
  if (shown === 0) return 'No entries match these filters';
  return `Showing ${String(shown)} of ${String(total)} entries`;
}
