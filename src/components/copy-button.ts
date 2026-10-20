/**
 * Copy button styles shared by the React builder and static pages, so both
 * look identical. State is expressed as `data-copied` / `data-failed`.
 */
const BASE =
  'inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors';

export const COPY_BUTTON_CLASS = {
  // Outlined: one accent colour for text and border reads calmer than a
  // column of solid buttons.
  primary: `${BASE} border border-line-strong bg-surface text-accent hover:border-accent hover:bg-accent-soft data-copied:border-accent data-copied:bg-accent-soft data-failed:border-danger data-failed:text-danger`,
  quiet: `${BASE} text-muted hover:bg-sunken hover:text-ink data-copied:text-accent data-failed:text-danger`,
} as const;

export const COPY_LABELS = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Copy failed',
} as const;

export const COPY_ANNOUNCEMENTS = {
  copied: 'Copied to clipboard',
  failed: 'Copy failed. Select the code and copy it manually.',
} as const;

/** How long the "Copied" state shows before the button resets. */
export const COPY_RESET_MS = 2000;
