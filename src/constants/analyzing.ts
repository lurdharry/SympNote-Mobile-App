import { Brain, ClipboardList, Sparkles } from 'lucide-react-native';

type IconRef = typeof Brain;

export interface AnalyzingStep {
  t: string;
  Icon: IconRef;
}

export interface StepTint {
  tileGrad: [string, string];
  badgeGrad: [string, string];
  glow: string;
  text: string;
}

export const ANALYZING_STEPS: readonly AnalyzingStep[] = [
  { t: 'Analyzing your needs', Icon: Brain },
  { t: 'Building your prep plan', Icon: ClipboardList },
  { t: 'Personalizing your path', Icon: Sparkles },
] as const;

export const XP_PER_STEP = 10;

/**
 * Per-step visual identity. Each row gets its own gradient tile, glow
 * color, and XP-badge gradient so the three steps read as a sequence
 * of distinct achievements rather than three identical checkboxes.
 */
export const STEP_TINTS: readonly StepTint[] = [
  {
    tileGrad: ['#3BA79F', '#1F504E'],
    badgeGrad: ['#2C6E6B', '#1F504E'],
    glow: '#2C6E6B',
    text: '#FFFFFF',
  },
  {
    tileGrad: ['#F6C06A', '#D9964A'],
    badgeGrad: ['#D9964A', '#B45309'],
    glow: '#F6C06A',
    text: '#FFFFFF',
  },
  {
    tileGrad: ['#F5A3A3', '#C45C3F'],
    badgeGrad: ['#E07A5F', '#C45C3F'],
    glow: '#E07A5F',
    text: '#FFFFFF',
  },
] as const;

/** Milliseconds from mount at which each step lands, followed by ready. */
export const STEP_TIMELINE = [1100, 2300, 3500] as const;
export const READY_AT_MS = 4000;
