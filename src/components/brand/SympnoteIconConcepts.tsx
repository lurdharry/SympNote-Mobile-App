import React, { useId } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { fontScale, moderateScale, useTheme, verticalScale } from "@/theme";

// SympNote palette (kept in-file so this component is drop-in without
// theme coupling — concept exploration, not final app chrome).
const TEAL_LIGHT = "#3BA79F";
const TEAL_MID = "#2C6E6B";
const TEAL_DEEP = "#1F504E";
const NAVY_TEAL = "#143D3C";
const CREAM = "#F5F1EA";
const SAND = "#EFE6D3";
const GOLD = "#F6C06A";
const CORAL = "#E07A5F";

interface ConceptProps {
  size?: number;
}

/**
 * Nine icon concepts exploring the same product space (voice → clinical
 * note). Each is a rounded 64×64 tile with a distinct foreground
 * direction. Use `SympnoteIconMoodboard` to see them side by side.
 */

// ── 1. Bubble + Waveform — the refined classic ─────────────────────
export const SNConcept1: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c1-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="0.55" stopColor={TEAL_MID} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      <Rect x={12} y={16} width={40} height={28} rx={12} fill={CREAM} />
      <G>
        <Rect x={21} y={26} width={3} height={8} rx={1.5} fill={TEAL_MID} />
        <Rect x={27} y={22} width={3} height={16} rx={1.5} fill={TEAL_MID} />
        <Rect x={33} y={18} width={3} height={24} rx={1.5} fill={TEAL_MID} />
        <Rect x={39} y={22} width={3} height={16} rx={1.5} fill={TEAL_MID} />
      </G>
    </Svg>
  );
};

// ── 2. Pure voice waveform — stripped back ─────────────────────────
export const SNConcept2: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c2-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      <G>
        <Rect x={11} y={28} width={5} height={8} rx={2.5} fill={CREAM} />
        <Rect x={20} y={22} width={5} height={20} rx={2.5} fill={CREAM} />
        <Rect x={29} y={16} width={5} height={32} rx={2.5} fill={CREAM} />
        <Rect x={38} y={22} width={5} height={20} rx={2.5} fill={CREAM} />
        <Rect x={47} y={28} width={5} height={8} rx={2.5} fill={CREAM} />
      </G>
    </Svg>
  );
};

// ── 3. Ripple rings — voice radiating out ──────────────────────────
export const SNConcept3: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c3-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      <Circle cx={32} cy={32} r={24} stroke={CREAM} strokeWidth={1.8} fill="none" opacity={0.35} />
      <Circle cx={32} cy={32} r={16} stroke={CREAM} strokeWidth={2} fill="none" opacity={0.6} />
      <Circle cx={32} cy={32} r={9} stroke={CREAM} strokeWidth={2.2} fill="none" opacity={0.85} />
      <Circle cx={32} cy={32} r={4} fill={GOLD} />
    </Svg>
  );
};

// ── 4. Folded note — transcript card, inverted palette ─────────────
export const SNConcept4: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c4-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={CREAM} />
          <Stop offset="1" stopColor={SAND} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Note card with folded top-right corner */}
      <Path
        d="M14 14 H42 L52 24 V48 Q52 52 48 52 H18 Q14 52 14 48 Z"
        fill={TEAL_MID}
      />
      {/* Folded corner highlight */}
      <Path d="M42 14 V24 H52 Z" fill={TEAL_LIGHT} />
      {/* Transcript lines */}
      <Rect x={20} y={30} width={22} height={2.5} rx={1.25} fill={CREAM} opacity={0.9} />
      <Rect x={20} y={36} width={26} height={2.5} rx={1.25} fill={CREAM} opacity={0.75} />
      <Rect x={20} y={42} width={16} height={2.5} rx={1.25} fill={CREAM} opacity={0.6} />
    </Svg>
  );
};

// ── 5. Bubble + pulse — voice that matters ─────────────────────────
export const SNConcept5: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c5-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      <Rect x={10} y={18} width={44} height={28} rx={12} fill={CREAM} />
      {/* EKG pulse */}
      <Path
        d="M14 32 H22 L26 22 L30 42 L34 24 L38 32 H50"
        stroke={CORAL}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

