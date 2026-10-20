import type { Module } from '@/data/types';

/** Contrib module requirement, linking to its drupal.org project page. */
export function ModuleBadge({ module }: { module: Module }) {
  return (
    <a
      href={module.url}
      className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface px-2 py-0.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <span className="sr-only">Requires the </span>
      <span className="font-mono">{module.id}</span>
      <span className="sr-only"> module (drupal.org)</span>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3" fill="none">
        <path
          d="M6 4h6v6M12 4l-7.5 7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </a>
  );
}
