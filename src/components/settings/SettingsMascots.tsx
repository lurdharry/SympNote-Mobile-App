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

/**
 * Settings-row mini-mascots. Same paper-clinical family as
 * PocketbookMascot / AllergyMascots — cream + teal + gold palette,
 * round eye dots, soft asymmetric shapes — but scoped to the 36pt
 * row slot. No animations: list rows shouldn't compete for attention.
 *
 * Each mascot fills its 36pt square with a single character whose
 * silhouette telegraphs the row's purpose at a glance:
 *
 *  Profile group:
 *    AgeMascot          — calendar page
 *    CareTeamMascot     — doctor's bag
 *
 *  Privacy & data group:
 *    PrivacyMascot      — closed shield (on-device transcription)
 *    PrivacyPolicyMascot — folded paper
 *    TermsMascot        — scroll with seal
 *    ExportMascot       — parcel with arrow
 *    DisclaimerMascot   — first-aid cross
 *    ClearMascot        — broom (coral palette, destructive)
 *
 *  Subscription group:
 *    PlusMascot         — gold star badge
 *    RestoreMascot      — refresh swirl
 *
 *  Help group:
 *    HelpMascot         — lifebuoy ring
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

const DEFAULT = moderateScale(36);

// ─── 1. AgeMascot ─────────────────────────────────────────────────────
// Calendar page with a date marked + face.

export const AgeMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="age-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Calendar body */}
      <Rect
        x={14}
        y={20}
        width={52}
        height={48}
        rx={6}
        fill="url(#age-body)"
        stroke="#1F504E"
        strokeWidth={2.4}
      />
      {/* Top binder strip — teal */}
      <Rect x={14} y={20} width={52} height={12} rx={6} fill="#2C6E6B" />
      {/* Two binder rings */}
      <Rect x={24} y={14} width={4} height={12} rx={2} fill="#1F504E" />
      <Rect x={52} y={14} width={4} height={12} rx={2} fill="#1F504E" />
      {/* Eyes on the page */}
      <Circle cx={32} cy={46} r={2.6} fill="#1F504E" />
      <Circle cx={48} cy={46} r={2.6} fill="#1F504E" />
      {/* Quiet smile */}
      <Path
        d="M 33 56 Q 40 60 47 56"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── 2. CareTeamMascot ────────────────────────────────────────────────
// Doctor's bag with handle + small medical cross.

export const CareTeamMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="bag-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3BA79F" />
          <Stop offset="1" stopColor="#2C6E6B" />
        </SvgLinearGradient>
      </Defs>
      {/* Handle */}
      <Path
        d="M 30 24 C 30 18 34 14 40 14 C 46 14 50 18 50 24"
        stroke="#1F504E"
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Bag body */}
      <Path
        d="M 16 28 H 64 Q 68 28 68 32 V 60 Q 68 68 60 68 H 20 Q 12 68 12 60 V 32 Q 12 28 16 28 Z"
        fill="url(#bag-body)"
        stroke="#1F504E"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* White medical cross plate */}
      <Rect x={32} y={40} width={16} height={16} rx={2} fill="#FFFFFF" />
      <Rect x={37.5} y={42} width={3} height={12} fill="#E07A5F" />
      <Rect x={34} y={45.5} width={12} height={3} fill="#E07A5F" />
      {/* Tiny eye dots above the cross */}
      <Circle cx={22} cy={40} r={2} fill="#FFFFFF" />
      <Circle cx={58} cy={40} r={2} fill="#FFFFFF" />
    </Svg>
  </View>
);

// ─── 3. PrivacyMascot ─────────────────────────────────────────────────
// Closed shield — keeps your data here.

export const PrivacyMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="priv-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Shield body */}
      <Path
        d="M 40 8 C 60 8 62 18 62 28 V 48 C 62 64 52 72 40 76 C 28 72 18 64 18 48 V 28 C 18 18 20 8 40 8 Z"
        fill="url(#priv-body)"
        stroke="#1F504E"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Eyes */}
      <Circle cx={32} cy={36} r={2.6} fill="#1F504E" />
      <Circle cx={48} cy={36} r={2.6} fill="#1F504E" />
      {/* Quiet smile */}
      <Path
        d="M 33 50 Q 40 55 47 50"
        stroke="#1F504E"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Small lock pip in the corner */}
      <Circle cx={64} cy={62} r={9} fill="#3BA79F" stroke="#FFFFFF" strokeWidth={2} />
      <Path
        d="M 60 60 V 58 C 60 56 62 54 64 54 C 66 54 68 56 68 58 V 60"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x={59} y={60} width={10} height={7} rx={1.4} fill="#FFFFFF" />
    </Svg>
  </View>
);