// ── 6. Dialogue — patient + clinician bubbles ──────────────────────
export const SNConcept6: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c6-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_MID} />
          <Stop offset="1" stopColor={NAVY_TEAL} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Back bubble — gold (clinician) */}
      <Rect x={22} y={10} width={32} height={22} rx={10} fill={GOLD} />
      {/* Front bubble — cream (patient), with mini waveform */}
      <Rect x={10} y={28} width={32} height={22} rx={10} fill={CREAM} />
      <G>
        <Rect x={17} y={36} width={2.4} height={6} rx={1.2} fill={TEAL_MID} />
        <Rect x={22} y={33} width={2.4} height={12} rx={1.2} fill={TEAL_MID} />
        <Rect x={27} y={30} width={2.4} height={18} rx={1.2} fill={TEAL_MID} />
        <Rect x={32} y={35} width={2.4} height={8} rx={1.2} fill={TEAL_MID} />
      </G>
    </Svg>
  );
};

// ── 7. Sparkle + wave — AI-forward, cream ground ───────────────────
export const SNConcept7: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c7-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={CREAM} />
          <Stop offset="1" stopColor={SAND} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      <G>
        <Rect x={14} y={30} width={4} height={8} rx={2} fill={TEAL_MID} />
        <Rect x={22} y={24} width={4} height={20} rx={2} fill={TEAL_MID} />
        <Rect x={30} y={20} width={4} height={28} rx={2} fill={TEAL_DEEP} />
        <Rect x={38} y={26} width={4} height={16} rx={2} fill={TEAL_MID} />
      </G>
      {/* Gold sparkle top-right */}
      <G x={48} y={16}>
        <Circle r={5.5} fill={GOLD} />
        <Path
          d="M0 -3 L0.8 -0.8 L3 0 L0.8 0.8 L0 3 L-0.8 0.8 L-3 0 L-0.8 -0.8 Z"
          fill={CREAM}
        />
      </G>
    </Svg>
  );
};

// ── 8. S as soundwave — monogram direction ─────────────────────────
export const SNConcept8: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c8-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={TEAL_LIGHT} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Thick S curve evocative of a soundwave */}
      <Path
        d="M44 20
           C44 14 38 14 32 14
           C24 14 20 18 20 24
           C20 30 26 31 32 31
           C38 31 44 33 44 40
           C44 46 38 50 32 50
           C26 50 20 48 20 44"
        stroke={CREAM}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
};

// ── 9. Shield + wave — trust + voice, duotone ──────────────────────
export const SNConcept9: React.FC<ConceptProps> = ({ size = 64 }) => {
  const base = `c9-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${base}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={CORAL} />
          <Stop offset="1" stopColor={TEAL_DEEP} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={64} height={64} rx={14} fill={`url(#${base}-bg)`} />
      {/* Shield silhouette */}
      <Path
        d="M32 10
           L50 16
           V32
           C50 42 38 52 32 54
           C26 52 14 42 14 32
           V16 Z"
        fill={CREAM}
      />
      {/* Waveform inside the shield */}
      <G>
        <Rect x={21} y={30} width={2.6} height={6} rx={1.3} fill={TEAL_MID} />
        <Rect x={26} y={26} width={2.6} height={14} rx={1.3} fill={TEAL_MID} />
        <Rect x={31} y={22} width={2.6} height={22} rx={1.3} fill={TEAL_DEEP} />
        <Rect x={36} y={26} width={2.6} height={14} rx={1.3} fill={TEAL_MID} />
        <Rect x={41} y={30} width={2.6} height={6} rx={1.3} fill={TEAL_MID} />
      </G>
    </Svg>
  );
};

// ── Moodboard grid ─────────────────────────────────────────────────

interface MoodboardProps {
  tileSize?: number;
  showLabels?: boolean;
}

const CONCEPTS: { id: number; label: string; Component: React.FC<ConceptProps> }[] = [
  { id: 1, label: "Bubble + Wave", Component: SNConcept1 },
  { id: 2, label: "Pure Wave", Component: SNConcept2 },
  { id: 3, label: "Ripple", Component: SNConcept3 },
  { id: 4, label: "Note Card", Component: SNConcept4 },
  { id: 5, label: "Bubble + Pulse", Component: SNConcept5 },
  { id: 6, label: "Dialogue", Component: SNConcept6 },
  { id: 7, label: "Sparkle + Wave", Component: SNConcept7 },
  { id: 8, label: "Monogram S", Component: SNConcept8 },
  { id: 9, label: "Shield + Wave", Component: SNConcept9 },
];

/**
 * Renders all nine concepts in a 3×3 grid with a label beneath each
 * so you can reference them by number when picking a direction.
 */
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
