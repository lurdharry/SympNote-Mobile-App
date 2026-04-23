import { clamp, pickBy } from 'lodash';
import type { StructuredEntry } from '@/stores/types';

export type StructuredWithSources = StructuredEntry & {
  sourcePhrases: Record<string, string>;
};

const VALID_URGENCY: ReadonlyArray<string> = ['routine', 'follow-up', 'soon', 'urgent'];
const SEVERITY_MIN = 0;
const SEVERITY_MAX = 10;
const DEFAULT_SEVERITY = 0;

const toStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : [];

const toString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

// Severity is 0-10 (0 = patient reports no symptom). When the model
// returns something unparseable, default to 0 rather than 5 — a missing
// value almost always means "no symptom extracted," not "medium."
const toSeverity = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return DEFAULT_SEVERITY;
  return clamp(Math.round(n), SEVERITY_MIN, SEVERITY_MAX);
};

const toUrgency = (v: unknown): StructuredWithSources['urgency'] =>
  (VALID_URGENCY.includes(String(v)) ? String(v) : 'routine') as StructuredWithSources['urgency'];

const toSourcePhrases = (v: unknown): Record<string, string> => {
  if (!v || typeof v !== 'object') return {};
  return pickBy(
    v as Record<string, unknown>,
    (val): val is string => typeof val === 'string' && val.length > 0,
  );
};

/**
 * Parse the Gemini structuring response. The model returns JSON; this
 * function tolerates leading fenced-code blocks and missing fields so a
 * malformed response doesn't crash the recording flow.
 */
export const parseStructured = (raw: string): StructuredWithSources => {
  const trimmed = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(trimmed);
  return {
    symptoms: toStringArray(parsed.symptoms),
    location: toString(parsed.location),
    duration: toString(parsed.duration),
    severity: toSeverity(parsed.severity),
    triggers: toStringArray(parsed.triggers),
    medications: toStringArray(parsed.medications),
    notes: toString(parsed.notes),
    bodySystem: toString(parsed.bodySystem),
    redFlags: toStringArray(parsed.redFlags),
    urgency: toUrgency(parsed.urgency),
    sourcePhrases: toSourcePhrases(parsed.sourcePhrases),
  };
};
