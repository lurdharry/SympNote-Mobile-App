import { compact, find, isPlainObject, isString } from 'lodash';
import type { BriefContent } from '@/stores/types';

export const EMPTY_BRIEF: BriefContent = {
  summary: '',
  topConcerns: [],
  timeline: [],
  patterns: [],
  medications: [],
  questions: [],
  flags: [],
};

const trimmedOrEmpty = (v: unknown): string => (isString(v) ? v.trim() : '');

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? compact(v.map(trimmedOrEmpty)) : [];

const asLabeledArray = (v: unknown): BriefContent['topConcerns'] => {
  if (!Array.isArray(v)) return [];
  return compact(
    v.map((item) => {
      if (!isPlainObject(item)) return null;
      const obj = item as Record<string, unknown>;
      const label = trimmedOrEmpty(obj.label);
      if (!label) return null;
      return { label, detail: trimmedOrEmpty(obj.detail) };
    }),
  );
};

const asTimelineArray = (v: unknown): BriefContent['timeline'] => {
  if (!Array.isArray(v)) return [];
  return compact(
    v.map((item) => {
      if (!isPlainObject(item)) return null;
      const obj = item as Record<string, unknown>;
      const date = trimmedOrEmpty(obj.date);
      const line = trimmedOrEmpty(obj.line);
      if (!date || !line) return null;
      return { date, line };
    }),
  );
};

const stripJsonFence = (text: string): string => {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return trimmed;
};

/**
 * Last-ditch JSON extractor — finds the first `{` and the last `}` and
 * returns the slice between. Catches the case where a model prepends a
 * sentence like "Here's the brief:" before the actual JSON, which
 * makes a strict JSON.parse fail.
 */
const extractJsonObject = (text: string): string | null => {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
};

/**
 * Pull a field from the raw object, accepting common alias spellings.
 * Models occasionally output snake_case or shortened keys despite the
 * schema. Trying a few aliases makes parse hits much more forgiving.
 * Named to avoid shadowing lodash's `_.pick` (different behaviour).
 */
const firstAlias = (raw: Record<string, unknown>, ...keys: string[]): unknown =>
  find(keys.map((k) => raw[k]), (v) => v !== undefined);

const buildBrief = (raw: Record<string, unknown>): BriefContent => ({
  summary: trimmedOrEmpty(firstAlias(raw, 'summary', 'overview')),
  topConcerns: asLabeledArray(firstAlias(raw, 'topConcerns', 'top_concerns', 'concerns')),
  timeline: asTimelineArray(firstAlias(raw, 'timeline', 'events')),
  patterns: asStringArray(firstAlias(raw, 'patterns', 'observations')),
  medications: asStringArray(firstAlias(raw, 'medications', 'meds')),
  questions: asStringArray(firstAlias(raw, 'questions', 'questions_to_ask')),
  flags: asStringArray(firstAlias(raw, 'flags', 'redFlags', 'red_flags')),
});

/**
 * Try several strategies to coax JSON out of the model output:
 *   1. parse the raw text (works when JSON mode is honoured)
 *   2. parse after stripping ``` fences
 *   3. parse the substring between the first `{` and last `}`
 * Returns null when every strategy fails — the caller surfaces the
 * empty-state retry UI instead of dumping JSON into the summary.
 */
export const parseBrief = (text: string): BriefContent | null => {
  const candidates: string[] = [text.trim(), stripJsonFence(text)];
  const extracted = extractJsonObject(text);
  if (extracted) candidates.push(extracted);

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const raw = JSON.parse(candidate) as Record<string, unknown>;
      if (raw && typeof raw === 'object') return buildBrief(raw);
    } catch {
      // try the next strategy
    }
  }
  return null;
};
