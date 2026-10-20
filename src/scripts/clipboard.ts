/**
 * Copy text to the clipboard. Uses the async Clipboard API where available
 * (secure contexts), and falls back to a hidden textarea + execCommand for
 * plain-HTTP hosting, where `navigator.clipboard` is undefined.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && 'clipboard' in navigator) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or unavailable: try the fallback.
  }
  return copyWithTextarea(text);
}

function copyWithTextarea(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  const previousFocus = document.activeElement;
  document.body.append(textarea);
  textarea.select();
  let ok: boolean;
  try {
    // Deprecated, but the only option outside secure contexts.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  textarea.remove();
  if (previousFocus instanceof HTMLElement) previousFocus.focus();
  return ok;
}
