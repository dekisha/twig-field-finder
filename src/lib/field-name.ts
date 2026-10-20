/** Drupal field machine names: lowercase letters, digits, underscores. */
export const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

/** Drupal's limit for field storage machine names (FieldStorageConfig). */
export const FIELD_NAME_MAX_LENGTH = 32;

export const FIELD_PREFIX = 'field_';

/**
 * Base fields that never carry the `field_` prefix. Typing one of these should
 * not trigger the prefix suggestion.
 */
const BASE_FIELDS = new Set([
  'body',
  'title',
  'uid',
  'status',
  'created',
  'changed',
  'langcode',
  'name',
  'description',
  'mail',
  'path',
  'promote',
  'sticky',
  'type',
  'bundle',
  'parent_id',
  'parent_type',
  'parent_field_name',
  'thumbnail',
  'info',
]);

export type FieldNameError =
  'empty' | 'uppercase' | 'leading-digit' | 'leading-underscore' | 'invalid-chars';

export type FieldNameResult =
  { valid: true; warning?: 'too-long' } | { valid: false; error: FieldNameError };

export function validateFieldName(name: string): FieldNameResult {
  if (name === '') return { valid: false, error: 'empty' };
  if (!FIELD_NAME_PATTERN.test(name)) {
    if (/^[0-9]/.test(name)) return { valid: false, error: 'leading-digit' };
    if (name.startsWith('_')) return { valid: false, error: 'leading-underscore' };
    if (/[A-Z]/.test(name) && FIELD_NAME_PATTERN.test(name.toLowerCase())) {
      return { valid: false, error: 'uppercase' };
    }
    return { valid: false, error: 'invalid-chars' };
  }
  if (name.length > FIELD_NAME_MAX_LENGTH) return { valid: true, warning: 'too-long' };
  return { valid: true };
}

export const FIELD_NAME_MESSAGES: Readonly<Record<FieldNameError | 'too-long', string>> = {
  empty: 'Enter a field machine name.',
  uppercase: 'Machine names are lowercase.',
  'leading-digit': 'Machine names must start with a letter.',
  'leading-underscore': 'Machine names must start with a letter.',
  'invalid-chars': 'Use only lowercase letters, numbers and underscores.',
  'too-long': `Drupal limits field machine names to ${FIELD_NAME_MAX_LENGTH} characters.`,
};

/**
 * Suggest the `field_`-prefixed name for a valid name that lacks it, e.g.
 * `hero_image` → `field_hero_image`. Returns `null` when no suggestion applies.
 * The caller offers it to the user; it never rewrites their input.
 */
export function suggestFieldPrefix(name: string): string | null {
  if (!FIELD_NAME_PATTERN.test(name)) return null;
  if (name.startsWith(FIELD_PREFIX)) return null;
  // `field` alone, or a partial prefix while typing (`fie`, `field`).
  if (FIELD_PREFIX.startsWith(name)) return null;
  if (BASE_FIELDS.has(name)) return null;
  return `${FIELD_PREFIX}${name}`;
}
