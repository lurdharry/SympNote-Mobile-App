import React, { useId } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Line,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { fontScale, moderateScale, useTheme, verticalScale } from "@/theme";

// SympNote palette
const TEAL_LIGHT = "#3BA79F";
const TEAL_MID = "#2C6E6B";
const TEAL_DEEP = "#1F504E";
const NAVY_TEAL = "#102E2D";
const CREAM = "#F5F1EA";
const SAND = "#EFE6D3";
const GOLD = "#F6C06A";
const CORAL = "#E07A5F";

interface ConceptProps {
  size?: number;
}

// ── 1. Aurora Ribbon ────────────────────────────────────────────────
// A flowing ribbon carved through deep night, teal→gold gradient, with
// three ghost echoes trailing behind it. Reads as voice as landscape.
export const SNConcept1: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c1-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={NAVY_TEAL} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
        <LinearGradient id={`${base}-rib`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="0.5" stopColor={CREAM} />
          <Stop offset="1" stopColor={GOLD} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Ghost echoes */}
      <Path
        d="M6 48 C 18 24, 34 56, 58 18"
        stroke={TEAL_LIGHT}
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
        opacity={0.12}
      />
      <Path
        d="M6 46 C 18 22, 34 54, 58 16"
        stroke={TEAL_LIGHT}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
        opacity={0.22}
      />
      {/* Primary ribbon */}
      <Path
        d="M6 44 C 18 20, 34 52, 58 14"
        stroke={`url(#${base}-rib)`}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      {/* Trailing stardust */}
      <Circle cx={14} cy={18} r={1} fill={CREAM} opacity={0.7} />
      <Circle cx={48} cy={46} r={0.8} fill={GOLD} opacity={0.8} />
      <Circle cx={52} cy={52} r={0.6} fill={CREAM} opacity={0.6} />
    </Svg>
  );
};

// ── 2. Negative-Space Voice ─────────────────────────────────────────
// A teal tile, but the waveform isn't drawn onto it — it's cut out of
// it, revealing a warm gold glow smouldering underneath. Feels like
// the voice is the only real thing in the frame.
export const SNConcept2: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c2-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient
          id={`${base}-glow`}
          cx="50%"
          cy="50%"
          rx="60%"
          ry="60%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={GOLD} />
          <Stop offset="0.6" stopColor={CORAL} />
          <Stop offset="1" stopColor={CORAL} stopOpacity="0.9" />
        </RadialGradient>
        <LinearGradient id={`${base}-face`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_MID} />
          <Stop offset="1" stopColor={NAVY_TEAL} />
        </LinearGradient>
        <Mask id={`${base}-mask`} maskUnits="userSpaceOnUse">
          <Rect x={0} y={0} width={64} height={64} rx={14} fill="#fff" />
          {/* Subtract the waveform from the mask so the tile punches
              through to the glow beneath. */}
          <Rect x={14} y={28} width={4} height={8} rx={2} fill="#000" />
          <Rect x={22} y={22} width={4} height={20} rx={2} fill="#000" />
          <Rect x={30} y={16} width={4} height={32} rx={2} fill="#000" />
          <Rect x={38} y={22} width={4} height={20} rx={2} fill="#000" />
          <Rect x={46} y={28} width={4} height={8} rx={2} fill="#000" />
        </Mask>
      </Defs>
      {/* Glow floor */}
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-glow)`} />
      {/* Teal face with waveform cut out */}
      <Rect
        x={0}
        y={0}
        width={64}
        height={64}
        rx={14}
        fill={`url(#${base}-face)`}
        mask={`url(#${base}-mask)`}
      />
    </Svg>
  );
};

// ── 3. Prism Split ──────────────────────────────────────────────────
// A single white line enters the tile, hits a rotated prism, and
// splits into four spectrum rays — a direct visual metaphor for "your
// voice, decoded."
export const SNConcept3: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c3-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={TEAL_MID} />
          <Stop offset="1" stopColor={NAVY_TEAL} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Incoming beam */}
      <Line x1={8} y1={10} x2={28} y2={30} stroke={CREAM} strokeWidth={2.2} strokeLinecap="round" />
      {/* Prism — rotated cream square at the intersection */}
      <G transform="translate(32 32) rotate(45)">
        <Rect x={-6} y={-6} width={12} height={12} rx={2} fill={CREAM} />
      </G>
      {/* Spectrum rays fanning down-right */}
      <Line x1={34} y1={34} x2={58} y2={40} stroke={CORAL} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={34} y1={36} x2={56} y2={48} stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={32} y1={38} x2={48} y2={56} stroke={TEAL_LIGHT} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1={30} y1={38} x2={34} y2={56} stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
};

