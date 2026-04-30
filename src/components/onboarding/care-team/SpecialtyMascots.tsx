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
 * Specialty mascot family. Each is a small SVG character — the
 * specialty's clinical signal turned into a mini-mascot with eyes,
 * blush and a small accent sparkle. Same paper-clinical palette as
 * the brand mascot family (PocketbookMascot, AllergyMascots): cream
 * + teal trim + coral / gold accents.
 *
 * Drop-in replacement for the gradient-tile + Lucide-icon combo
 * previously used on clinician cards / chip pickers / appointment
 * cards. Renders fully self-contained — no separate gradient tile
 * needed; the mascot fills its own square wrapper.
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

// Shared face primitives kept inline to avoid prop-drill. Eyes /
// cheeks / smile are positioned per-mascot since each anatomy is
// different.

// ─── 1. Primary care — stethoscope head with face ──────────────────────

export const PrimaryCareMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="pc-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3BA79F" />
          <Stop offset="1" stopColor="#2C6E6B" />
        </SvgLinearGradient>
      </Defs>
      {/* Tubing — left earpiece down to the diaphragm and back up */}
      <Path
        d="M 22 14 V 32 C 22 50 32 56 40 56 C 48 56 58 50 58 32 V 14"
        stroke="#1F504E"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {/* Earpieces — small cream pads */}
      <Circle cx={22} cy={14} r={4} fill="#FFFFFF" stroke="#1F504E" strokeWidth={1.6} />
      <Circle cx={58} cy={14} r={4} fill="#FFFFFF" stroke="#1F504E" strokeWidth={1.6} />
      {/* Diaphragm — the face */}
      <Circle cx={40} cy={62} r={14} fill="url(#pc-body)" stroke="#1F504E" strokeWidth={2} />
      {/* Eyes */}
      <Circle cx={36} cy={60} r={2} fill="#FFFFFF" />
      <Circle cx={44} cy={60} r={2} fill="#FFFFFF" />
      {/* Smile */}
      <Path
        d="M 36 66 Q 40 69 44 66"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      {/* Highlight gleam */}
      <Ellipse cx={32} cy={56} rx={3.5} ry={1.6} fill="#FFFFFF" opacity={0.4} />
    </Svg>
  </View>
);

// ─── 2. Cardiology — heart with face + pulse ───────────────────────────

export const CardiologyMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="cardio-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F08C70" />
          <Stop offset="1" stopColor="#C45C3F" />
        </SvgLinearGradient>
      </Defs>
      {/* Heart silhouette */}
      <Path
        d="M 40 70 C 22 58 12 46 12 32 C 12 22 20 16 28 16 C 34 16 38 20 40 24 C 42 20 46 16 52 16 C 60 16 68 22 68 32 C 68 46 58 58 40 70 Z"
        fill="url(#cardio-body)"
        stroke="#8A3F2A"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Pulse line through the centre */}
      <Path
        d="M 16 44 H 26 L 30 38 L 34 50 L 38 42 L 42 50 L 46 44 H 64"
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Eyes */}
      <Circle cx={32} cy={32} r={2.4} fill="#1F504E" />
      <Circle cx={48} cy={32} r={2.4} fill="#1F504E" />
      {/* Cheek blush */}
      <Circle cx={26} cy={36} r={3} fill="#F5A3A3" opacity={0.55} />
      <Circle cx={54} cy={36} r={3} fill="#F5A3A3" opacity={0.55} />
      {/* Body highlight */}
      <Ellipse cx={28} cy={24} rx={4} ry={2} fill="#FFFFFF" opacity={0.3} />
    </Svg>
  </View>
);

// ─── 3. Neurology — brain with face + sparkle ──────────────────────────

