import { orderBy, values } from 'lodash';

export interface TranscriptSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Tokenize a transcript into plain + highlighted segments based on the
 * source-phrase map returned by the AI. Longer phrases win ties so
 * nested matches highlight at the phrase level, not word-by-word.
 */
export const splitHighlighted = (
  transcript: string,
  sourcePhrases: Record<string, string>,
): TranscriptSegment[] => {
  const phrases = orderBy(
    values(sourcePhrases).filter((p): p is string => typeof p === 'string' && p.length > 0),
    [(p) => p.length],
    ['desc'],
  );

  if (phrases.length === 0) {
    return [{ text: transcript, highlighted: false }];
  }

  const segments: TranscriptSegment[] = [];
  let cursor = 0;

  while (cursor < transcript.length) {
    let nextIdx = -1;
    let nextPhrase: string | null = null;
    for (const p of phrases) {
      const idx = transcript.indexOf(p, cursor);
      if (idx !== -1 && (nextIdx === -1 || idx < nextIdx)) {
        nextIdx = idx;
        nextPhrase = p;
      }
    }
    if (nextIdx === -1 || !nextPhrase) {
      segments.push({ text: transcript.slice(cursor), highlighted: false });
      break;
    }
    if (nextIdx > cursor) {
      segments.push({ text: transcript.slice(cursor, nextIdx), highlighted: false });
    }
    segments.push({ text: nextPhrase, highlighted: true });
    cursor = nextIdx + nextPhrase.length;
  }

  return segments;
};
