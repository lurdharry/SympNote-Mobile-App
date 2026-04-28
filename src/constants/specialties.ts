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
import {
  CardiologyMascot,
  DermatologyMascot,
  NeurologyMascot,
  ObGynMascot,
  OphthalmologyMascot,
  OrthopedicsMascot,
  OtherSpecialtyMascot,
  PrimaryCareMascot,
  PsychiatryMascot,
  SpecialistMascot,
} from '@/components/onboarding/care-team/SpecialtyMascots';

type IconRef = typeof Stethoscope;

export interface Specialty {
  /** Short identifier persisted with each clinician record. */
  id: string;
  /** Display label shown on chips and clinician cards. */
  label: string;
  /**
   * Bespoke SVG mascot for this specialty — paper-clinical character
   * with a face, distinct anatomy. Self-contained (carries its own
   * gradient) so callers render `<spec.Mascot size={N} />` directly,
   * no gradient tile wrapper needed.
   */
  Mascot: React.FC<{ size?: number }>;
  /** Lucide icon — kept for legacy chip strips that don't use the
   *  mascot variant yet, and as a small fallback glyph. */
  Icon: IconRef;
  /** Two-stop gradient kept for legacy usage (e.g. accent gradients
   *  on appointment cards). New surfaces should prefer Mascot. */
  grad: [string, string];
  /** Foreground color for the legacy Icon on the gradient tile. */
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
    Mascot: PrimaryCareMascot,
    Icon: Stethoscope,
    grad: ['#2C6E6B', '#1F504E'],
    fg: '#FFFFFF',
  },
  {
    id: 'cardiology',
    label: 'Cardiology',
    Mascot: CardiologyMascot,
    Icon: HeartPulse,
    grad: ['#E07A5F', '#C45C3F'],
    fg: '#FFFFFF',
  },
  {
    id: 'neurology',
    label: 'Neurology',
    Mascot: NeurologyMascot,
    Icon: Brain,
    grad: ['#A8C4C2', '#6FA19E'],
    fg: '#1F504E',
  },
  {
    id: 'psychiatry',
    label: 'Psychiatry',
    Mascot: PsychiatryMascot,
    Icon: Smile,
    grad: ['#F5A3A3', '#D97575'],
    fg: '#FFFFFF',
  },
  {
    id: 'dermatology',
    label: 'Dermatology',
    Mascot: DermatologyMascot,
    Icon: Sparkles,
    grad: ['#F6C06A', '#D9964A'],
    fg: '#5C3D12',
  },
  {
    id: 'ob-gyn',
    label: 'OB-GYN',
    Mascot: ObGynMascot,
    Icon: Baby,
    grad: ['#C7B98F', '#9E8F5F'],
    fg: '#FFFFFF',
  },
  {
    id: 'orthopedics',
    label: 'Orthopedics',
    Mascot: OrthopedicsMascot,
    Icon: Bone,
    grad: ['#6CA4A0', '#3F7E7A'],
    fg: '#FFFFFF',
  },
  {
    id: 'ophthalmology',
    label: 'Ophthalmology',
    Mascot: OphthalmologyMascot,
    Icon: Eye,
    grad: ['#8A9FC7', '#5C75A1'],
    fg: '#FFFFFF',
  },
  {
    id: 'specialist',
    label: 'Other specialist',
    Mascot: SpecialistMascot,
    Icon: Hospital,
    grad: ['#D9BBA7', '#B58D73'],
    fg: '#5C3D12',
  },
  {
    id: 'other',
    label: 'Other',
    Mascot: OtherSpecialtyMascot,
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
