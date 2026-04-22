import {
  BookOpen,
  Brain,
  CircleDot,
  Heart,
  Hospital,
  Search,
} from 'lucide-react-native';

type IconRef = typeof CircleDot;

export type FocusOption = {
  id: string;
  t: string;
  s: string;
  Icon: IconRef;
  grad: [string, string];
  fg: string;
  /** Example symptom tags — shown under each option so users can see
   *  concretely what they'd be tracking. */
  examples: string[];
};

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: 'chronic',
    t: 'Chronic condition',
    s: 'Recurring patterns you want to stay ahead of',
    Icon: CircleDot,
    grad: ['#2C6E6B', '#1F504E'],
    fg: '#fff',
    examples: ['joint pain', 'fatigue', 'flare-up'],
  },
  {
    id: 'new',
    t: 'New symptom',
    s: 'Recent and unexplained — help your doctor catch up',
    Icon: Search,
    grad: ['#E07A5F', '#C45C3F'],
    fg: '#fff',
    examples: ['headache', 'dizziness', 'rash'],
  },
  {
    id: 'mental',
    t: 'Mental health',
    s: 'Mood, sleep, and energy over time',
    Icon: Brain,
    grad: ['#A8C4C2', '#6FA19E'],
    fg: '#1F504E',
    examples: ['mood', 'sleep', 'anxiety'],
  },
  {
    id: 'pre-op',
    t: 'Procedure prep',
    s: 'Before and after — recovery notes that matter',
    Icon: Hospital,
    grad: ['#F6C06A', '#D9964A'],
    fg: '#5C3D12',
    examples: ['pre-op', 'recovery', 'meds'],
  },
  {
    id: 'loved',
    t: 'For someone else',
    s: 'Caregiver mode — track on behalf of a loved one',
    Icon: Heart,
    grad: ['#F5A3A3', '#D97575'],
    fg: '#fff',
    examples: ['parent', 'child', 'meds'],
  },
  {
    id: 'general',
    t: 'General journal',
    s: 'Just keeping track — no specific goal yet',
    Icon: BookOpen,
    grad: ['#C7B98F', '#9E8F5F'],
    fg: '#fff',
    examples: ['daily', 'wellness', 'notes'],
  },
];
