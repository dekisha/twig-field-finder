/** Shape of the original Confluence-derived seed file in `data/`. */
export interface SeedEntry {
  id: string;
  group: string;
  label: string;
  usesField?: boolean;
  raw?: string[];
  render?: string[];
  helper?: { code: string; module: string }[];
  notes?: string;
  review?: string;
}

export interface SeedFile {
  helperFilters: { name: string; module: string; description: string }[];
  modules: Record<string, string>;
  entries: SeedEntry[];
}

/** "Entity basics" → "entity-basics" */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
