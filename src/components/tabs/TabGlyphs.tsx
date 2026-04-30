import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";

/**
 * Tab-bar glyphs — single-color brand line icons that tint between
 * accent and tertiary like Lucide icons do, but with shapes pulled
 * from the Sympnote mascot vocabulary (chart with pulse line, gear
 * with hub, etc.).
 *
 * Each glyph takes a {size, color} pair matching the Lucide API so
 * the layout can tint between active and inactive states.
 */

interface GlyphProps {
  size?: number;
  color?: string;
}

const STROKE = 1.9;

// ─── 1. HomeGlyph — house outline with a single window pip ────────────

export const HomeGlyph: React.FC<GlyphProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Roof + body in one continuous path */}
    <Path
      d="M 3 11 L 12 3 L 21 11 V 19 Q 21 21 19 21 H 5 Q 3 21 3 19 Z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Window — small filled square in the brand vocabulary */}
    <Rect x={10} y={12} width={4} height={4} rx={0.6} fill={color} />
  </Svg>
);

// ─── 2. BriefsGlyph — chart with folded corner + pulse ────────────────

export const BriefsGlyph: React.FC<GlyphProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Chart outline with folded corner */}
    <Path
      d="M 6 3 H 14 L 19 8 V 19 Q 19 21 17 21 H 6 Q 4 21 4 19 V 5 Q 4 3 6 3 Z"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Folded corner crease */}
    <Path
      d="M 14 3 V 8 H 19"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Pulse line — the brand signature */}
    <Path
      d="M 7 14 L 9 14 L 10.5 12 L 12 16 L 13.5 14 L 16 14"
      stroke={color}
      strokeWidth={STROKE * 0.85}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── 3. InsightsGlyph — three rising bars + spark ────────────────────

export const InsightsGlyph: React.FC<GlyphProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Baseline */}
    <Path d="M 3 20 H 21" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    {/* Three bars — short, medium, tall */}
    <Rect x={5} y={14} width={3.6} height={6} rx={0.8} stroke={color} strokeWidth={STROKE} />
    <Rect x={10.2} y={10} width={3.6} height={10} rx={0.8} stroke={color} strokeWidth={STROKE} />
    <Rect x={15.4} y={6} width={3.6} height={14} rx={0.8} stroke={color} strokeWidth={STROKE} />
    {/* Tiny brand sparkle on top of tallest */}
    <Path
      d="M 17 2 L 17.7 3.6 L 19.3 4.3 L 17.7 5 L 17 6.6 L 16.3 5 L 14.7 4.3 L 16.3 3.6 Z"
      fill={color}
    />
  </Svg>
);

// ─── 4. HistoryGlyph — clock with two hands ──────────────────────────

export const HistoryGlyph: React.FC<GlyphProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Clock face */}
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} />
    {/* Hour hand — points to 10 */}
    <Path d="M 12 12 L 8 9" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    {/* Minute hand — points to 2 */}
    <Path d="M 12 12 L 15 8" stroke={color} strokeWidth={STROKE * 0.9} strokeLinecap="round" />
    {/* Center pip */}
    <Circle cx={12} cy={12} r={1.2} fill={color} />
  </Svg>
);

// ─── 5. SettingsGlyph — gear with hub ────────────────────────────────

export const SettingsGlyph: React.FC<GlyphProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Eight gear teeth around the body */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <Rect
        key={deg}
        x={11}
        y={1.2}
        width={2}
        height={3.6}
        rx={0.6}
        fill={color}
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
    {/* Gear body */}
    <Circle cx={12} cy={12} r={6.8} stroke={color} strokeWidth={STROKE} fill="none" />
    {/* Inner hub */}
    <Circle cx={12} cy={12} r={2.2} fill={color} />
  </Svg>
);
