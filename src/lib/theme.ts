/**
 * Theme preference. "system" follows `prefers-color-scheme` and is stored as
 * the absence of a value; "light" / "dark" are explicit choices stored in
 * localStorage and applied as `data-theme` on <html>.
 */
export const THEME_STORAGE_KEY = 'theme';

export type ThemePreference = 'system' | 'light' | 'dark';

export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
