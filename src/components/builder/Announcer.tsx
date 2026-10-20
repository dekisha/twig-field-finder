import { createContext, use, useCallback, useRef, useState, type ReactNode } from 'react';

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce>(() => undefined);

/**
 * One shared polite live region for status messages ("Copied…"). Messages are
 * cleared first so repeating the same message is announced again.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const announce = useCallback<Announce>((next) => {
    window.clearTimeout(timer.current);
    setMessage('');
    timer.current = window.setTimeout(() => {
      setMessage(next);
    }, 50);
  }, []);

  return (
    <AnnouncerContext value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </AnnouncerContext>
  );
}

export function useAnnounce(): Announce {
  return use(AnnouncerContext);
}
