import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";

interface BriefMascotProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const STROKE = "#2C6E6B";
const EYE = "#1F504E";

/**
 * Mascot for the Briefs feature — used in the "no briefs yet" empty
 * states (Briefs tab + Clinician detail). A stacked-paper character:
 * a back sheet for depth, a front sheet that holds the face, a few
 * content lines suggesting the brief that's about to exist, and a
 * round seal/stamp at the bottom-right tinted with the parent's
 * accent.
 *
 * Body renders in cream with the brand teal stroke (constant
 * identity). The seal + accent details tint with the parent's
 * `color` so the mascot picks up the screen's accent. Matches the
 * LucideIcon interface so it slots into existing empty-state
 * components without further changes.
 */
export const BriefMascot: React.FC<BriefMascotProps> = ({
  size = moderateScale(40),
  color = STROKE,
  strokeWidth = 2,
}) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="brief-front" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F1E9D4" />
        </SvgLinearGradient>
        <SvgLinearGradient id="brief-back" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F4ECD7" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
        <SvgLinearGradient id="brief-seal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.8} />
          <Stop offset="1" stopColor={color} stopOpacity={1} />
        </SvgLinearGradient>
      </Defs>

      {/* Soft ground shadow */}
      <Ellipse cx={40} cy={72} rx={20} ry={2.4} fill={STROKE} opacity={0.1} />

      {/* Back paper — slight tilt for depth */}
      <Path
        d="M 22 16 L 64 14 L 66 60 L 24 62 Z"
        fill="url(#brief-back)"
        stroke={STROKE}
        strokeWidth={strokeWidth - 0.2}
        strokeLinejoin="round"
        opacity={0.85}
      />

      {/* Front paper — the main character */}
      <Path
        d="M 14 20 L 56 18 L 58 66 L 16 68 Z"
        fill="url(#brief-front)"
        stroke={STROKE}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Face — upper portion of front paper */}
      <Circle cx={26} cy={32} r={1.8} fill={EYE} />
      <Circle cx={36} cy={31.5} r={1.8} fill={EYE} />
      <Path
        d="M 26 37 Q 31 40 36 37"
        stroke={EYE}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheek blush */}
      <Circle cx={22} cy={35} r={1.4} fill={color} opacity={0.25} />
      <Circle cx={40} cy={35} r={1.4} fill={color} opacity={0.25} />

      {/* Content lines — brief body text */}
      <Path
        d="M 22 48 L 50 47"
        stroke={STROKE}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M 22 53 L 46 52.5"
        stroke={STROKE}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M 22 58 L 38 57.5"
        stroke={STROKE}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* Seal/stamp — bottom-right, tinted with accent */}
      <Circle
        cx={50}
        cy={60}
        r={5}
        fill="url(#brief-seal)"
        stroke={STROKE}
        strokeWidth={1.4}
      />
      {/* Tiny check inside the seal */}
      <Path
        d="M 47.5 60 L 49 61.5 L 52.5 58.5"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Tiny sparkle, top-right corner — picks up the tint */}
      <Path
        d="M 64 22 L 64 28 M 61 25 L 67 25"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);
