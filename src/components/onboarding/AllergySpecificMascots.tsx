import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";

/**
 * Sub-allergy mini-mascots — siblings of the parent AllergyMascots
 * family but lighter: simpler bodies, eyes-only faces, optional gold
 * accent. Designed to cohabit a 2-column grid at ~44pt each on the
 * dynamic `/onboarding/allergy-details` screen.
 *
 * Naming follows the option `v` keys in ALLERGY_SPECIFICS (kebab-case
 * → PascalCase + "Mascot"). `getAllergySpecificMascot(v)` resolves a
 * value at render time; `CustomMascot` is the fallback for user-typed
 * "Add your own" entries.
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

/* ========================================================================
 * DRUG sub-options
 * ====================================================================== */

// ─── Penicillin — half-blue capsule ──────────────────────────────────────
export const PenicillinMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="pen-blue" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7AB6E0" />
          <Stop offset="1" stopColor="#3F7DB0" />
        </SvgLinearGradient>
        <SvgLinearGradient id="pen-cream" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      <G transform="rotate(-12 40 40)">
        <Path d="M 14 40 C 14 30 20 24 30 24 H 40 V 56 H 30 C 20 56 14 50 14 40 Z" fill="url(#pen-blue)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d="M 40 24 H 50 C 60 24 66 30 66 40 C 66 50 60 56 50 56 H 40 Z" fill="url(#pen-cream)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
        <Ellipse cx={22} cy={32} rx={4} ry={1.2} fill="#FFFFFF" opacity={0.6} />
        <Circle cx={48} cy={38} r={2} fill={EYE} />
        <Circle cx={56} cy={38} r={2} fill={EYE} />
      </G>
    </Svg>
  </View>
);

// ─── NSAIDs — small bottle with pills ────────────────────────────────────
export const NsaidsMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="bot-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      <Rect x={26} y={14} width={28} height={8} rx={2} fill="#3BA79F" stroke={STROKE} strokeWidth={2} />
      <Path d="M 22 22 H 58 V 66 C 58 70 54 72 50 72 H 30 C 26 72 22 70 22 66 Z" fill="url(#bot-body)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
      <Rect x={26} y={36} width={28} height={14} rx={3} fill="#F6C06A" opacity={0.85} />
      <Circle cx={32} cy={43} r={2} fill={EYE} />
      <Circle cx={48} cy={43} r={2} fill={EYE} />
      <Path d="M 36 58 Q 40 60 44 58" stroke={EYE} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Sulfa — square tablet with "S" ──────────────────────────────────────
export const SulfaMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="sul-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE9C2" />
        </SvgLinearGradient>
      </Defs>
      <Rect x={14} y={18} width={52} height={44} rx={10} fill="url(#sul-body)" stroke={STROKE} strokeWidth={2.4} />
      <Path d="M 34 30 Q 28 30 28 35 Q 28 40 34 40 Q 42 40 42 45 Q 42 50 34 50" stroke="#D9964A" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Circle cx={50} cy={34} r={1.8} fill={EYE} />
      <Circle cx={56} cy={34} r={1.8} fill={EYE} />
    </Svg>
  </View>
);

// ─── Aspirin — round tablet with score line ──────────────────────────────
export const AspirinMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="asp-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={40} cy={42} r={28} fill="url(#asp-body)" stroke={STROKE} strokeWidth={2.4} />
      <Path d="M 16 42 H 64" stroke={STROKE} strokeWidth={1.8} strokeDasharray="2 3" />
      <Circle cx={32} cy={34} r={2.2} fill={EYE} />
      <Circle cx={48} cy={34} r={2.2} fill={EYE} />
      <Path d="M 34 52 Q 40 56 46 52" stroke={EYE} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Ellipse cx={28} cy={26} rx={6} ry={2} fill="#FFFFFF" opacity={0.55} />
    </Svg>
  </View>
);

