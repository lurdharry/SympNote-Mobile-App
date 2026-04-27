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

/**
 * Mascots for the prep-gap problem-anchor screen. Each face expresses
 * the relative pain of forgetting things at the doctor: distress,
 * uncertainty, calm, confidence.
 *
 * Same paper-clinical family as AllergyMascots: cream/teal/gold
 * palette, soft round bodies, friendly eyes. Where AllergyMascots
 * emphasise object-character (a pill, an apple), these emphasise
 * face-character (an emotional state on a round body).
 */
interface MascotProps {
  size?: number;
}

const wrap = (size: number) => ({
  width: size,
  height: size,
  alignItems: "center" as const,
  justifyContent: "center" as const,
});

const STROKE = "#2C6E6B";
const EYE = "#1F504E";

// ─── Often — squinted eyes, downturned mouth, stress squiggle ────────────
// "Almost every visit" — this character is kicking themselves.

export const OftenMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="often-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Stress squiggles — crooked zigzags above */}
      <Path
        d="M 20 12 L 24 8 L 26 12 L 30 8"
        stroke="#C45C3F"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 54 14 L 58 10 L 60 14"
        stroke="#C45C3F"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Round face */}
      <Circle cx={40} cy={48} r={26} fill="url(#often-body)" stroke={STROKE} strokeWidth={2.4} />
      {/* Squinted eyes — closed-line >< */}
      <Path
        d="M 27 44 Q 30 48 33 44"
        stroke={EYE}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 47 44 Q 50 48 53 44"
        stroke={EYE}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* Downturned mouth */}
      <Path
        d="M 32 60 Q 40 54 48 60"
        stroke={EYE}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheek blush — pink */}
      <Circle cx={26} cy={54} r={3} fill="#F5A3A3" opacity={0.55} />
      <Circle cx={54} cy={54} r={3} fill="#F5A3A3" opacity={0.55} />
    </Svg>
  </View>
);

// ─── Sometimes — one squint one open, wavy mouth, single ! ──────────────
// "About half the time" — uncertain, off-balance.

export const SometimesMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="sometimes-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Hovering "!" beside the head */}
      <Path
        d="M 64 14 V 22"
        stroke="#D9964A"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Circle cx={64} cy={26} r={1.6} fill="#D9964A" />
      {/* Round face */}
      <Circle cx={40} cy={48} r={26} fill="url(#sometimes-body)" stroke={STROKE} strokeWidth={2.4} />
      {/* Left eye — open */}
      <Circle cx={31} cy={44} r={2.4} fill={EYE} />
      {/* Right eye — squinted line */}
      <Path
        d="M 46 43 Q 49 46 52 43"
        stroke={EYE}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* Wavy uncertain mouth */}
      <Path
        d="M 30 58 Q 34 60 38 58 Q 42 56 46 58 Q 50 60 50 58"
        stroke={EYE}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Faint cheek blush — left only, asymmetric */}
      <Circle cx={26} cy={52} r={3} fill="#F5A3A3" opacity={0.5} />
    </Svg>
  </View>
);

// ─── Occasional — calm eyes, neutral mouth, small thoughtful dot ────────
// "Now and then" — composed, mildly thoughtful.

export const OccasionalMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="occasional-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Tiny thinking-dot above */}
      <Circle cx={62} cy={16} r={2.4} fill="#A8C4C2" opacity={0.85} />
      <Circle cx={56} cy={22} r={1.6} fill="#A8C4C2" opacity={0.6} />
      {/* Round face */}
      <Circle cx={40} cy={48} r={26} fill="url(#occasional-body)" stroke={STROKE} strokeWidth={2.4} />
      {/* Calm eyes — small filled */}
      <Circle cx={31} cy={45} r={2.2} fill={EYE} />
      <Circle cx={49} cy={45} r={2.2} fill={EYE} />
      {/* Subtle gleam on each eye */}
      <Circle cx={32.2} cy={43.8} r={0.8} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={50.2} cy={43.8} r={0.8} fill="#FFFFFF" opacity={0.85} />
      {/* Neutral mouth — short flat line */}
      <Path
        d="M 34 58 Q 40 60 46 58"
        stroke={EYE}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheek blush — soft */}
      <Circle cx={26} cy={53} r={3} fill="#F5A3A3" opacity={0.45} />
      <Circle cx={54} cy={53} r={3} fill="#F5A3A3" opacity={0.45} />
    </Svg>
  </View>
);

// ─── Rare — confident smile, gold sparkle accent ────────────────────────
// "Rarely — I'm prepared" — this character has it together.

export const RareMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="rare-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
        <SvgLinearGradient id="rare-spark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      {/* Round face */}
      <Circle cx={40} cy={48} r={26} fill="url(#rare-body)" stroke={STROKE} strokeWidth={2.4} />
      {/* Confident eyes — small filled with gleam */}
      <Circle cx={31} cy={44} r={2.4} fill={EYE} />
      <Circle cx={49} cy={44} r={2.4} fill={EYE} />
      <Circle cx={32.2} cy={42.8} r={0.9} fill="#FFFFFF" opacity={0.9} />
      <Circle cx={50.2} cy={42.8} r={0.9} fill="#FFFFFF" opacity={0.9} />
      {/* Cheek blush — warm */}
      <Circle cx={26} cy={52} r={3.4} fill="#F5A3A3" opacity={0.6} />
      <Circle cx={54} cy={52} r={3.4} fill="#F5A3A3" opacity={0.6} />
      {/* Confident smile */}
      <Path
        d="M 31 56 Q 40 64 49 56"
        stroke={EYE}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Gold sparkle — top right */}
      <Path
        d="M 64 14 L 65.4 18.6 L 70 20 L 65.4 21.4 L 64 26 L 62.6 21.4 L 58 20 L 62.6 18.6 Z"
        fill="url(#rare-spark)"
      />
      {/* Tiny secondary sparkle */}
      <Ellipse cx={70} cy={34} rx={1.4} ry={1.4} fill="#F6C06A" opacity={0.85} />
    </Svg>
  </View>
);

// ─── Lookup ─────────────────────────────────────────────────────────────

import type { PrepGap } from "@/stores/types";

export const PREP_GAP_MASCOTS: Record<PrepGap, React.FC<MascotProps>> = {
  often: OftenMascot,
  sometimes: SometimesMascot,
  occasional: OccasionalMascot,
  rare: RareMascot,
};
