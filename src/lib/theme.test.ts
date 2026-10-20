import { describe, expect, it } from 'vitest';

import { parseThemePreference } from './theme';

describe('parseThemePreference', () => {
  it('accepts explicit choices', () => {
    expect(parseThemePreference('light')).toBe('light');
    expect(parseThemePreference('dark')).toBe('dark');
  });

  it('treats anything else as "follow the system"', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference('system')).toBe('system');
    expect(parseThemePreference('Dark')).toBe('system');
    expect(parseThemePreference(undefined)).toBe('system');
  });
});