export const NeurologyMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="neuro-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A8C4C2" />
          <Stop offset="1" stopColor="#6FA19E" />
        </SvgLinearGradient>
      </Defs>
      {/* Brain silhouette — two lobes */}
      <Path
        d="M 18 36 C 14 28 18 20 26 20 C 28 14 38 14 40 22 C 42 14 52 14 54 20 C 62 20 66 28 62 36 C 68 42 64 52 56 54 C 54 60 46 62 40 58 C 34 62 26 60 24 54 C 16 52 12 42 18 36 Z"
        fill="url(#neuro-body)"
        stroke="#3F7E7A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Brain folds */}
      <Path d="M 28 30 Q 32 32 30 38" stroke="#3F7E7A" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d="M 50 30 Q 46 32 48 38" stroke="#3F7E7A" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d="M 40 22 V 58" stroke="#3F7E7A" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.5} />
      {/* Eyes */}
      <Circle cx={32} cy={42} r={2.2} fill="#1F504E" />
      <Circle cx={48} cy={42} r={2.2} fill="#1F504E" />
      {/* Smile */}
      <Path d="M 35 50 Q 40 53 45 50" stroke="#1F504E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {/* Thinking sparkle */}
      <Path
        d="M 66 14 L 67.4 18.6 L 72 20 L 67.4 21.4 L 66 26 L 64.6 21.4 L 60 20 L 64.6 18.6 Z"
        fill="#F6C06A"
      />
    </Svg>
  </View>
);

// ─── 4. Psychiatry — speech-bubble face ────────────────────────────────

export const PsychiatryMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="psych-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5A3A3" />
          <Stop offset="1" stopColor="#D97575" />
        </SvgLinearGradient>
      </Defs>
      {/* Speech-bubble body — rounded rect with a tail */}
      <Path
        d="M 14 18 H 64 C 68 18 70 20 70 24 V 50 C 70 54 68 56 64 56 H 32 L 22 66 L 26 56 H 14 C 10 56 8 54 8 50 V 24 C 8 20 10 18 14 18 Z"
        fill="url(#psych-body)"
        stroke="#9E4848"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Eyes — cream on dark body */}
      <Circle cx={32} cy={36} r={3} fill="#FFFFFF" />
      <Circle cx={46} cy={36} r={3} fill="#FFFFFF" />
      <Circle cx={32} cy={36} r={1.4} fill="#1F504E" />
      <Circle cx={46} cy={36} r={1.4} fill="#1F504E" />
      {/* Cheek blush */}
      <Circle cx={24} cy={42} r={3.5} fill="#FFFFFF" opacity={0.35} />
      <Circle cx={54} cy={42} r={3.5} fill="#FFFFFF" opacity={0.35} />
      {/* Warm smile */}
      <Path
        d="M 32 46 Q 39 52 46 46"
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── 5. Dermatology — cheek with sparkle ───────────────────────────────

export const DermatologyMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="derm-body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE9C2" />
          <Stop offset="1" stopColor="#F6C06A" />
        </SvgLinearGradient>
      </Defs>
      {/* Round cheek/face body */}
      <Circle cx={40} cy={40} r={28} fill="url(#derm-body)" stroke="#A86F2A" strokeWidth={2.2} />
      {/* Subtle texture rings (skin layers) */}
      <Circle cx={40} cy={40} r={22} stroke="#D9964A" strokeWidth={0.8} fill="none" opacity={0.35} />
      <Circle cx={40} cy={40} r={16} stroke="#D9964A" strokeWidth={0.8} fill="none" opacity={0.25} />
      {/* Eyes */}
      <Circle cx={34} cy={36} r={2.4} fill="#1F504E" />
      <Circle cx={46} cy={36} r={2.4} fill="#1F504E" />
      {/* Cheek blush — slightly bigger, on theme */}
      <Circle cx={28} cy={44} r={4} fill="#F5A3A3" opacity={0.55} />
      <Circle cx={52} cy={44} r={4} fill="#F5A3A3" opacity={0.55} />
      {/* Smile */}
      <Path d="M 34 48 Q 40 52 46 48" stroke="#1F504E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {/* Glow sparkle on the cheek */}
      <Path
        d="M 60 22 L 61.6 26.4 L 66 28 L 61.6 29.6 L 60 34 L 58.4 29.6 L 54 28 L 58.4 26.4 Z"
        fill="#FFFFFF"
        stroke="#A86F2A"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// ─── 6. OB-GYN — crescent moon character ───────────────────────────────

