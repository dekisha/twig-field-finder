/**
 * Join Astro's `base` with a site-relative path. Handles bases with or
 * without a trailing slash (`/`, `/twig-field-finder`, `/twig-field-finder/`).
 */
export function joinBase(base: string, path: string): string {
  const prefix = base.replace(/\/+$/, '');
  const suffix = path.replace(/^\/+/, '');
  return `${prefix}/${suffix}`;
}

/** Prefix a site-relative path with the configured base path. */
export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}