// ─── 4. PrivacyPolicyMascot ───────────────────────────────────────────
// Folded paper document with text lines + face.

export const PrivacyPolicyMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="doc-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F5F1EA" />
        </SvgLinearGradient>
      </Defs>
      {/* Paper body with folded corner */}
      <Path
        d="M 18 12 H 54 L 64 22 V 68 Q 64 72 60 72 H 18 Q 14 72 14 68 V 16 Q 14 12 18 12 Z"
        fill="url(#doc-body)"
        stroke="#1F504E"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Folded corner triangle */}
      <Path
        d="M 54 12 V 22 H 64 Z"
        fill="#E5DDC8"
        stroke="#1F504E"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Text lines */}
      <Rect x={22} y={32} width={26} height={2} rx={1} fill="#C9BFA5" />
      <Rect x={22} y={38} width={32} height={2} rx={1} fill="#C9BFA5" />
      {/* Eyes */}
      <Circle cx={28} cy={52} r={2.4} fill="#1F504E" />
      <Circle cx={42} cy={52} r={2.4} fill="#1F504E" />
      {/* Smile */}
      <Path
        d="M 28 60 Q 35 64 42 60"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── 5. TermsMascot ───────────────────────────────────────────────────
// Scroll with wax seal.

export const TermsMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="scroll-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Top scroll roll */}
      <Ellipse cx={40} cy={18} rx={22} ry={5} fill="#C9BFA5" stroke="#1F504E" strokeWidth={2} />
      {/* Scroll body */}
      <Rect x={18} y={18} width={44} height={44} fill="url(#scroll-body)" stroke="#1F504E" strokeWidth={2.4} />
      {/* Bottom scroll roll */}
      <Ellipse cx={40} cy={62} rx={22} ry={5} fill="#C9BFA5" stroke="#1F504E" strokeWidth={2} />
      {/* Text lines */}
      <Rect x={26} y={28} width={20} height={1.6} rx={0.8} fill="#C9BFA5" />
      <Rect x={26} y={33} width={26} height={1.6} rx={0.8} fill="#C9BFA5" />
      {/* Eyes */}
      <Circle cx={32} cy={44} r={2.2} fill="#1F504E" />
      <Circle cx={42} cy={44} r={2.2} fill="#1F504E" />
      {/* Wax seal */}
      <Circle cx={56} cy={54} r={8} fill="#E07A5F" stroke="#C45C3F" strokeWidth={1.6} />
      <Path
        d="M 53 51 L 59 57 M 59 51 L 53 57"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── 6. ExportMascot ──────────────────────────────────────────────────
// Parcel with upward arrow.

export const ExportMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="parcel-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      {/* Box body */}
      <Path
        d="M 16 32 H 64 V 68 Q 64 72 60 72 H 20 Q 16 72 16 68 Z"
        fill="url(#parcel-body)"
        stroke="#1F504E"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Top lid open */}
      <Path
        d="M 12 32 H 68 L 60 22 H 20 Z"
        fill="#FFFFFF"
        stroke="#1F504E"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Tape strip vertical */}
      <Rect x={36} y={32} width={8} height={40} fill="#C9BFA5" opacity={0.7} />
      {/* Eyes */}
      <Circle cx={28} cy={52} r={2.4} fill="#1F504E" />
      <Circle cx={52} cy={52} r={2.4} fill="#1F504E" />
      {/* Up-arrow above the lid */}
      <Path
        d="M 40 16 L 40 4 M 34 10 L 40 4 L 46 10"
        stroke="#3BA79F"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  </View>
);

// ─── 7. DisclaimerMascot ──────────────────────────────────────────────
// First-aid kit / bandage cross with face.

export const DisclaimerMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="aid-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F5F1EA" />
        </SvgLinearGradient>
      </Defs>
      {/* Kit body */}
      <Rect
        x={12}
        y={22}
        width={56}
        height={46}
        rx={6}
        fill="url(#aid-body)"
        stroke="#1F504E"
        strokeWidth={2.4}
      />
      {/* Handle */}
      <Path
        d="M 30 22 V 16 Q 30 12 34 12 H 46 Q 50 12 50 16 V 22"
        stroke="#1F504E"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* Red cross center */}
      <Rect x={37.5} y={32} width={5} height={26} fill="#E07A5F" />
      <Rect x={27} y={42} width={26} height={5} fill="#E07A5F" />
      {/* Eye dots flanking the cross */}
      <Circle cx={20} cy={44} r={2.2} fill="#1F504E" />
      <Circle cx={60} cy={44} r={2.2} fill="#1F504E" />
    </Svg>
  </View>
);

