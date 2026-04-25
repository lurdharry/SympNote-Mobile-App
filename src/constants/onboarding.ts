import type { ComponentType } from 'react';
import {
  Activity,
  Bone,
  Brain,
  Calendar,
  Cigarette,
  Droplet,
  Droplets,
  Flame,
  Flower2,
  HeartPulse,
  Ribbon,
  Shield,
  Sprout,
  Wind,
  Zap,
} from 'lucide-react-native';
import {
  FlameMascot,
  PulseMascot,
  SparkMascot,
  SproutMascot,
  StarMascot,
} from '@/components/onboarding/AgeMascots';

type IconRef = typeof Calendar;

/**
 * Optional mini-mascot for an option chip. When every option in a
 * question has one, ChipTray switches to a card layout with the
 * mascot at top + label below.
 */
export interface MascotProps {
  size: number;
  tint: string;
}
export type MascotRef = ComponentType<MascotProps>;

/* -------------------- Hook (screen 01) -------------------- */

export const FULL_HEADLINE = "Your doctor's visit,\nfinally prepared.";

/* -------------------- Qualifier (screen 02) -------------------- */

export interface Option {
  t: string;
  v: string;
  /** Lucide icon rendered in the chip's left-tile. Optional. */
  Icon?: IconRef;
  /** Optional mini-mascot. When every option has one, the tray
   *  switches to a richer card layout with the mascot above the
   *  label. */
  Mascot?: MascotRef;
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
  /**
   * When true (multi-select only), an "Add your own..." text input
   * appears below the curated chips. User-typed values become
   * selectable chips that are saved alongside any selected presets.
   * Use for open-ended lists where the curated set can't cover
   * everything (e.g. conditions, medications).
   */
  allowCustom?: boolean;
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
      { t: '12 to 17',   v: 'teen',    Icon: Sprout,    Mascot: SproutMascot, tint: '#5A8F6E' },
      { t: '18 to 29',   v: '18-29',   Icon: Zap,       Mascot: SparkMascot,  tint: '#2C6E6B' },
      { t: '30 to 49',   v: '30-49',   Icon: Flame,     Mascot: FlameMascot,  tint: '#C88A4A' },
      { t: '50 to 64',   v: '50-64',   Icon: HeartPulse, Mascot: PulseMascot, tint: '#E07A5F' },
      { t: '65 or older', v: '65-plus', Icon: HeartPulse, Mascot: StarMascot,  tint: '#6CA4A0' },
    ],
  },
  {
    id: 'conditions',
    profileKey: 'knownConditions',
    ask: 'Any known conditions or meds worth noting?',
    hint: "So you don't have to re-explain your conditions at every visit. Pick any that apply, or skip if nothing fits.",
    multi: true,
    skippable: true,
    allowCustom: true,
    options: [
      { t: 'High blood pressure',     v: 'hypertension',  Icon: HeartPulse, tint: '#E07A5F' },
      { t: 'High cholesterol',        v: 'cholesterol',   Icon: Droplets,   tint: '#C88A4A' },
      { t: 'Diabetes',                v: 'diabetes',      Icon: Droplet,    tint: '#C88A4A' },
      { t: 'Allergies',               v: 'allergies',     Icon: Flower2,    tint: '#F6C06A' },
      { t: 'Acid reflux',             v: 'gerd',          Icon: Flame,      tint: '#E07A5F' },
      { t: 'Depression or anxiety',   v: 'depression',    Icon: Brain,      tint: '#6CA4A0' },
      { t: 'Arthritis',               v: 'arthritis',     Icon: Bone,       tint: '#8A6A4A' },
      { t: 'Migraines',               v: 'migraines',     Icon: Zap,        tint: '#C88A4A' },
      { t: 'Asthma',                  v: 'asthma',        Icon: Wind,       tint: '#6CA4A0' },
      { t: 'Thyroid condition',       v: 'thyroid',       Icon: Activity,   tint: '#2C6E6B' },
      { t: 'Heart condition',         v: 'heart',         Icon: HeartPulse, tint: '#E07A5F' },
      { t: 'Autoimmune',              v: 'autoimmune',    Icon: Shield,     tint: '#5A8F6E' },
      { t: 'Cancer (current or past)', v: 'cancer',       Icon: Ribbon,     tint: '#F5A3A3' },
      { t: 'Smoker / recently quit',  v: 'smoker',        Icon: Cigarette,  tint: '#8A6A4A' },
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
