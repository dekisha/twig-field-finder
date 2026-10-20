/**
 * Twig paths like `node.field_hero_image.entity.uri.value` contain no spaces,
 * so on narrow screens the browser would break them mid-identifier. Splitting
 * after these characters marks better break points (rendered as `<wbr>`,
 * which isn't part of copied text).
 */
const BREAK_AFTER = /(?<=[.|,(])/;
const ENDS_WITH_BREAK = /[.|,(]$/;

/** `a.b|c` → `['a.', 'b|', 'c']`. Joining the parts gives back the input. */
export function splitAtBreakPoints(text: string): string[] {
  return text.split(BREAK_AFTER);
}

/** Whether a break opportunity belongs right after this text. */
export function endsWithBreakPoint(text: string): boolean {
  return ENDS_WITH_BREAK.test(text);
}
