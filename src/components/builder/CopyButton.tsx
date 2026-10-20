import { useEffect, useRef, useState } from 'react';

import {
  COPY_ANNOUNCEMENTS,
  COPY_BUTTON_CLASS,
  COPY_LABELS,
  COPY_RESET_MS,
} from '@/components/copy-button';
import { copyText } from '@/scripts/clipboard';

import { useAnnounce } from './Announcer';

interface Props {
  text: string;
  /** Accessible name, e.g. "Copy snippet 2 of 3". Defaults to the visible label. */
  label?: string;
  /** Visible label. */
  children?: string;
  variant?: 'primary' | 'quiet';
}

type Status = 'idle' | 'copied' | 'failed';

export function CopyButton({
  text,
  label,
  children = COPY_LABELS.idle,
  variant = 'primary',
}: Props) {
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
    announce(ok ? COPY_ANNOUNCEMENTS.copied : COPY_ANNOUNCEMENTS.failed);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setStatus('idle');
    }, COPY_RESET_MS);
  }

  return (
    <button
      type="button"
      className={COPY_BUTTON_CLASS[variant]}
      data-copied={status === 'copied' || undefined}
      data-failed={status === 'failed' || undefined}
      aria-label={label}
      onClick={() => void handleClick()}
    >
      {status === 'copied' ? <CheckIcon /> : <CopyIcon />}
      <span aria-hidden={label !== undefined}>
        {status === 'idle' ? children : COPY_LABELS[status]}
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
