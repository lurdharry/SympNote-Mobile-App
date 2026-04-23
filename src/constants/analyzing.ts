import { Brain, ClipboardList, Sparkles } from 'lucide-react-native';

type IconRef = typeof Brain;

export interface AnalyzingStep {
  t: string;
  Icon: IconRef;
}

export interface StepTint {
  tileGrad: [string, string];
  glow: string;
}

export const ANALYZING_STEPS: readonly AnalyzingStep[] = [
  { t: 'Reading your answers', Icon: Brain },
  { t: 'Shaping your doctor prep', Icon: ClipboardList },
  { t: 'Making it yours', Icon: Sparkles },
] as const;

/**
 * Per-step visual identity. Each row gets its own gradient tile and
 * glow color so the three steps read as a sequence of distinct
 * stages rather than three identical checkboxes.
 */
export const STEP_TINTS: readonly StepTint[] = [
  {
    tileGrad: ['#3BA79F', '#1F504E'],
    glow: '#2C6E6B',
  },
  {
    tileGrad: ['#F6C06A', '#D9964A'],
    glow: '#F6C06A',
  },
  {
    tileGrad: ['#F5A3A3', '#C45C3F'],
    glow: '#E07A5F',
  },
] as const;

/**
 * Minimum time each step's indicator stays visible before completing.
 * The real work (deriving the profile, seeding an appointment, picking
 * a prompt) finishes faster than the animation reads, so we floor each
 * step to make it feel intentional without dragging it out.
 */
export const STEP_MIN_MS = [900, 1100, 900] as const;

/** Brief settle delay after all steps complete before switching to "ready". */
export const READY_SETTLE_MS = 450;