// ── 4. Soundprint ───────────────────────────────────────────────────
// Concentric undulating curves like a fingerprint — every voice
// uniquely yours. Gold core beating inside.
export const SNConcept4: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c4-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Layered irregular arcs, each a half-ring with a little wave */}
      <Path
        d="M12 32 Q 20 22, 32 24 T 52 32"
        stroke={CREAM}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <Path
        d="M14 28 Q 22 18, 32 20 T 50 28"
        stroke={CREAM}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      <Path
        d="M18 24 Q 24 16, 32 17 T 46 24"
        stroke={CREAM}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M12 36 Q 20 46, 32 44 T 52 36"
        stroke={CREAM}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      <Path
        d="M14 40 Q 22 50, 32 48 T 50 40"
        stroke={CREAM}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <Circle cx={32} cy={32} r={3.2} fill={GOLD} />
    </Svg>
  );
};

// ── 5. Liquid Orb ───────────────────────────────────────────────────
// A glass sphere floating in space, waveform etched across its
// equator, a bright specular highlight keeping it 3D.
export const SNConcept5: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c5-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={NAVY_TEAL} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
        <RadialGradient
          id={`${base}-orb`}
          cx="38%"
          cy="30%"
          rx="70%"
          ry="70%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={CREAM} />
          <Stop offset="0.35" stopColor={TEAL_LIGHT} />
          <Stop offset="0.9" stopColor={TEAL_DEEP} />
          <Stop offset="1" stopColor={NAVY_TEAL} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      <Circle cx={32} cy={32} r={22} fill={`url(#${base}-orb)`} />
      {/* Etched waveform across the equator, slightly darker */}
      <G opacity={0.55}>
        <Rect x={17} y={31} width={1.8} height={3} rx={0.9} fill={NAVY_TEAL} />
        <Rect x={22} y={29} width={1.8} height={7} rx={0.9} fill={NAVY_TEAL} />
        <Rect x={27} y={27} width={1.8} height={11} rx={0.9} fill={NAVY_TEAL} />
        <Rect x={32} y={25} width={1.8} height={15} rx={0.9} fill={NAVY_TEAL} />
        <Rect x={37} y={27} width={1.8} height={11} rx={0.9} fill={NAVY_TEAL} />
        <Rect x={42} y={29} width={1.8} height={7} rx={0.9} fill={NAVY_TEAL} />
        <Rect x={47} y={31} width={1.8} height={3} rx={0.9} fill={NAVY_TEAL} />
      </G>
      {/* Specular highlight */}
      <Ellipse cx={24} cy={20} rx={6} ry={3} fill={CREAM} opacity={0.5} />
      <Ellipse cx={22} cy={18} rx={2.5} ry={1.2} fill={CREAM} opacity={0.85} />
    </Svg>
  );
};

// ── 6. Metamorphosis ────────────────────────────────────────────────
// Left half: voice radiating in arcs. Right half: the same energy
// crystallizing into clean transcript lines. The icon shows the
// product doing its thing, not just gesturing at it.
export const SNConcept6: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c6-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Left: expanding voice arcs from bottom-left pivot */}
      <Circle cx={14} cy={32} r={2.5} fill={GOLD} />
      <Path
        d="M14 32 A 6 6 0 0 1 20 26"
        stroke={CREAM}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
      <Path
        d="M14 32 A 6 6 0 0 0 20 38"
        stroke={CREAM}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
      <Path
        d="M14 32 A 11 11 0 0 1 25 21"
        stroke={CREAM}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M14 32 A 11 11 0 0 0 25 43"
        stroke={CREAM}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M14 32 A 16 16 0 0 1 30 16"
        stroke={CREAM}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />
      <Path
        d="M14 32 A 16 16 0 0 0 30 48"
        stroke={CREAM}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />
      {/* Right: crystallized transcript lines */}
      <Rect x={36} y={22} width={18} height={2.4} rx={1.2} fill={CREAM} />
      <Rect x={36} y={28} width={14} height={2.4} rx={1.2} fill={CREAM} opacity={0.8} />
      <Rect x={36} y={34} width={20} height={2.4} rx={1.2} fill={CREAM} opacity={0.9} />
      <Rect x={36} y={40} width={12} height={2.4} rx={1.2} fill={CREAM} opacity={0.7} />
    </Svg>
  );
};

// ── 7. Bloom ────────────────────────────────────────────────────────
// Asymmetric petals of sound bursting from a corner anchor, each
// petal tinted differently. Organic, warm, alive.
export const SNConcept7: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c7-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={SAND} />
          <Stop offset="1" stopColor={CREAM} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Petals — long teardrop shapes from (16, 48) fanning up-right */}
      <Path d="M16 48 Q 12 30, 22 14 Q 32 22, 16 48 Z" fill={TEAL_DEEP} opacity={0.95} />
      <Path d="M16 48 Q 18 28, 34 16 Q 38 28, 16 48 Z" fill={TEAL_MID} opacity={0.9} />
      <Path d="M16 48 Q 26 30, 46 22 Q 44 36, 16 48 Z" fill={TEAL_LIGHT} opacity={0.88} />
      <Path d="M16 48 Q 34 40, 52 36 Q 46 48, 16 48 Z" fill={GOLD} opacity={0.92} />
      <Path d="M16 48 Q 34 48, 50 50 Q 42 54, 16 48 Z" fill={CORAL} opacity={0.85} />
      {/* Core */}
      <Circle cx={16} cy={48} r={3} fill={NAVY_TEAL} />
      <Circle cx={16} cy={48} r={1.2} fill={CREAM} />
    </Svg>
  );
};

