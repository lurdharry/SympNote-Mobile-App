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

interface RecordMascotProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const STROKE = "#2C6E6B";
const EYE = "#1F504E";

/**
 * Mascot for the Record screen entry point. A friendly microphone
 * character: round head as the face (eyes + smile), a small grille
 * pattern, a stand below, and two soft sound-wave arcs flanking the
 * head that say "speak — I'm listening."
 *
 * Mic body renders in cream with the brand teal stroke (constant
 * identity). The sound waves and base accent tint with the parent's
 * `color` so the mascot picks up the screen's accent. Matches the
 * LucideIcon interface so it slots into the LockedView's `Icon` prop.
 */
export const RecordMascot: React.FC<RecordMascotProps> = ({
  size = moderateScale(40),
  color = STROKE,
  strokeWidth = 2,
}) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="rec-head" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F1E9D4" />
        </SvgLinearGradient>
        <SvgLinearGradient id="rec-base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.4} />
          <Stop offset="1" stopColor={color} stopOpacity={0.85} />
        </SvgLinearGradient>
      </Defs>

      {/* Soft ground shadow */}
      <Ellipse cx={40} cy={72} rx={16} ry={2.4} fill={STROKE} opacity={0.1} />

      {/* Sound waves — outer, picks up the tint */}
      <Path
        d="M 14 28 Q 8 40 14 52"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <Path
        d="M 66 28 Q 72 40 66 52"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      {/* Sound waves — inner, stronger */}
      <Path
        d="M 22 32 Q 19 40 22 48"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 58 32 Q 61 40 58 48"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />

      {/* Mic stand neck — short rod between head and base */}
      <Path
        d="M 40 56 L 40 64"
        stroke={STROKE}
        strokeWidth={2.4}
        strokeLinecap="round"
      />

      {/* Mic base — flattened ellipse, tinted with accent */}
      <Path
        d="M 28 66 Q 40 60 52 66 Q 40 72 28 66 Z"
        fill="url(#rec-base)"
        stroke={STROKE}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Mic head — capsule shape with cream fill */}
      <Path
        d="M 28 30 Q 28 18 40 18 Q 52 18 52 30 L 52 44 Q 52 56 40 56 Q 28 56 28 44 Z"
        fill="url(#rec-head)"
        stroke={STROKE}
        strokeWidth={strokeWidth + 0.2}
        strokeLinejoin="round"
      />

      {/* Subtle grille hint — three faint horizontal lines mid-head */}
      <Path
        d="M 32 48 L 48 48"
        stroke={STROKE}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.3}
      />
      <Path
        d="M 32 51 L 48 51"
        stroke={STROKE}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.3}
      />

      {/* Eyes — gentle dots, set wide */}
      <Circle cx={35} cy={32} r={1.7} fill={EYE} />
      <Circle cx={45} cy={32} r={1.7} fill={EYE} />

      {/* Smile — soft upturn */}
      <Path
        d="M 35 38 Q 40 41 45 38"
        stroke={EYE}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheek blush — barely-there warmth, tinted */}
      <Circle cx={32} cy={36} r={1.3} fill={color} opacity={0.25} />
      <Circle cx={48} cy={36} r={1.3} fill={color} opacity={0.25} />
    </Svg>
  </View>
);
