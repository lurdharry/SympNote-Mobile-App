import {
  Bell,
  BookOpen,
  Brain,
  Calendar,
  Hourglass,
  MessageCircle,
  NotebookPen,
  Pin,
  Sparkles,
  Sprout,
  Target,
  Timer,
} from 'lucide-react-native';

type IconRef = typeof Calendar;

/* -------------------- Hook (screen 01) -------------------- */

export const FULL_HEADLINE = "Your doctor's visit,\nfinally prepared.";

/* -------------------- Qualifier (screen 02) -------------------- */

export type Option = { t: string; v: string };

export type Question = {
  id: string;
  ask: string;
  options?: Option[];
  kind?: 'date';
};

export const QUESTIONS: Question[] = [
  {
    id: 'doctor',
    ask: 'First — do you see a doctor regularly?',
    options: [
      { t: 'Yes, often', v: 'often' },
      { t: 'Sometimes', v: 'sometimes' },
      { t: 'Rarely', v: 'rarely' },
    ],
  },
  {
    id: 'pain',
    ask: "What's hardest about doctor visits for you?",
    options: [
      { t: 'Remembering symptoms', v: 'memory' },
      { t: 'Explaining clearly', v: 'clarity' },
      { t: 'Feeling rushed', v: 'time' },
      { t: 'Taking notes', v: 'notes' },
    ],
  },
  {
    id: 'forget',
    ask: 'And honestly — how often do you forget something important?',
    options: [
      { t: 'Almost always', v: 'always' },
      { t: 'Often', v: 'often' },
      { t: 'Sometimes', v: 'sometimes' },
      { t: 'Rarely', v: 'rarely' },
    ],
  },
  {
    id: 'next',
    ask: "When's your next appointment? We'll count down and prep you.",
    kind: 'date',
  },
];

export type PlanItem = { Icon: IconRef; title: string; sub: string };

/** Plan card rows unlocked as the user answers each qualifier question. */
export const PLAN_UNLOCKS: Record<string, PlanItem> = {
  'doctor:often':     { Icon: Calendar,      title: 'Cross-visit timeline',  sub: 'We connect patterns between visits' },
  'doctor:sometimes': { Icon: Calendar,      title: 'Visit-ready summaries', sub: 'Ready whenever you book next' },
  'doctor:rarely':    { Icon: Sprout,        title: 'Grow-at-your-pace',     sub: 'Log when it matters, no pressure' },
  'pain:memory':      { Icon: Brain,         title: 'Daily memory nudges',   sub: 'Gentle reminders to log small things' },
  'pain:clarity':     { Icon: MessageCircle, title: 'Clear summaries',       sub: 'Your words, organized for your doctor' },
  'pain:time':        { Icon: Timer,         title: 'One-page visit brief',  sub: 'Nothing important gets rushed past' },
  'pain:notes':       { Icon: NotebookPen,   title: 'Automatic note-taking', sub: 'We capture, you focus on the doctor' },
  'forget:always':    { Icon: Target,        title: 'Gentle recall prompts', sub: "We'll jog memory before each visit" },
  'forget:often':     { Icon: Bell,          title: 'Pre-visit checklist',   sub: 'Key things to mention, ready to go' },
  'forget:sometimes': { Icon: Sparkles,      title: 'Smart highlights',      sub: 'We surface what matters most' },
  'forget:rarely':    { Icon: BookOpen,      title: 'Deep visit archive',    sub: 'Searchable history of every visit' },
  'next:scheduled':   { Icon: Hourglass,     title: 'Appointment countdown', sub: 'Prep builds as your visit approaches' },
  'next:none':        { Icon: Pin,           title: 'Ready when you book',   sub: "We'll prep the moment you schedule" },
};

/* -------------------- Care team palette -------------------- */

export const CARE_TEAM_PALETTE = [
  '#2C6E6B',
  '#E07A5F',
  '#F6C06A',
  '#5A8F6E',
  '#A8C4C2',
];