export const ObGynMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="moon-body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E5DDC8" />
          <Stop offset="1" stopColor="#C7B98F" />
        </SvgLinearGradient>
      </Defs>
      {/* Crescent — outer circle minus inner offset circle */}
      <Path
        d="M 40 8 A 32 32 0 1 0 60 70 A 26 26 0 1 1 40 8 Z"
        fill="url(#moon-body)"
        stroke="#7A6A40"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Eyes on the curve */}
      <Circle cx={28} cy={36} r={2.4} fill="#1F504E" />
      <Circle cx={36} cy={42} r={2.4} fill="#1F504E" />
      {/* Cheek blush */}
      <Circle cx={22} cy={42} r={3} fill="#F5A3A3" opacity={0.5} />
      {/* Smile */}
      <Path
        d="M 26 48 Q 32 52 38 50"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      {/* Companion star */}
      <Path
        d="M 60 22 L 61.4 25.6 L 65 27 L 61.4 28.4 L 60 32 L 58.6 28.4 L 55 27 L 58.6 25.6 Z"
        fill="#F6C06A"
      />
      <Circle cx={70} cy={36} r={1.6} fill="#F6C06A" opacity={0.7} />
    </Svg>
  </View>
);

// ─── 7. Orthopedics — bone with face ───────────────────────────────────

export const OrthopedicsMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="bone-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Classic dog-bone shape — two lobes left and right of a central bar */}
      <Path
        d="
          M 22 30
          C 14 30 12 22 18 18
          C 22 14 30 16 30 24
          L 30 32
          H 50
          V 24
          C 50 16 58 14 62 18
          C 68 22 66 30 58 30
          C 66 30 68 38 62 42
          C 58 46 50 44 50 36
          L 50 36
          H 30
          V 36
          C 30 44 22 46 18 42
          C 12 38 14 30 22 30
          Z
        "
        fill="url(#bone-body)"
        stroke="#3F7E7A"
        strokeWidth={2}
        strokeLinejoin="round"
        transform="rotate(-12 40 30)"
      />
      {/* Eyes on the central bar */}
      <Circle cx={36} cy={32} r={2.4} fill="#1F504E" />
      <Circle cx={48} cy={36} r={2.4} fill="#1F504E" />
      {/* Smile */}
      <Path
        d="M 36 40 Q 42 44 48 42"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      {/* Tiny gold sparkle (joint ease) */}
      <Path
        d="M 64 60 L 65.4 64.6 L 70 66 L 65.4 67.4 L 64 72 L 62.6 67.4 L 58 66 L 62.6 64.6 Z"
        fill="#F6C06A"
      />
    </Svg>
  </View>
);

// ─── 8. Ophthalmology — single big eye character ───────────────────────

export const OphthalmologyMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="eye-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A8B6D4" />
          <Stop offset="1" stopColor="#5C75A1" />
        </SvgLinearGradient>
        <SvgLinearGradient id="eye-iris" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3BA79F" />
          <Stop offset="1" stopColor="#1F504E" />
        </SvgLinearGradient>
      </Defs>
      {/* Eye-shaped body — outer almond */}
      <Path
        d="M 8 40 Q 40 12 72 40 Q 40 68 8 40 Z"
        fill="url(#eye-body)"
        stroke="#36497A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Sclera (white) */}
      <Path
        d="M 14 40 Q 40 18 66 40 Q 40 62 14 40 Z"
        fill="#FFFFFF"
      />
      {/* Iris */}
      <Circle cx={40} cy={40} r={12} fill="url(#eye-iris)" stroke="#1F504E" strokeWidth={1.4} />
      {/* Pupil */}
      <Circle cx={40} cy={40} r={5} fill="#0F2A28" />
      {/* Highlight */}
      <Circle cx={37} cy={37} r={2} fill="#FFFFFF" opacity={0.85} />
      {/* Eyelashes */}
      <Path d="M 22 22 L 24 28" stroke="#1F504E" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M 32 16 L 33 22" stroke="#1F504E" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M 48 16 L 47 22" stroke="#1F504E" strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M 58 22 L 56 28" stroke="#1F504E" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  </View>
);

