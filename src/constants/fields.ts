import { Activity, BarChart3, Hourglass, MapPin, Zap } from 'lucide-react-native';

type IconRef = typeof Activity;

export type FieldKey =
  | 'symptoms'
  | 'location'
  | 'duration'
  | 'severity'
  | 'triggers';

export type FieldMeta = {
  key: FieldKey;
  label: string;
  Icon: IconRef;
  tint: string;
};

/**
 * Metadata for each structured field the AI extracts — icon, tint, and
 * human label. Shared between the onboarding first-recording and the
 * extracting-phase animation.
 */
export const FIELD_META: FieldMeta[] = [
  { key: 'symptoms', label: 'Symptom',  Icon: Activity,  tint: '#E07A5F' },
  { key: 'location', label: 'Location', Icon: MapPin,    tint: '#2C6E6B' },
  { key: 'duration', label: 'Duration', Icon: Hourglass, tint: '#D97706' },
  { key: 'severity', label: 'Severity', Icon: BarChart3, tint: '#C45C3F' },
  { key: 'triggers', label: 'Triggers', Icon: Zap,       tint: '#F6C06A' },
];
