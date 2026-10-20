/**
 * Renders text with `backtick` spans as <code>. Used for notes and review
 * text from the content collection; React escapes everything, so the data can
 * never inject markup. Works in islands and in static Astro output alike.
 */
export function InlineCode({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) =>
        // Odd indexes sit between a pair of backticks. An unmatched trailing
        // backtick leaves the last part as plain text.
        i % 2 === 1 && i < parts.length - 1 ? (
          <code
            key={i}
            className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.9em] break-words"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