// ── 8. Sound-Wave S ─────────────────────────────────────────────────
// The letter S, but drawn as an undulating stroke that reads as a
// waveform looped back on itself. Monogram without being obvious.
export const SNConcept8: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c8-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="1" stopColor={NAVY_TEAL} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Ghost echo behind */}
      <Path
        d="M46 20 C 46 14 38 12 30 14 Q 16 17 22 26 Q 28 34 36 32 Q 50 30 44 40 Q 38 50 26 48 C 20 47 16 44 16 40"
        stroke={TEAL_LIGHT}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.28}
      />
      {/* Primary S */}
      <Path
        d="M46 20 C 46 14 38 12 30 14 Q 16 17 22 26 Q 28 34 36 32 Q 50 30 44 40 Q 38 50 26 48 C 20 47 16 44 16 40"
        stroke={CREAM}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Gold accent dot at one tip */}
      <Circle cx={46} cy={20} r={2.6} fill={GOLD} />
    </Svg>
  );
};

// ── 9. Constellation ────────────────────────────────────────────────
// Seven dots connected by hair-thin lines trace a voice-wave in the
// stars. Dots vary in size and brightness; some sit quietly, some
// pulse.
export const SNConcept9: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c9-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={NAVY_TEAL} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Subtle ambient specks */}
      <Circle cx={50} cy={14} r={0.8} fill={CREAM} opacity={0.4} />
      <Circle cx={16} cy={50} r={0.6} fill={CREAM} opacity={0.35} />
      <Circle cx={54} cy={50} r={0.5} fill={CREAM} opacity={0.3} />
      {/* Connecting lines along a voice-wave curve */}
      <Path
        d="M10 34 L 20 22 L 28 38 L 36 18 L 44 40 L 52 24 L 58 32"
        stroke={CREAM}
        strokeWidth={0.9}
        fill="none"
        opacity={0.45}
        strokeLinecap="round"
      />
      {/* Star nodes */}
      <Circle cx={10} cy={34} r={1.8} fill={CREAM} />
      <Circle cx={20} cy={22} r={2.6} fill={CREAM} />
      <Circle cx={28} cy={38} r={1.8} fill={CREAM} />
      <Circle cx={36} cy={18} r={3.4} fill={GOLD} />
      <Circle cx={44} cy={40} r={2.2} fill={CREAM} />
      <Circle cx={52} cy={24} r={2.8} fill={CREAM} />
      <Circle cx={58} cy={32} r={1.6} fill={CREAM} />
      {/* Halo on the gold anchor */}
      <Circle cx={36} cy={18} r={6} stroke={GOLD} strokeWidth={0.6} fill="none" opacity={0.4} />
    </Svg>
  );
};

// ── Moodboard grid ─────────────────────────────────────────────────

interface MoodboardProps {
  tileSize?: number;
  showLabels?: boolean;
}

const CONCEPTS: { id: number; label: string; Component: React.FC<ConceptProps> }[] = [
  { id: 1, label: "Aurora Ribbon", Component: SNConcept1 },
  { id: 2, label: "Negative Voice", Component: SNConcept2 },
  { id: 3, label: "Prism Split", Component: SNConcept3 },
  { id: 4, label: "Soundprint", Component: SNConcept4 },
  { id: 5, label: "Liquid Orb", Component: SNConcept5 },
  { id: 6, label: "Metamorphosis", Component: SNConcept6 },
  { id: 7, label: "Bloom", Component: SNConcept7 },
  { id: 8, label: "Sound-Wave S", Component: SNConcept8 },
  { id: 9, label: "Constellation", Component: SNConcept9 },
];

export const SympnoteIconMoodboard: React.FC<MoodboardProps> = ({
  tileSize = moderateScale(92),
  showLabels = true,
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.board}>
      {CONCEPTS.map(({ id, label, Component }) => (
        <View key={id} style={[styles.cell, { width: tileSize }]}>
          <Component size={tileSize} />
          {showLabels && (
            <View style={styles.labelWrap}>
              <Text style={[styles.labelNum, { color: colors.textTertiary }]}>
                #{id}
              </Text>
              <Text style={[styles.labelName, { color: colors.textSecondary }]}>
                {label}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(14),
    justifyContent: "center",
  },
  cell: {
    alignItems: "center",
  },
  labelWrap: {
    alignItems: "center",
    marginTop: verticalScale(6),
    gap: 1,
  },
  labelNum: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
  },
  labelName: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
  },
});
