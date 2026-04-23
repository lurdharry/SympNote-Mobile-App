import {
  Activity,
  Brain,
  Calendar,
  Cigarette,
  Droplet,
  Flame,
  HeartPulse,
  Pill,
  Shield,
  Sparkles,
  Sprout,
  Wind,
  Zap,
} from 'lucide-react-native';

type IconRef = typeof Calendar;

/* -------------------- Hook (screen 01) -------------------- */

export const FULL_HEADLINE = "Your doctor's visit,\nfinally prepared.";

/* -------------------- Qualifier (screen 02) -------------------- */

export interface Option {
  t: string;
  v: string;
  /** Lucide icon rendered in the chip's left-tile. Optional. */
  Icon?: IconRef;
  /** Tint applied to the chip's icon tile. */
  tint?: string;
}

export interface Question {
  id: string;
  /** Key to persist the answer under in `onboardingAnswers`. */
  profileKey: string;
  ask: string;
  options?: Option[];
  /**
   * When true, the user can pick multiple options and the answer is
   * stored as `string[]`. Defaults to single-select (stored as
   * string). A "Done" button appears in the chip tray.
   */
  multi?: boolean;
  /**
   * When true, the chip tray shows a "Skip" affordance. Skipping
   * advances the flow without persisting an answer; downstream
   * derivation falls back to a sensible default.
   */
  skippable?: boolean;
  /** Optional hint copy shown under the assistant bubble. */
  hint?: string;
}

/**
 * The two qualifier questions. Every answer gives the AI a hard
 * clinical prior it cannot infer from voice transcripts alone:
 *
 *  Q1 — Age band. The single biggest axis for clinical reasoning.
 *  Q2 — Known conditions. The baseline the AI should interpret new
 *       entries against.
 *
 * Everything else (summary style, reminder cadence, time-of-day
 * patterns) is either a preference that belongs in Settings or an
 * observable signal the app derives from real logs.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'age',
    profileKey: 'ageBand',
    ask: 'First, how old are you?',
    hint: "Your age tells Sympnote what normal looks like for you. A 25 year old's fatigue reads different from a 65 year old's.",
    options: [
      { t: '12 to 17', v: 'teen',    Icon: Sprout,   tint: '#5A8F6E' },
      { t: '18 to 29', v: '18-29',   Icon: Zap,      tint: '#2C6E6B' },
      { t: '30 to 49', v: '30-49',   Icon: Flame,    tint: '#C88A4A' },
      { t: '50 to 64', v: '50-64',   Icon: Activity, tint: '#E07A5F' },
      { t: '65 or older', v: '65-plus', Icon: Sparkles, tint: '#6CA4A0' },
    ],
  },
  {
    id: 'conditions',
    profileKey: 'knownConditions',
    ask: 'Any known conditions or meds worth noting?',
    hint: "So you don't have to re-explain your conditions at every visit. Pick any that apply, or skip if nothing fits.",
    multi: true,
    skippable: true,
    options: [
      { t: 'Asthma',               v: 'asthma',          Icon: Wind,       tint: '#6CA4A0' },
      { t: 'Diabetes',             v: 'diabetes',        Icon: Droplet,    tint: '#C88A4A' },
      { t: 'High blood pressure',  v: 'hypertension',    Icon: HeartPulse, tint: '#E07A5F' },
      { t: 'Depression or anxiety', v: 'depression',     Icon: Brain,      tint: '#6CA4A0' },
      { t: 'Migraines',            v: 'migraines',       Icon: Zap,        tint: '#C88A4A' },
      { t: 'Autoimmune',           v: 'autoimmune',      Icon: Shield,     tint: '#5A8F6E' },
      { t: 'Thyroid',              v: 'thyroid',         Icon: Activity,   tint: '#2C6E6B' },
      { t: 'Heart condition',      v: 'heart',           Icon: HeartPulse, tint: '#E07A5F' },
      { t: 'Regular medications',  v: 'on-meds',         Icon: Pill,       tint: '#C88A4A' },
      { t: 'Smoker / recently quit', v: 'smoker',        Icon: Cigarette,  tint: '#8A6A4A' },
    ],
  },
];

/**
 * Choreography timings for the qualifier chat flow. Tune in one place
 * rather than hunting magic numbers across the screen and its
 * sub-components.
 */
export const QUALIFIER_TIMINGS = {
  /** Assistant typing indicator before each new question. */
  typingMs: 650,
  /** Pause between user answer and next question. */
  advanceMs: 450,
  /** Extra pause on the final answer before routing forward. */
  completeMs: 600,
  /** Assistant bubble entrance. */
  bubbleDurationMs: 320,
  /** User bubble entrance. */
  userBubbleDurationMs: 280,
  /** Chip entrance duration + stagger between consecutive chips. */
  chipDurationMs: 280,
  chipStaggerMs: 40,
} as const;

/* -------------------- Care team palette -------------------- */

export const CARE_TEAM_PALETTE = [
  '#2C6E6B',
  '#E07A5F',
  '#F6C06A',
  '#5A8F6E',
  '#A8C4C2',
];
