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
};

export const FOCUS_OPTIONS: FocusOption[] = [
  { id: 'chronic', t: 'Chronic condition',  s: 'Ongoing, recurring',    Icon: CircleDot, grad: ['#2C6E6B', '#1F504E'], fg: '#fff' },
  { id: 'new',     t: 'New symptom',         s: 'Unexplained, recent',   Icon: Search,    grad: ['#E07A5F', '#C45C3F'], fg: '#fff' },
  { id: 'mental',  t: 'Mental health',       s: 'Mood, sleep, anxiety',  Icon: Brain,     grad: ['#A8C4C2', '#6FA19E'], fg: '#1F504E' },
  { id: 'pre-op',  t: 'Procedure prep',      s: 'Before or after',       Icon: Hospital,  grad: ['#F6C06A', '#D9964A'], fg: '#5C3D12' },
  { id: 'loved',   t: 'For someone else',    s: 'Caregiver mode',        Icon: Heart,     grad: ['#F5A3A3', '#D97575'], fg: '#fff' },
  { id: 'general', t: 'General journal',     s: 'Just keeping track',    Icon: BookOpen,  grad: ['#C7B98F', '#9E8F5F'], fg: '#fff' },
];
