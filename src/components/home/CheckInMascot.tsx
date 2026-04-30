import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";

interface CheckInMascotProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const STROKE = "#2C6E6B";
const EYE = "#1F504E";
const PETAL_DARK = "#2C6E6B";

/**
 * Mascot for the "How are you feeling today?" home state. A small
 * 6-petal bloom with a gentle face on the center disc — the *open
 * flower* metaphor reads as "share how you're feeling today" without
 * needing words. One petal lifts asymmetrically so the character feels
 * alive rather than stamped, and a small dewdrop on a leaf below adds
 * the daily/morning cue ("today").
 *
 * Petals tint with the parent's `color` prop so the bloom adopts the
 * home card's accent (teal in routine, coral in urgency). The face,
 * stem, and leaf stay in the brand cream/teal so the character
 * identity is constant across states.
 *
 * Matches the LucideIcon prop interface (size / color / strokeWidth)
 * so it slots into the ReadyStateCard's `Slot.Icon` field with no
 * other changes.
 */
export const CheckInMascot: React.FC<CheckInMascotProps> = ({
  size = moderateScale(40),
  color = PETAL_DARK,
  strokeWidth = 2,
}) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="checkin-petal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.55} />
          <Stop offset="1" stopColor={color} stopOpacity={0.95} />
        </SvgLinearGradient>
        <SvgLinearGradient id="checkin-petal-lift" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.75} />
          <Stop offset="1" stopColor={color} stopOpacity={1} />
        </SvgLinearGradient>
        <SvgLinearGradient id="checkin-face" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F1E9D4" />
        </SvgLinearGradient>
        <SvgLinearGradient id="checkin-leaf" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9BD2A6" />
          <Stop offset="1" stopColor="#5A8F6E" />
        </SvgLinearGradient>
      </Defs>

      {/* Soft shadow disc beneath — anchors the bloom */}
      <Ellipse cx={40} cy={72} rx={15} ry={2.4} fill={STROKE} opacity={0.1} />

      {/* Stem with a single tilted leaf — the "today" cue */}
      <Path
        d="M 40 56 Q 40 64 40 70"
        stroke="#5A8F6E"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M 40 64 Q 50 62 54 56 Q 47 58 40 62 Z"
        fill="url(#checkin-leaf)"
        stroke="#3D6A4D"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      {/* 5 base petals laid in a ring around the center */}
      <G>
        {/* Top */}
        <Ellipse
          cx={40}
          cy={18}
          rx={9}
          ry={13}
          fill="url(#checkin-petal)"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.85}
        />
        {/* Upper-right */}
        <G rotation={72} origin="40, 40">
          <Ellipse
            cx={40}
            cy={18}
            rx={9}
            ry={13}
            fill="url(#checkin-petal)"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={0.85}
          />
        </G>
        {/* Lower-right */}
        <G rotation={144} origin="40, 40">
          <Ellipse
            cx={40}
            cy={18}
            rx={9}
            ry={13}
            fill="url(#checkin-petal)"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={0.85}
          />
        </G>
        {/* Lower-left */}
        <G rotation={216} origin="40, 40">
          <Ellipse
            cx={40}
            cy={18}
            rx={9}
            ry={13}
            fill="url(#checkin-petal)"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={0.85}
          />
        </G>
        {/* Upper-left — slightly lifted (asymmetry = alive) */}
        <G rotation={-72} origin="40, 40">
          <Ellipse
            cx={40}
            cy={14}
            rx={9.5}
            ry={13.5}
            fill="url(#checkin-petal-lift)"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </G>
      </G>

      {/* Center face disc — cream interior, teal stroke (brand-locked) */}
      <Circle
        cx={40}
        cy={40}
        r={11}
        fill="url(#checkin-face)"
        stroke={STROKE}
        strokeWidth={strokeWidth + 0.2}
      />

      {/* Eyes — gentle, set wide for an open expression */}
      <Circle cx={36} cy={39} r={1.6} fill={EYE} />
      <Circle cx={44} cy={39} r={1.6} fill={EYE} />

      {/* Small smile — soft upturn */}
      <Path
        d="M 35.5 43.5 Q 40 46.5 44.5 43.5"
        stroke={EYE}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheek blush — barely-there warmth */}
      <Circle cx={32.5} cy={42.5} r={1.4} fill={color} opacity={0.25} />
      <Circle cx={47.5} cy={42.5} r={1.4} fill={color} opacity={0.25} />
    </Svg>
  </View>
);
