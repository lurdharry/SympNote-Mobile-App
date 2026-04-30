import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";

interface InsightsMascotProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const STROKE = "#2C6E6B";
const EYE = "#1F504E";

/**
 * Mascot for the Insights screen entry point. A tilted open notebook
 * with a small face peeking from the left page and an ascending
 * sparkline drawn across the right page — visually delivers "see the
 * patterns in your notes" in one glance.
 *
 * Pages render in cream with the brand teal stroke (constant identity).
 * The sparkline + dots tint with the parent's `color` so the mascot
 * picks up the screen's accent. Matches the LucideIcon interface so it
 * slots into the LockedView's `Icon` prop.
 */
export const InsightsMascot: React.FC<InsightsMascotProps> = ({
  size = moderateScale(40),
  color = STROKE,
  strokeWidth = 2,
}) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="ins-page" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F1E9D4" />
        </SvgLinearGradient>
        <SvgLinearGradient id="ins-page-back" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F4ECD7" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>

      {/* Soft shadow disc */}
      <Ellipse cx={40} cy={70} rx={22} ry={2.6} fill={STROKE} opacity={0.1} />

      {/* Open notebook — slight tilt for life. Two pages with a center spine. */}
      {/* Back/right page (slightly behind for depth) */}
      <Path
        d="M 40 22 L 70 24 L 68 64 L 40 62 Z"
        fill="url(#ins-page-back)"
        stroke={STROKE}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Front/left page */}
      <Path
        d="M 10 24 L 40 22 L 40 62 L 12 64 Z"
        fill="url(#ins-page)"
        stroke={STROKE}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Spine */}
      <Path
        d="M 40 22 L 40 62"
        stroke={STROKE}
        strokeWidth={strokeWidth - 0.4}
        strokeLinecap="round"
      />

      {/* Sparkline on right page — ascending, picks up the tint */}
      <Path
        d="M 44 54 L 50 48 L 56 50 L 64 38"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Data dots */}
      <Circle cx={44} cy={54} r={1.7} fill={color} />
      <Circle cx={50} cy={48} r={1.7} fill={color} />
      <Circle cx={56} cy={50} r={1.7} fill={color} />
      <Circle cx={64} cy={38} r={2.2} fill={color} />

      {/* Tiny ruled lines on left page (very subtle, suggesting "notes") */}
      <Path
        d="M 18 34 L 34 33"
        stroke={STROKE}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.35}
      />
      <Path
        d="M 18 39 L 32 38"
        stroke={STROKE}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.35}
      />

      {/* Face peeking from the left page — gentle, slightly off-center */}
      <Circle cx={20} cy={50} r={1.6} fill={EYE} />
      <Circle cx={28} cy={49.5} r={1.6} fill={EYE} />
      <Path
        d="M 20 54 Q 24 56.5 28 54"
        stroke={EYE}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Tiny sparkle, top-right corner — picks up the tint */}
      <Path
        d="M 64 16 L 64 22 M 61 19 L 67 19"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);
