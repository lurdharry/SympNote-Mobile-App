import { Brain, ClipboardList, Sparkles } from 'lucide-react-native';

type IconRef = typeof Brain;

export const ANALYZING_STEPS: Array<{ t: string; Icon: IconRef }> = [
  { t: 'Analyzing your needs',      Icon: Brain },
  { t: 'Building your prep plan',   Icon: ClipboardList },
  { t: 'Personalizing your path',   Icon: Sparkles },
];