// ─── 8. ClearMascot ───────────────────────────────────────────────────
// Broom + dustpan in coral palette (signals destructive).

export const ClearMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="dust-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F08C70" />
          <Stop offset="1" stopColor="#C45C3F" />
        </SvgLinearGradient>
      </Defs>
      {/* Broom handle */}
      <Path
        d="M 18 18 L 50 50"
        stroke="#5A4A3A"
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      {/* Broom bristles — flared */}
      <Path
        d="M 44 44 L 60 46 L 62 60 L 50 62 L 36 56 Z"
        fill="#F6C06A"
        stroke="#D9964A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Bristle lines */}
      <Path
        d="M 48 50 L 51 60 M 52 50 L 54 60 M 56 50 L 57 58"
        stroke="#D9964A"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      {/* Dustpan body */}
      <Path
        d="M 14 60 H 36 L 32 72 H 18 Z"
        fill="url(#dust-body)"
        stroke="#9D3F26"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Eyes on the dustpan */}
      <Circle cx={20} cy={66} r={1.8} fill="#FFFFFF" />
      <Circle cx={28} cy={66} r={1.8} fill="#FFFFFF" />
    </Svg>
  </View>
);

// ─── 9. PlusMascot ────────────────────────────────────────────────────
// Gold sparkle/star badge with face — the premium tier.

export const PlusMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="plus-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      {/* 4-point sparkle body — fat diamond with concave sides */}
      <Path
        d="M 40 8 Q 44 36 72 40 Q 44 44 40 72 Q 36 44 8 40 Q 36 36 40 8 Z"
        fill="url(#plus-body)"
        stroke="#9D6A2C"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Eyes — centered, slightly bright */}
      <Circle cx={34} cy={38} r={2.6} fill="#1F504E" />
      <Circle cx={46} cy={38} r={2.6} fill="#1F504E" />
      {/* Bright smile */}
      <Path
        d="M 33 48 Q 40 53 47 48"
        stroke="#1F504E"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Small accent sparkle in the corner */}
      <Path
        d="M 64 16 L 66 21 L 71 23 L 66 25 L 64 30 L 62 25 L 57 23 L 62 21 Z"
        fill="#FFFFFF"
        opacity={0.85}
      />
    </Svg>
  </View>
);

// ─── 10. RestoreMascot ────────────────────────────────────────────────
// Circular refresh swirl with face in the middle.

export const RestoreMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="restore-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Inner body — round face */}
      <Circle cx={40} cy={40} r={20} fill="url(#restore-body)" stroke="#1F504E" strokeWidth={2.4} />
      {/* Refresh arrow — partial ring with arrowhead */}
      <Path
        d="M 40 12 A 28 28 0 1 1 14 50"
        stroke="#3BA79F"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead at top-right */}
      <Path
        d="M 32 12 L 40 12 L 40 20"
        stroke="#3BA79F"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Eyes */}
      <Circle cx={34} cy={38} r={2.4} fill="#1F504E" />
      <Circle cx={46} cy={38} r={2.4} fill="#1F504E" />
      {/* Smile */}
      <Path
        d="M 33 47 Q 40 51 47 47"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── 11. HelpMascot ───────────────────────────────────────────────────
// Lifebuoy ring with face peeking through center.

export const HelpMascot: React.FC<MascotProps> = ({ size = DEFAULT }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="buoy-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Outer ring */}
      <Circle cx={40} cy={40} r={30} fill="#E07A5F" stroke="#C45C3F" strokeWidth={2.4} />
      {/* Cream stripe segments — 4 around the ring */}
      <Path d="M 40 10 A 30 30 0 0 1 56 14 L 50 26 A 16 16 0 0 0 40 24 Z" fill="#FFFFFF" />
      <Path d="M 70 40 A 30 30 0 0 1 66 56 L 54 50 A 16 16 0 0 0 56 40 Z" fill="#FFFFFF" />
      <Path d="M 40 70 A 30 30 0 0 1 24 66 L 30 54 A 16 16 0 0 0 40 56 Z" fill="#FFFFFF" />
      <Path d="M 10 40 A 30 30 0 0 1 14 24 L 26 30 A 16 16 0 0 0 24 40 Z" fill="#FFFFFF" />
      {/* Inner hole / face area */}
      <Circle cx={40} cy={40} r={14} fill="url(#buoy-body)" stroke="#1F504E" strokeWidth={2} />
      {/* Eyes */}
      <Circle cx={36} cy={38} r={2} fill="#1F504E" />
      <Circle cx={44} cy={38} r={2} fill="#1F504E" />
      {/* Smile */}
      <Path
        d="M 35 44 Q 40 47 45 44"
        stroke="#1F504E"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);
