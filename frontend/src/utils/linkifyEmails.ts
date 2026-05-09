/**
 * Extracts segments from text, splitting around
 * email addresses so they can be rendered as
 * mailto: links.
 *
 * Returns an array of { text, email? } objects.
 */
export interface TextSegment {
  text: string;
  email?: string;
}

const EMAIL_RE =
  /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;

export function linkifyEmails(
  input: string
): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = EMAIL_RE.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: input.slice(lastIndex, match.index),
      });
    }
    segments.push({
      text: match[1],
      email: match[1],
    });
    lastIndex = EMAIL_RE.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex) });
  }

  return segments;
}
