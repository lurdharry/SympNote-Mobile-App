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
 * Mascots for the age qualifier screen. Deliberately abstract: each
 * mascot expresses the *concept* of the existing Lucide icon (sprout,
 * bolt, flame, pulse, sparkle) given a small face — not the age
 * itself. This avoids personifying any band stereotypically (no
 * "smiling teen face" or "elder with glasses") while still giving
 * each option a distinct, on-brand visual anchor.
 *
 * Same paper-clinical family as AllergyMascots.
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

// ─── Teen (12-17) — sprouting bud, fresh growth ──────────────────────────

export const TeenMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="teen-leaf" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9BD2A6" />
          <Stop offset="1" stopColor="#5A8F6E" />
        </SvgLinearGradient>
        <SvgLinearGradient id="teen-seed" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Left leaf */}
      <Path
        d="M 40 40 Q 22 32 14 18 Q 26 22 38 32 Z"
        fill="url(#teen-leaf)"
        stroke="#3D6A4D"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* Right leaf */}
      <Path
        d="M 40 40 Q 58 32 66 18 Q 54 22 42 32 Z"
        fill="url(#teen-leaf)"
        stroke="#3D6A4D"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* Stem */}
      <Path d="M 40 40 V 64" stroke="#5A8F6E" strokeWidth={2.4} strokeLinecap="round" />
      {/* Seed/base — round little body with face */}
      <Ellipse cx={40} cy={64} rx={14} ry={10} fill="url(#teen-seed)" stroke={STROKE} strokeWidth={2.2} />
      <Circle cx={36} cy={63} r={1.6} fill={EYE} />
      <Circle cx={44} cy={63} r={1.6} fill={EYE} />
      <Path
        d="M 36 67 Q 40 69 44 67"
        stroke={EYE}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── Young adult (18-29) — energetic bolt, alert spark ───────────────────

export const YoungAdultMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="ya-bolt" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      {/* Bolt silhouette */}
      <Path
        d="M 46 8 L 22 42 L 38 42 L 30 72 L 56 36 L 40 36 L 50 8 Z"
        fill="url(#ya-bolt)"
        stroke="#A86F2A"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Face on the upper section */}
      <Circle cx={36} cy={28} r={1.6} fill={EYE} />
      <Circle cx={42} cy={32} r={1.6} fill={EYE} />
      <Path
        d="M 36 38 Q 40 40 44 38"
        stroke={EYE}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheek blush */}
      <Circle cx={31} cy={34} r={1.8} fill="#F5A3A3" opacity={0.55} />
      {/* Tiny accent sparks */}
      <Circle cx={62} cy={20} r={1.6} fill="#F6C06A" opacity={0.85} />
      <Circle cx={66} cy={28} r={1.2} fill="#F6C06A" opacity={0.7} />
    </Svg>
  </View>
);

// ─── Mid adult (30-49) — warm flame, steady momentum ─────────────────────

export const MidAdultMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="mid-flame" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F08C70" />
          <Stop offset="1" stopColor="#C45C3F" />
        </SvgLinearGradient>
        <SvgLinearGradient id="mid-inner" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE9C2" />
          <Stop offset="1" stopColor="#F6C06A" />
        </SvgLinearGradient>
      </Defs>
      {/* Outer flame */}
      <Path
        d="M 40 8 C 50 18 60 28 60 44 C 60 60 50 72 40 72 C 30 72 20 60 20 44 C 20 32 28 22 34 16 C 34 26 38 30 40 30 C 40 22 38 14 40 8 Z"
        fill="url(#mid-flame)"
        stroke="#8A3F2A"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Inner flame highlight */}
      <Path
        d="M 40 30 C 46 36 50 44 48 54 C 46 62 40 66 40 66 C 36 64 32 58 32 50 C 32 42 36 36 40 30 Z"
        fill="url(#mid-inner)"
        opacity={0.95}
      />
      {/* Eyes on the inner flame */}
      <Circle cx={36} cy={48} r={1.8} fill={EYE} />
      <Circle cx={44} cy={48} r={1.8} fill={EYE} />
      <Path
        d="M 36 56 Q 40 58 44 56"
        stroke={EYE}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── Mature adult (50-64) — pulse waveform, steady rhythm ────────────────

export const MatureAdultMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="mature-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Outer pebble body */}
      <Ellipse cx={40} cy={44} rx={28} ry={22} fill="url(#mature-body)" stroke={STROKE} strokeWidth={2.4} />
      {/* Pulse waveform inside — coral, signature for this mascot */}
      <Path
        d="M 16 44 H 24 L 28 36 L 32 52 L 36 30 L 40 56 L 44 42 H 64"
        stroke="#E07A5F"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Eyes on the pebble — sit above the waveform */}
      <Circle cx={32} cy={26} r={1.8} fill={EYE} />
      <Circle cx={48} cy={26} r={1.8} fill={EYE} />
      {/* Soft smile under the wave */}
      <Path
        d="M 34 60 Q 40 64 46 60"
        stroke={EYE}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── Senior (65+) — calm star, settled radiance ──────────────────────────

export const SeniorMascot: React.FC<MascotProps> = ({ size = moderateScale(40) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="senior-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE9C2" />
        </SvgLinearGradient>
        <SvgLinearGradient id="senior-spark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      {/* Four-pointed star with a face — calm shape, gentle radiance */}
      <Path
        d="M 40 12 L 46 32 L 66 38 L 46 44 L 40 64 L 34 44 L 14 38 L 34 32 Z"
        fill="url(#senior-body)"
        stroke="#A86F2A"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Eyes — gentle */}
      <Circle cx={36} cy={36} r={1.8} fill={EYE} />
      <Circle cx={44} cy={36} r={1.8} fill={EYE} />
      <Circle cx={36.6} cy={35.2} r={0.7} fill="#FFFFFF" opacity={0.9} />
      <Circle cx={44.6} cy={35.2} r={0.7} fill="#FFFFFF" opacity={0.9} />
      {/* Soft smile */}
      <Path
        d="M 36 42 Q 40 45 44 42"
        stroke={EYE}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      {/* Gold radiance sparkles around the star */}
      <Circle cx={68} cy={20} r={1.8} fill="url(#senior-spark)" />
      <Circle cx={14} cy={62} r={1.6} fill="url(#senior-spark)" opacity={0.85} />
      <Circle cx={66} cy={66} r={1.4} fill="url(#senior-spark)" opacity={0.7} />
    </Svg>
  </View>
);

// ─── Lookup ─────────────────────────────────────────────────────────────

import type { AgeBand } from "@/stores/types";

export const AGE_MASCOTS: Record<AgeBand, React.FC<MascotProps>> = {
  teen: TeenMascot,
  "18-29": YoungAdultMascot,
  "30-49": MidAdultMascot,
  "50-64": MatureAdultMascot,
  "65-plus": SeniorMascot,
};
