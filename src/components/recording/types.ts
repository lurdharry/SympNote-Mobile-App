import { StructuredEntry } from '../../stores/types';

/**
 * The /record screen is now type-only — voice capture lives on the
 * home long-press FAB. Three phases: write (compose), analyze (AI
 * structuring), confirm (structured fields preview).
 */
export type Phase = 'review' | 'extracting' | 'extracted';

// Explicit — only the 5 fields that get flying-word treatment in the
// recording flow. Keep narrow so `fieldValue`'s switch stays exhaustive.
export type FieldKey =
  | 'symptoms'
  | 'location'
  | 'duration'
  | 'severity'
  | 'triggers';

export const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'symptoms', label: 'Symptom' },
  { key: 'location', label: 'Location' },
  { key: 'duration', label: 'Duration' },
  { key: 'severity', label: 'Severity' },
  { key: 'triggers', label: 'Triggers' },
];

export type FlightItem = {
  key: string;
  label: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  delay: number;
  fieldKey: string;
};

export type StructuredWithSources = StructuredEntry & {
  sourcePhrases: Record<string, string>;
};

export function fieldValue(
  s: StructuredWithSources | null,
  key: FieldKey
): string {
  if (!s) return '';
  switch (key) {
    case 'symptoms':
      return s.symptoms.join(', ');
    case 'location':
      return s.location;
    case 'duration':
      return s.duration;
    case 'severity':
      return `${s.severity}/10`;
    case 'triggers':
      return s.triggers.join(', ');
  }
}