// ─── 9. Specialist — doctor's bag with face ────────────────────────────

export const SpecialistMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="bag-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D9BBA7" />
          <Stop offset="1" stopColor="#9E7458" />
        </SvgLinearGradient>
      </Defs>
      {/* Bag handle */}
      <Path
        d="M 30 20 Q 30 12 40 12 Q 50 12 50 20"
        stroke="#5C3D12"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {/* Bag body */}
      <Rect
        x={14}
        y={20}
        width={52}
        height={42}
        rx={6}
        fill="url(#bag-body)"
        stroke="#5C3D12"
        strokeWidth={2.2}
      />
      {/* Latch */}
      <Rect x={36} y={18} width={8} height={6} rx={1.5} fill="#5C3D12" />
      {/* Medical cross */}
      <Rect x={36} y={32} width={8} height={20} rx={1.5} fill="#FFFFFF" />
      <Rect x={28} y={38} width={24} height={8} rx={1.5} fill="#FFFFFF" />
      {/* Eyes — flanking the cross */}
      <Circle cx={22} cy={32} r={1.8} fill="#1F504E" />
      <Circle cx={58} cy={32} r={1.8} fill="#1F504E" />
      {/* Tiny smile under the cross */}
      <Path
        d="M 35 56 Q 40 58 45 56"
        stroke="#1F504E"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// ─── 10. Other — three friendly bubbles (matches AllergyMascots) ───────

export const OtherSpecialtyMascot: React.FC<MascotProps> = ({
  size = moderateScale(64),
}) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="other-spec-top" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={26} cy={66} r={6} fill="#E5DDC8" stroke="#C9BFA5" strokeWidth={1.6} />
      <Circle cx={36} cy={52} r={9} fill="#E5DDC8" stroke="#C9BFA5" strokeWidth={1.8} />
      <Circle cx={48} cy={32} r={20} fill="url(#other-spec-top)" stroke="#2C6E6B" strokeWidth={2.4} />
      <Circle cx={40} cy={36} r={3} fill="#F5A3A3" opacity={0.55} />
      <Circle cx={56} cy={36} r={3} fill="#F5A3A3" opacity={0.55} />
      <Path d="M 41 28 Q 44 27 47 29" stroke="#1F504E" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M 53 28 Q 56 27 59 29" stroke="#1F504E" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M 44 38 Q 50 42 56 38" stroke="#1F504E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Circle cx={68} cy={18} r={6} fill="#F6C06A" stroke="#FFFFFF" strokeWidth={1.4} />
    </Svg>
  </View>
);

// ─── 11. Gastro — soft stomach pouch with face ─────────────────────────

export const GastroMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="gi-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FCE7C5" />
          <Stop offset="1" stopColor="#E5B888" />
        </SvgLinearGradient>
      </Defs>
      {/* Stomach pouch silhouette — soft bean with a slight neck on the right */}
      <Path
        d="M 22 24 C 22 14, 32 14, 40 16 C 50 18, 58 16, 60 26 C 62 36, 56 42, 58 48 C 60 56, 50 60, 38 58 C 26 56, 18 50, 20 38 C 22 30, 22 28, 22 24 Z"
        fill="url(#gi-body)"
        stroke="#A4744A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Faint digestion ripples — bottom of the pouch */}
      <Path
        d="M 28 46 Q 36 48 44 46"
        stroke="#A4744A"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />
      <Path
        d="M 30 51 Q 36 52 42 51"
        stroke="#A4744A"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        opacity={0.3}
      />
      {/* Eyes */}
      <Circle cx={32} cy={32} r={2.2} fill="#1F504E" />
      <Circle cx={46} cy={32} r={2.2} fill="#1F504E" />
      {/* Smile */}
      <Path
        d="M 33 38 Q 39 42 45 38"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheek blush */}
      <Circle cx={28} cy={36} r={1.6} fill="#E07A5F" opacity={0.35} />
      <Circle cx={50} cy={36} r={1.6} fill="#E07A5F" opacity={0.35} />
    </Svg>
  </View>
);
