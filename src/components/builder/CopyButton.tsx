import { useEffect, useRef, useState } from 'react';

import { useAnnounce } from './Announcer';
import { copyText } from './clipboard';

const RESET_MS = 2000;

interface Props {
  text: string;
  /** Accessible name, e.g. "Copy snippet 2 of 3". Defaults to the visible label. */
  label?: string;
  /** Visible label. */
  children?: string;
  variant?: 'primary' | 'quiet';
}

type Status = 'idle' | 'copied' | 'failed';

export function CopyButton({ text, label, children = 'Copy', variant = 'primary' }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const announce = useAnnounce();
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleClick() {
    const ok = await copyText(text);
    setStatus(ok ? 'copied' : 'failed');
    announce(ok ? 'Copied to clipboard' : 'Copy failed. Select the code and copy it manually.');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setStatus('idle');
    }, RESET_MS);
  }

  const base =
    'inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors';
  // "primary" stays outlined: one accent colour, used for text and borders,
  // reads calmer than a column of solid buttons.
  const styles =
    variant === 'primary'
      ? status === 'copied'
        ? 'border border-accent bg-accent-soft text-accent'
        : 'border border-line-strong bg-surface text-accent hover:border-accent hover:bg-accent-soft'
      : 'text-muted hover:bg-sunken hover:text-ink';

  return (
    <button
      type="button"
      className={`${base} ${styles}`}
      aria-label={label}
      onClick={() => void handleClick()}
    >
      {status === 'copied' ? <CheckIcon /> : <CopyIcon />}
      <span aria-hidden={label !== undefined}>
        {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : children}
      </span>
    </button>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
      <rect x="7" y="7" width="9" height="9" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 7V5.75C13 4.78 12.22 4 11.25 4h-5.5C4.78 4 4 4.78 4 5.75v5.5c0 .97.78 1.75 1.75 1.75H7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
      <path
        d="m4.5 10.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
