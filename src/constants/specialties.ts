import {
  Baby,
  Bone,
  Brain,
  Eye,
  HeartPulse,
  Hospital,
  Smile,
  Sparkles,
  Stethoscope,
  UserPlus,
} from 'lucide-react-native';

type IconRef = typeof Stethoscope;

export interface Specialty {
  /** Short identifier persisted with each clinician record. */
  id: string;
  /** Display label shown on chips and clinician cards. */
  label: string;
  Icon: IconRef;
  /** Two-stop gradient used on the specialty tile. */
  grad: [string, string];
  /** Foreground color for the icon on the gradient tile. */
  fg: string;
}

/**
 * Curated specialty shortcuts. Users can also tap "Other" and type a
 * custom specialty in the add sheet, which falls back to a generic
 * stethoscope tile.
 */
export const SPECIALTIES: Specialty[] = [
  {
    id: 'primary-care',
    label: 'Primary care',
    Icon: Stethoscope,
    grad: ['#2C6E6B', '#1F504E'],
    fg: '#FFFFFF',
  },
  {
    id: 'cardiology',
    label: 'Cardiology',
    Icon: HeartPulse,
    grad: ['#E07A5F', '#C45C3F'],
    fg: '#FFFFFF',
  },
  {
    id: 'neurology',
    label: 'Neurology',
    Icon: Brain,
    grad: ['#A8C4C2', '#6FA19E'],
    fg: '#1F504E',
  },
  {
    id: 'psychiatry',
    label: 'Psychiatry',
    Icon: Smile,
    grad: ['#F5A3A3', '#D97575'],
    fg: '#FFFFFF',
  },
  {
    id: 'dermatology',
    label: 'Dermatology',
    Icon: Sparkles,
    grad: ['#F6C06A', '#D9964A'],
    fg: '#5C3D12',
  },
  {
    id: 'ob-gyn',
    label: 'OB-GYN',
    Icon: Baby,
    grad: ['#C7B98F', '#9E8F5F'],
    fg: '#FFFFFF',
  },
  {
    id: 'orthopedics',
    label: 'Orthopedics',
    Icon: Bone,
    grad: ['#6CA4A0', '#3F7E7A'],
    fg: '#FFFFFF',
  },
  {
    id: 'ophthalmology',
    label: 'Ophthalmology',
    Icon: Eye,
    grad: ['#8A9FC7', '#5C75A1'],
    fg: '#FFFFFF',
  },
  {
    id: 'specialist',
    label: 'Other specialist',
    Icon: Hospital,
    grad: ['#D9BBA7', '#B58D73'],
    fg: '#5C3D12',
  },
  {
    id: 'other',
    label: 'Other',
    Icon: UserPlus,
    grad: ['#C7C3BE', '#8E8A84'],
    fg: '#FFFFFF',
  },
];

/** Fallback used when a clinician's specialty doesn't match any known id. */
export const DEFAULT_SPECIALTY: Specialty = SPECIALTIES[0]!;

/**
 * Look up a specialty by its id or by a free-text label (case-insensitive
 * contains match). Falls back to the default primary-care tile if nothing
 * matches, so every clinician always has a visual identity.
 */
export const findSpecialty = (value: string | undefined): Specialty => {
  if (!value) return DEFAULT_SPECIALTY;
  const v = value.trim().toLowerCase();
  const byId = SPECIALTIES.find((s) => s.id === v);
  if (byId) return byId;
  const byLabel = SPECIALTIES.find(
    (s) => s.label.toLowerCase() === v || v.includes(s.label.toLowerCase()),
  );
  return byLabel ?? DEFAULT_SPECIALTY;
};
