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

interface AllCaughtUpMascotProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const STROKE = "#2C6E6B";
const EYE = "#1F504E";

/**
 * Mascot for the home `rhythm-current` state — "you're current,
 * nothing to do." A calm pebble character with closed (sleepy)
 * eyes and a soft smile, paired with a checkmark sparkle floating
 * above. Reads at a glance as "everything's settled" without
 * needing the copy.
 *
 * Distinct silhouette from the rest of the home mascots:
 *   • CheckInMascot is a bloom (active capture moment).
 *   • RecordMascot is a mic (capture intent).
 *   • BriefMascot is a stacked paper (brief output).
 *   • This one is a pebble with eyes-closed posture.
 *
 * Matches the LucideIcon prop interface (size / color /
 * strokeWidth) so it slots into ReadyStateCard's `Slot.Icon` field
 * without any other changes.
 */
export const AllCaughtUpMascot: React.FC<AllCaughtUpMascotProps> = ({
  size = moderateScale(40),
  color = STROKE,
  strokeWidth = 2,
}) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="caught-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F1E9D4" />
        </SvgLinearGradient>
      </Defs>

      {/* Soft ground shadow */}
      <Ellipse cx={40} cy={70} rx={20} ry={2.4} fill={STROKE} opacity={0.1} />

      {/* Pebble body — slightly squashed, looks settled rather than alert */}
      <Path
        d="M 18 38 C 18 24, 28 18, 40 18 C 52 18, 62 24, 62 38 C 62 56, 52 62, 40 62 C 28 62, 18 56, 18 38 Z"
        fill="url(#caught-body)"
        stroke={STROKE}
        strokeWidth={strokeWidth + 0.2}
        strokeLinejoin="round"
      />

      {/* Closed/sleepy eyes — gentle downward arcs ("‿ ‿") to read as
          "at rest" rather than the open dots used elsewhere */}
      <Path
        d="M 30 38 Q 33 41 36 38"
        stroke={EYE}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 44 38 Q 47 41 50 38"
        stroke={EYE}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />

      {/* Soft smile — small upturn, content not exuberant */}
      <Path
        d="M 35 46 Q 40 49 45 46"
        stroke={EYE}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheek blush */}
      <Circle cx={28} cy={44} r={1.6} fill={color} opacity={0.25} />
      <Circle cx={52} cy={44} r={1.6} fill={color} opacity={0.25} />

      {/* Checkmark sparkle above — the "all done" signal, tinted with
          the screen's accent so the cue picks up the card color */}
      <Path
        d="M 56 12 L 60 16 L 68 8"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Two tiny accent dots flanking the check, like a quiet halo */}
      <Circle cx={52} cy={14} r={1.2} fill={color} opacity={0.45} />
      <Circle cx={70} cy={14} r={1.2} fill={color} opacity={0.45} />
    </Svg>
  </View>
);
