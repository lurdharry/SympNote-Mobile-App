import {
  BookOpen,
  Brain,
  CalendarCheck,
  Hospital,
  Search,
  TrendingUp,
} from 'lucide-react-native';
import type { FocusArea } from '@/stores/types';

type IconRef = typeof CalendarCheck;

export interface FocusOption {
  id: FocusArea;
  t: string;
  s: string;
  Icon: IconRef;
  grad: [string, string];
  fg: string;
  /** Example entries — shown under each option so users can see
   *  concretely what they'd be tracking under this goal. */
  examples: string[];
}

/**
 * Six orthogonal GOALS for tracking. These are intentionally distinct
 * from the Baseline question (which asks *who* the user is). Focus
 * asks *why* they're tracking — users can pick multiple, and their
 * focus set can shift over time as life happens.
 */
export const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: 'investigate',
    t: 'Investigate a new symptom',
    s: "Something's changed and you're trying to figure out what",
    Icon: Search,
    grad: ['#E07A5F', '#C45C3F'],
    fg: '#fff',
    examples: ['onset', 'duration', 'triggers'],
  },
  {
    id: 'upcoming-visit',
    t: 'Prep for an upcoming visit',
    s: "Walk in with everything your doctor needs to hear",
    Icon: CalendarCheck,
    grad: ['#2C6E6B', '#1F504E'],
    fg: '#fff',
    examples: ['questions', 'timeline', 'severity'],
  },
  {
    id: 'patterns',
    t: 'Catch recurring patterns',
    s: "See what repeats, flares, or trends over time",
    Icon: TrendingUp,
    grad: ['#F6C06A', '#D9964A'],
    fg: '#5C3D12',
    examples: ['flare-ups', 'cycles', 'triggers'],
  },
  {
    id: 'recovery-track',
    t: 'Track recovery',
    s: "Pre-op, post-op, or healing from something recent",
    Icon: Hospital,
    grad: ['#A8C4C2', '#6FA19E'],
    fg: '#1F504E',
    examples: ['milestones', 'setbacks', 'meds'],
  },
  {
    id: 'mental-health',
    t: 'Mental health',
    s: "Mood, sleep, and energy over time",
    Icon: Brain,
    grad: ['#F5A3A3', '#D97575'],
    fg: '#fff',
    examples: ['mood', 'sleep', 'energy'],
  },
  {
    id: 'general',
    t: 'General wellness journal',
    s: "Keeping track, no specific goal yet.",
    Icon: BookOpen,
    grad: ['#C7B98F', '#9E8F5F'],
    fg: '#fff',
    examples: ['daily', 'wellness', 'notes'],
  },
];