// ─── Opioids — pill with poppy bloom ─────────────────────────────────────
export const OpioidsMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="opi-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
        <SvgLinearGradient id="opi-poppy" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F08C70" />
          <Stop offset="1" stopColor="#C45C3F" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 18 18 Q 24 6 36 14 Q 50 4 56 16 Q 66 14 60 28 Q 70 36 56 40 Q 56 30 40 28 Q 24 30 22 38 Q 12 30 18 18 Z" fill="url(#opi-poppy)" stroke="#8A3F2A" strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={40} cy={26} r={4} fill="#1F504E" />
      <Circle cx={40} cy={56} r={16} fill="url(#opi-body)" stroke={STROKE} strokeWidth={2.4} />
      <Circle cx={34} cy={54} r={1.6} fill={EYE} />
      <Circle cx={46} cy={54} r={1.6} fill={EYE} />
      <Path d="M 36 60 Q 40 62 44 60" stroke={EYE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Anesthetics — friendly syringe ─────────────────────────────────────
export const AnestheticsMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="syr-body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      <G transform="rotate(-30 40 40)">
        <Rect x={10} y={32} width={48} height={16} rx={3} fill="url(#syr-body)" stroke={STROKE} strokeWidth={2.2} />
        <Rect x={6} y={28} width={6} height={24} rx={2} fill="#3BA79F" stroke={STROKE} strokeWidth={2} />
        <Rect x={22} y={36} width={3} height={8} fill={STROKE} opacity={0.4} />
        <Rect x={32} y={36} width={3} height={8} fill={STROKE} opacity={0.4} />
        <Rect x={42} y={36} width={3} height={8} fill={STROKE} opacity={0.4} />
        <Path d="M 58 38 H 70 L 74 40 L 70 42 H 58 Z" fill="#A8C4C2" stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={36} cy={39} r={1.6} fill={EYE} />
        <Circle cx={44} cy={39} r={1.6} fill={EYE} />
      </G>
      <Circle cx={66} cy={20} r={2} fill="#7DB6E0" opacity={0.8} />
      <Circle cx={70} cy={26} r={1.4} fill="#7DB6E0" opacity={0.6} />
    </Svg>
  </View>
);

// ─── Contrast — vial of liquid ───────────────────────────────────────────
export const ContrastMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="vial-fluid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9BD2A6" />
          <Stop offset="1" stopColor="#5A8F6E" />
        </SvgLinearGradient>
      </Defs>
      <Rect x={28} y={10} width={24} height={6} rx={1.5} fill="#3BA79F" stroke={STROKE} strokeWidth={1.8} />
      <Path d="M 26 16 H 54 V 64 C 54 70 50 72 46 72 H 34 C 30 72 26 70 26 64 Z" fill="#FFFFFF" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 28 38 Q 34 36 40 38 Q 46 40 52 38 V 64 C 52 68 49 70 46 70 H 34 C 31 70 28 68 28 64 Z" fill="url(#vial-fluid)" />
      <Circle cx={36} cy={50} r={1.8} fill={EYE} />
      <Circle cx={44} cy={50} r={1.8} fill={EYE} />
      <Path d="M 36 58 Q 40 60 44 58" stroke={EYE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d="M 32 28 L 33 30 L 35 31 L 33 32 L 32 34 L 31 32 L 29 31 L 31 30 Z" fill="#F6C06A" />
    </Svg>
  </View>
);

/* ========================================================================
 * FOOD sub-options
 * ====================================================================== */

// ─── Peanut — figure-8 shell ─────────────────────────────────────────────
export const PeanutMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="pea-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E8C99A" />
          <Stop offset="1" stopColor="#C99B5C" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 40 12 C 56 12 60 22 56 32 C 52 40 56 44 56 52 C 56 66 48 72 40 72 C 32 72 24 66 24 52 C 24 44 28 40 24 32 C 20 22 24 12 40 12 Z" fill="url(#pea-body)" stroke="#7A5A2A" strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 26 40 Q 40 44 54 40" stroke="#7A5A2A" strokeWidth={1.6} fill="none" />
      <Circle cx={34} cy={28} r={1.6} fill="#7A5A2A" opacity={0.5} />
      <Circle cx={46} cy={26} r={1.4} fill="#7A5A2A" opacity={0.5} />
      <Circle cx={32} cy={56} r={2} fill={EYE} />
      <Circle cx={48} cy={56} r={2} fill={EYE} />
      <Path d="M 36 62 Q 40 64 44 62" stroke={EYE} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Tree nuts — almond teardrop ─────────────────────────────────────────
export const TreeNutsMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="alm-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F0D5A6" />
          <Stop offset="1" stopColor="#C99B5C" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 40 8 C 60 18 64 38 60 56 C 56 70 48 74 40 74 C 32 74 24 70 20 56 C 16 38 20 18 40 8 Z" fill="url(#alm-body)" stroke="#7A5A2A" strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 40 12 C 40 30 40 50 40 70" stroke="#7A5A2A" strokeWidth={1.4} opacity={0.6} />
      <Circle cx={33} cy={42} r={2} fill={EYE} />
      <Circle cx={47} cy={42} r={2} fill={EYE} />
      <Path d="M 35 50 Q 40 53 45 50" stroke={EYE} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Ellipse cx={32} cy={26} rx={5} ry={2} fill="#FFFFFF" opacity={0.4} />
    </Svg>
  </View>
);

// ─── Shellfish — shrimp curl ────────────────────────────────────────────
export const ShellfishMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="shr-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB199" />
          <Stop offset="1" stopColor="#E07A5F" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 60 22 C 70 30 70 48 56 56 C 44 64 28 60 22 50 C 18 42 22 32 32 30 C 36 38 50 42 56 36 C 50 30 42 32 38 28 C 42 22 52 18 60 22 Z" fill="url(#shr-body)" stroke="#8A3F2A" strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 32 36 L 30 32 M 38 38 L 36 32 M 44 38 L 44 32 M 50 36 L 52 32" stroke="#8A3F2A" strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={56} cy={28} r={2} fill={EYE} />
      <Path d="M 60 18 L 64 12" stroke="#8A3F2A" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M 64 22 L 70 18" stroke="#8A3F2A" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M 14 56 L 8 60 M 16 50 L 10 50" stroke="#8A3F2A" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Dairy — milk carton ────────────────────────────────────────────────
export const DairyMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="milk-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E8E8E8" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 22 26 L 30 18 L 50 18 L 58 26 V 70 H 22 Z" fill="url(#milk-body)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 22 26 H 58" stroke={STROKE} strokeWidth={1.6} />
      <Path d="M 30 18 L 50 18 L 50 14 L 30 14 Z" fill="#3BA79F" stroke={STROKE} strokeWidth={1.8} strokeLinejoin="round" />
      <Rect x={28} y={36} width={24} height={14} rx={2} fill="#F6C06A" opacity={0.85} />
      <Circle cx={32} cy={56} r={2} fill={EYE} />
      <Circle cx={48} cy={56} r={2} fill={EYE} />
      <Path d="M 36 64 Q 40 66 44 64" stroke={EYE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Eggs — egg with face ───────────────────────────────────────────────
export const EggsMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="egg-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE9C2" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 40 10 C 56 10 64 30 64 48 C 64 64 54 74 40 74 C 26 74 16 64 16 48 C 16 30 24 10 40 10 Z" fill="url(#egg-body)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
      <Circle cx={32} cy={42} r={2.4} fill={EYE} />
      <Circle cx={48} cy={42} r={2.4} fill={EYE} />
      <Circle cx={28} cy={50} r={3} fill="#F5A3A3" opacity={0.5} />
      <Circle cx={52} cy={50} r={3} fill="#F5A3A3" opacity={0.5} />
      <Path d="M 34 56 Q 40 60 46 56" stroke={EYE} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Ellipse cx={30} cy={26} rx={6} ry={3} fill="#FFFFFF" opacity={0.5} />
    </Svg>
  </View>
);

// ─── Gluten — wheat stalk ───────────────────────────────────────────────
export const GlutenMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="wheat-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 40 70 V 24" stroke="#8A6A4A" strokeWidth={2.4} strokeLinecap="round" />
      <Ellipse cx={40} cy={20} rx={5} ry={9} fill="url(#wheat-body)" stroke="#8A6A4A" strokeWidth={1.8} />
      <Ellipse cx={28} cy={32} rx={5} ry={9} fill="url(#wheat-body)" stroke="#8A6A4A" strokeWidth={1.8} transform="rotate(-30 28 32)" />
      <Ellipse cx={52} cy={32} rx={5} ry={9} fill="url(#wheat-body)" stroke="#8A6A4A" strokeWidth={1.8} transform="rotate(30 52 32)" />
      <Ellipse cx={24} cy={48} rx={5} ry={9} fill="url(#wheat-body)" stroke="#8A6A4A" strokeWidth={1.8} transform="rotate(-30 24 48)" />
      <Ellipse cx={56} cy={48} rx={5} ry={9} fill="url(#wheat-body)" stroke="#8A6A4A" strokeWidth={1.8} transform="rotate(30 56 48)" />
      <Circle cx={36} cy={20} r={1.4} fill={EYE} />
      <Circle cx={44} cy={20} r={1.4} fill={EYE} />
    </Svg>
  </View>
);

// ─── Soy — soybean pod ──────────────────────────────────────────────────
export const SoyMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="soy-pod" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9BD2A6" />
          <Stop offset="1" stopColor="#5A8F6E" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 14 30 Q 26 14 50 18 Q 70 22 66 40 Q 62 58 40 58 Q 18 56 14 30 Z" fill="url(#soy-pod)" stroke="#3D6A4D" strokeWidth={2.4} strokeLinejoin="round" />
      <Circle cx={28} cy={34} r={6} fill="#E8F4D4" stroke="#3D6A4D" strokeWidth={1.6} />
      <Circle cx={42} cy={38} r={6} fill="#E8F4D4" stroke="#3D6A4D" strokeWidth={1.6} />
      <Circle cx={56} cy={36} r={6} fill="#E8F4D4" stroke="#3D6A4D" strokeWidth={1.6} />
      <Circle cx={26} cy={32} r={1.2} fill={EYE} />
      <Circle cx={30} cy={32} r={1.2} fill={EYE} />
      <Circle cx={40} cy={36} r={1.2} fill={EYE} />
      <Circle cx={44} cy={36} r={1.2} fill={EYE} />
      <Circle cx={54} cy={34} r={1.2} fill={EYE} />
      <Circle cx={58} cy={34} r={1.2} fill={EYE} />
      <Path d="M 16 28 Q 12 18 18 14" stroke="#3D6A4D" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Fish — simple fish silhouette ──────────────────────────────────────
export const FishMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="fish-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A8D8E0" />
          <Stop offset="1" stopColor="#3F7DB0" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 14 40 Q 26 16 54 20 Q 66 24 66 40 Q 66 56 54 60 Q 26 64 14 40 Z" fill="url(#fish-body)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 60 28 L 74 18 L 70 40 L 74 62 L 60 52 Z" fill="url(#fish-body)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
      <Circle cx={26} cy={36} r={3.4} fill="#FFFFFF" stroke={STROKE} strokeWidth={1.4} />
      <Circle cx={26} cy={36} r={1.6} fill={EYE} />
      <Path d="M 38 42 Q 44 46 38 50" stroke={STROKE} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M 46 38 Q 50 42 46 46" stroke={STROKE} strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.6} />
    </Svg>
  </View>
);

// ─── Sesame — seed cluster ──────────────────────────────────────────────
export const SesameMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="ses-seed" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F0D5A6" />
          <Stop offset="1" stopColor="#C99B5C" />
        </SvgLinearGradient>
      </Defs>
      <Ellipse cx={26} cy={38} rx={7} ry={11} fill="url(#ses-seed)" stroke="#7A5A2A" strokeWidth={1.8} transform="rotate(-20 26 38)" />
      <Ellipse cx={42} cy={26} rx={7} ry={11} fill="url(#ses-seed)" stroke="#7A5A2A" strokeWidth={1.8} transform="rotate(15 42 26)" />
      <Ellipse cx={56} cy={42} rx={7} ry={11} fill="url(#ses-seed)" stroke="#7A5A2A" strokeWidth={1.8} transform="rotate(30 56 42)" />
      <Ellipse cx={36} cy={54} rx={7} ry={11} fill="url(#ses-seed)" stroke="#7A5A2A" strokeWidth={1.8} transform="rotate(-10 36 54)" />
      <Circle cx={26} cy={38} r={1.4} fill={EYE} />
      <Circle cx={42} cy={26} r={1.4} fill={EYE} />
      <Circle cx={56} cy={42} r={1.4} fill={EYE} />
      <Circle cx={36} cy={54} r={1.4} fill={EYE} />
    </Svg>
  </View>
);

/* ========================================================================
 * ENVIRONMENTAL sub-options
 * ====================================================================== */

// ─── Pollen specks — drifting dot cluster ───────────────────────────────
export const PollenSpecksMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="psp-disc" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={38} cy={44} r={18} fill="url(#psp-disc)" stroke="#A86F2A" strokeWidth={2.4} />
      <Circle cx={34} cy={42} r={2} fill={EYE} />
      <Circle cx={42} cy={42} r={2} fill={EYE} />
      <Path d="M 34 50 Q 38 53 42 50" stroke={EYE} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Circle cx={62} cy={20} r={3} fill="#F6C06A" opacity={0.9} />
      <Circle cx={70} cy={28} r={2} fill="#F6C06A" opacity={0.7} />
      <Circle cx={66} cy={14} r={1.6} fill="#F6C06A" opacity={0.5} />
      <Circle cx={18} cy={20} r={2.2} fill="#F6C06A" opacity={0.8} />
      <Circle cx={12} cy={28} r={1.4} fill="#F6C06A" opacity={0.6} />
      <Circle cx={64} cy={64} r={1.8} fill="#F6C06A" opacity={0.6} />
    </Svg>
  </View>
);

// ─── Dust mites — tiny round bug ────────────────────────────────────────
export const DustMitesMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="mite-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9BFA5" />
          <Stop offset="1" stopColor="#8A7A5C" />
        </SvgLinearGradient>
      </Defs>
      <Ellipse cx={40} cy={44} rx={22} ry={18} fill="url(#mite-body)" stroke="#5A4A3A" strokeWidth={2.4} />
      <Path d="M 18 38 L 8 30 M 18 44 L 6 44 M 18 50 L 8 58 M 62 38 L 72 30 M 62 44 L 74 44 M 62 50 L 72 58" stroke="#5A4A3A" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={32} cy={40} r={2.6} fill="#FFFFFF" stroke="#5A4A3A" strokeWidth={1.2} />
      <Circle cx={48} cy={40} r={2.6} fill="#FFFFFF" stroke="#5A4A3A" strokeWidth={1.2} />
      <Circle cx={32} cy={40} r={1.2} fill={EYE} />
      <Circle cx={48} cy={40} r={1.2} fill={EYE} />
      <Path d="M 36 50 Q 40 52 44 50" stroke="#5A4A3A" strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Pet dander — paw print ─────────────────────────────────────────────
export const PetDanderMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="paw-pad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F08C70" />
          <Stop offset="1" stopColor="#C45C3F" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 22 50 C 22 38 30 32 40 32 C 50 32 58 38 58 50 C 58 64 50 70 40 70 C 30 70 22 64 22 50 Z" fill="url(#paw-pad)" stroke="#8A3F2A" strokeWidth={2.4} strokeLinejoin="round" />
      <Ellipse cx={20} cy={32} rx={6} ry={8} fill="url(#paw-pad)" stroke="#8A3F2A" strokeWidth={2} />
      <Ellipse cx={32} cy={20} rx={6} ry={8} fill="url(#paw-pad)" stroke="#8A3F2A" strokeWidth={2} />
      <Ellipse cx={48} cy={20} rx={6} ry={8} fill="url(#paw-pad)" stroke="#8A3F2A" strokeWidth={2} />
      <Ellipse cx={60} cy={32} rx={6} ry={8} fill="url(#paw-pad)" stroke="#8A3F2A" strokeWidth={2} />
      <Circle cx={36} cy={48} r={1.8} fill={EYE} />
      <Circle cx={44} cy={48} r={1.8} fill={EYE} />
      <Path d="M 36 56 Q 40 58 44 56" stroke={EYE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Mold — fuzzy spore cluster ─────────────────────────────────────────
export const MoldMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="mold-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A8C4C2" />
          <Stop offset="1" stopColor="#5A8F8C" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 12 50 Q 8 38 18 36 Q 14 22 30 24 Q 32 12 44 18 Q 54 10 60 22 Q 72 24 68 38 Q 76 48 64 54 Q 64 66 50 64 Q 42 72 32 66 Q 20 70 16 60 Q 8 58 12 50 Z" fill="url(#mold-body)" stroke="#3D6A6A" strokeWidth={2.4} strokeLinejoin="round" />
      <Circle cx={28} cy={42} r={2.6} fill="#3D6A6A" opacity={0.6} />
      <Circle cx={50} cy={36} r={2} fill="#3D6A6A" opacity={0.5} />
      <Circle cx={56} cy={50} r={2.4} fill="#3D6A6A" opacity={0.5} />
      <Circle cx={36} cy={54} r={1.8} fill="#3D6A6A" opacity={0.6} />
      <Circle cx={32} cy={44} r={2} fill={EYE} />
      <Circle cx={44} cy={44} r={2} fill={EYE} />
      <Path d="M 34 52 Q 38 54 42 52" stroke={EYE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── Grass — three blades ───────────────────────────────────────────────
export const GrassMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="grs-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9BD2A6" />
          <Stop offset="1" stopColor="#5A8F6E" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 24 70 C 18 56 18 36 26 14 C 30 36 30 56 28 70 Z" fill="url(#grs-body)" stroke="#3D6A4D" strokeWidth={2} strokeLinejoin="round" />
      <Path d="M 40 70 C 36 56 36 30 40 8 C 44 30 44 56 44 70 Z" fill="url(#grs-body)" stroke="#3D6A4D" strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M 56 70 C 50 56 52 38 60 18 C 60 38 60 58 60 70 Z" fill="url(#grs-body)" stroke="#3D6A4D" strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={38} cy={36} r={1.6} fill={EYE} />
      <Circle cx={44} cy={36} r={1.6} fill={EYE} />
      <Path d="M 38 42 Q 41 44 44 42" stroke={EYE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

/* ========================================================================
 * Custom — fallback for user-typed entries
 * ====================================================================== */

// ─── Custom — generic friendly tag ──────────────────────────────────────
export const CustomMascot: React.FC<MascotProps> = ({ size = moderateScale(44) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="cust-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M 14 30 L 14 18 C 14 14 16 12 20 12 L 32 12 L 68 48 L 50 66 L 14 30 Z" fill="url(#cust-body)" stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
      <Circle cx={24} cy={22} r={3} fill="#F6C06A" stroke={STROKE} strokeWidth={1.6} />
      <Circle cx={36} cy={36} r={1.6} fill={EYE} />
      <Circle cx={44} cy={44} r={1.6} fill={EYE} />
      <Path d="M 36 48 Q 40 50 44 46" stroke={EYE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  </View>
);

/* ========================================================================
 * Lookup
 * ====================================================================== */

const REGISTRY: Record<string, React.FC<MascotProps>> = {
  penicillin: PenicillinMascot,
  nsaids: NsaidsMascot,
  sulfa: SulfaMascot,
  aspirin: AspirinMascot,
  opioids: OpioidsMascot,
  anesthetics: AnestheticsMascot,
  contrast: ContrastMascot,
  peanut: PeanutMascot,
  "tree-nuts": TreeNutsMascot,
  shellfish: ShellfishMascot,
  dairy: DairyMascot,
  eggs: EggsMascot,
  gluten: GlutenMascot,
  soy: SoyMascot,
  fish: FishMascot,
  sesame: SesameMascot,
  pollen: PollenSpecksMascot,
  "dust-mites": DustMitesMascot,
  "pet-dander": PetDanderMascot,
  mold: MoldMascot,
  grass: GrassMascot,
};

export const getAllergySpecificMascot = (
  v: string,
): React.FC<MascotProps> => REGISTRY[v] ?? CustomMascot;
