import { Award, ClipboardCheck, Flame, Mic } from 'lucide-react-native';
import type { BadgeKey } from '@/hooks/useSettingsStats';

type IconRef = typeof Mic;

export interface ThemePalette {
  accent: string;
  coral: string;
  gold: string;
}

export interface BadgeStyle {
  Icon: IconRef;
  tint: string;
}

export const BADGE_STYLES: Record<BadgeKey, (palette: ThemePalette) => BadgeStyle> = {
  first: (p) => ({ Icon: Mic, tint: p.accent }),
  streak: (p) => ({ Icon: Flame, tint: p.coral }),
  prep: (p) => ({ Icon: ClipboardCheck, tint: p.gold }),
  thirty: (p) => ({ Icon: Award, tint: p.accent }),
};
