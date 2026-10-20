/**
 * Placeholder tokens used in the snippet data.
 *
 * - `__ENTITY__`   the entity variable (see `entities.ts`)
 * - `__FIELD__`    the field machine name
 * - `__SUBFIELD__` a field on the referenced entity
 *
 * Literal variables (`content.`, `node.`, `paragraph.`, `items`…) are never
 * touched: only the tokens above are replaced.
 */
export const PLACEHOLDERS = {
  entity: '__ENTITY__',
  field: '__FIELD__',
  subfield: '__SUBFIELD__',
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

/** Shown in place of an empty input so the snippet stays readable. */
export const DEFAULT_VALUES: Readonly<Record<PlaceholderKey, string>> = {
  entity: 'node',
  field: 'field_name',
  subfield: 'field_subfield',
};

export type PlaceholderValues = Readonly<Record<PlaceholderKey, string>>;

/** Matches any `__UPPER_CASE__` token, known or not. */
const TOKEN_PATTERN = /__[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*__/g;

const keyByToken = new Map<string, PlaceholderKey>(
  (Object.entries(PLACEHOLDERS) as [PlaceholderKey, string][]).map(([key, token]) => [token, key]),
);

/** Which known placeholders occur in one or more snippets. */
export function placeholdersIn(code: string | readonly string[]): Set<PlaceholderKey> {
  const found = new Set<PlaceholderKey>();
  for (const snippet of typeof code === 'string' ? [code] : code) {
    for (const [token] of snippet.matchAll(TOKEN_PATTERN)) {
      const key = keyByToken.get(token);
      if (key) found.add(key);
    }
  }
  return found;
}

/** Tokens that look like placeholders but are not known ones (data errors). */
export function unknownPlaceholdersIn(code: string): string[] {
  return [...code.matchAll(TOKEN_PATTERN)].map(([t]) => t).filter((t) => !keyByToken.has(t));
}

/**
 * Replace every placeholder with its value. Empty values fall back to
 * `DEFAULT_VALUES`, so the output is always a complete Twig expression.
 */
export function substitute(code: string, values: Partial<PlaceholderValues>): string {
  return code.replace(TOKEN_PATTERN, (token) => {
    const key = keyByToken.get(token);
    if (!key) return token;
    // An empty string is "no input", not a value: fall back to the default.
    const value = values[key]?.trim() ?? '';
    return value !== '' ? value : DEFAULT_VALUES[key];
  });
}

export interface Segment {
  text: string;
  /** Set when the text came from a placeholder. */
  placeholder?: PlaceholderKey;
  /** True when the value is the default stand-in rather than user input. */
  isDefault?: boolean;
}

/**
 * Like `substitute()`, but returns segments so the UI can style substituted
 * values (and default stand-ins) differently from the surrounding Twig.
 */
export function substituteSegments(code: string, values: Partial<PlaceholderValues>): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN_PATTERN)) {
    const [token] = match;
    const key = keyByToken.get(token);
    if (!key) continue;
    if (match.index > last) segments.push({ text: code.slice(last, match.index) });
    const value = values[key]?.trim();
    segments.push(
      value
        ? { text: value, placeholder: key }
        : { text: DEFAULT_VALUES[key], placeholder: key, isDefault: true },
    );
    last = match.index + token.length;
  }
  if (last < code.length) segments.push({ text: code.slice(last) });
  return segments;
}

export interface SubstitutedRange {
  start: number;
  end: number;
  placeholder: PlaceholderKey;
  isDefault: boolean;
}

/**
 * Substitute and report where each value landed in the output, for marking
 * substituted values inside highlighted code.
 */
export function substituteWithRanges(
  code: string,
  values: Partial<PlaceholderValues>,
): { code: string; ranges: SubstitutedRange[] } {
  let offset = 0;
  const ranges: SubstitutedRange[] = [];
  for (const segment of substituteSegments(code, values)) {
    const end = offset + segment.text.length;
    if (segment.placeholder) {
      ranges.push({
        start: offset,
        end,
        placeholder: segment.placeholder,
        isDefault: segment.isDefault === true,
      });
    }
    offset = end;
  }
  return { code: substitute(code, values), ranges };
}
