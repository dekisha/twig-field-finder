/**
 * Progressive enhancement for static pages: `<button data-copy="…" hidden>`
 * buttons are revealed and wired up. Without JavaScript they stay hidden and
 * the code remains selectable.
 *
 * Expects one `[data-copy-status]` live region on the page.
 */
import { COPY_ANNOUNCEMENTS, COPY_LABELS, COPY_RESET_MS } from '@/components/copy-button';

import { copyText } from './clipboard';

const timers = new WeakMap<HTMLButtonElement, number>();

function announce(message: string): void {
  const region = document.querySelector<HTMLElement>('[data-copy-status]');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}

function setState(button: HTMLButtonElement, state: 'idle' | 'copied' | 'failed'): void {
  button.toggleAttribute('data-copied', state === 'copied');
  button.toggleAttribute('data-failed', state === 'failed');
  const label = button.querySelector<HTMLElement>('[data-copy-label]');
  if (label) label.textContent = COPY_LABELS[state];
}

export function initCopyButtons(root: ParentNode = document): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      void copyText(button.dataset.copy ?? '').then((ok) => {
        setState(button, ok ? 'copied' : 'failed');
        announce(ok ? COPY_ANNOUNCEMENTS.copied : COPY_ANNOUNCEMENTS.failed);
        window.clearTimeout(timers.get(button));
        timers.set(
          button,
          window.setTimeout(() => {
            setState(button, 'idle');
          }, COPY_RESET_MS),
        );
      });
    });
  }
}
