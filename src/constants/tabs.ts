import type React from 'react';
import {
  BriefsGlyph,
  HistoryGlyph,
  HomeGlyph,
  InsightsGlyph,
  SettingsGlyph,
} from '../components/tabs/TabGlyphs';

type TabGlyph = React.FC<{ size?: number; color?: string }>;

export interface TabConfig {
  name: string;
  label: string;
  Glyph: TabGlyph;
}

export const TABS: readonly TabConfig[] = [
  { name: 'home',     label: 'Home',     Glyph: HomeGlyph },
  { name: 'prep',     label: 'Briefs',   Glyph: BriefsGlyph },
  { name: 'insights', label: 'Insights', Glyph: InsightsGlyph },
  { name: 'history',  label: 'History',  Glyph: HistoryGlyph },
  { name: 'settings', label: 'Settings', Glyph: SettingsGlyph },
] as const;
