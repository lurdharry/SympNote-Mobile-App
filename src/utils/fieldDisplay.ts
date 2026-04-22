import type { StructuredEntry } from '@/stores/types';
import type { FieldKey } from '@/constants/fields';

const EMPTY = '—';

/**
 * Render a single field from a structured symptom entry as user-facing
 * text. Returns a visible em-dash when the field is missing so the UI
 * reserves the same row height regardless of completeness.
 */
export const fieldDisplay = (entry: StructuredEntry, key: FieldKey): string => {
  switch (key) {
    case 'symptoms':
      return entry.symptoms.filter(Boolean).join(', ') || EMPTY;
    case 'location':
      return entry.location || EMPTY;
    case 'duration':
      return entry.duration || EMPTY;
    case 'severity':
      return `${entry.severity}/10`;
    case 'triggers':
      return entry.triggers.filter(Boolean).join(', ') || EMPTY;
  }
};
