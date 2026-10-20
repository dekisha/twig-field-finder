/**
 * Wires up the theme radio group in the header. The initial `data-theme` is
 * applied by an inline script in <head> (BaseLayout) before first paint; this
 * module only handles changes. Storage can be unavailable (private mode,
 * blocked site data), so every access is guarded and the toggle still works
 * for the current page.
 */
import { parseThemePreference, THEME_STORAGE_KEY, type ThemePreference } from '@/lib/theme';

function readStored(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

function store(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not persisted; the choice still applies to this page.
  }
}

function apply(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
}

export function initThemeToggle(): void {
  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[name="theme"]')];
  if (inputs.length === 0) return;

  const select = (preference: ThemePreference) => {
    for (const input of inputs) input.checked = input.value === preference;
  };
  select(readStored());

  for (const input of inputs) {
    input.addEventListener('change', () => {
      const preference = parseThemePreference(input.value);
      apply(preference);
      store(preference);
    });
  }

  // Keep other open tabs in sync.
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    const preference = readStored();
    apply(preference);
    select(preference);
  });
}
