import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Path,
  RadialGradient,
  Skia,
  useClock,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  useTheme,
  verticalScale,
} from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface HoldToRecordOverlayProps {
  visible: boolean;
  liveTranscript: string;
  durationSec: number;
  volume: SharedValue<number>;
}

/**
 * Full-screen hold-to-record canvas. Glass-blurred backdrop, a
 * voice-reactive Skia blob anchored slightly above centre, live
 * transcript in serif, and a subtle timer pill. Entry is one spring
 * scale from the FAB origin (bottom-centre) so the whole surface
 * feels like it grew out of the mic — not a curtain dropping.
 */
export const HoldToRecordOverlay: React.FC<HoldToRecordOverlayProps> = ({
  visible,
  liveTranscript,
  durationSec,
  volume,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  // Master progress — drives every animation so they stay in sync.
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = reduced
        ? withTiming(1, { duration: 90 })
        : withSpring(1, { damping: 18, stiffness: 140, mass: 0.9 });
    } else {
      progress.value = withTiming(0, {
        duration: reduced ? 80 : 220,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, reduced, progress]);

  // Backdrop blur + tint fade
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // Orb scales + translates from the FAB origin (bottom-centre).
  const orbWrapStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.2, 1], Extrapolation.CLAMP);
    const ty = interpolate(progress.value, [0, 1], [180, 0], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: ty }, { scale }],
      opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]),
    };
  });

  const timerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-16, 0]) }],
  }));

  const transcriptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [24, 0]) }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7, 1], [0, 0, 1]),
  }));

  if (!visible && progress.value === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Glass backdrop — native iOS blur, no fake opacity wash. */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={reduced ? 30 : 80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
      </Animated.View>

      {/* Timer pill — small, high, a recording dot throbbing next to it. */}
      <Animated.View style={[styles.timerWrap, timerStyle]}>
        <View style={[styles.timerPill, { borderColor: "rgba(255,255,255,0.14)" }]}>
          <RecordingDot />
          <Text style={styles.timerText}>{formatDuration(durationSec)}</Text>
        </View>
      </Animated.View>

      {/* Hero orb — Skia, organic, voice-reactive. */}
      <View style={styles.orbAnchor}>
        <Animated.View style={orbWrapStyle}>
          <ReactiveBlob volume={volume} size={moderateScale(260)} />
        </Animated.View>
      </View>

      {/* Live transcript — serif, three lines max, dominates the lower half. */}
      <Animated.View style={[styles.transcriptWrap, transcriptStyle]}>
        <Text style={styles.transcript} numberOfLines={3}>
          {liveTranscript || "Listening…"}
        </Text>
      </Animated.View>

      {/* Release hint at the bottom — tight, instructional. */}
      <Animated.View style={[styles.hintWrap, hintStyle]}>
        <View style={[styles.hintPill, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
          <Text style={styles.hintText}>Release to save</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ── Throbbing record dot ───────────────────────────────────────────

const RecordingDot: React.FC = () => {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    // Simple two-way spring loop — feels more alive than withRepeat linear.
    const loop = () => {
      pulse.value = withTiming(0.55, { duration: 720, easing: Easing.out(Easing.sin) }, () => {
        pulse.value = withTiming(1, { duration: 720, easing: Easing.in(Easing.sin) }, () => {
          loop();
        });
      });
    };
    loop();
  }, [reduced, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[styles_dot.dot, style]} />;
};

const styles_dot = StyleSheet.create({
  dot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: "#F06060",
  },
});

// ── Voice-reactive Skia blob (display-only, non-interactive) ──────

const VERTEX_COUNT = 10;
const TWO_PI = Math.PI * 2;

interface ReactiveBlobProps {
  volume: SharedValue<number>;
  size: number;
}

const ReactiveBlob: React.FC<ReactiveBlobProps> = ({ volume, size }) => {
  const clock = useClock();
  const center = size / 2;
  const baseR = size * 0.26;

  // Smoothed meter — raw volume ticks every 300ms and would jitter.
  const smoothed = useSharedValue(0);
  useDerivedValue(() => {
    const target = volume.value;
    smoothed.value += (target - smoothed.value) * 0.18;
  });

  const blobPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const t = clock.value / 1000;
    const m = smoothed.value;
    const wobble = baseR * (0.04 + m * 0.18);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < VERTEX_COUNT; i++) {
      const angle = (i / VERTEX_COUNT) * TWO_PI;
      const phase = i * 0.73;
      const wob =
        Math.sin(t * 1.2 + phase) * wobble +
        Math.sin(t * 2.6 + phase * 0.7) * wobble * 0.5;
      const r = baseR + wob + m * baseR * 0.32;
      pts.push([center + Math.cos(angle) * r, center + Math.sin(angle) * r]);
    }
    const first = pts[0]!;
    path.moveTo(
      (first[0] + pts[VERTEX_COUNT - 1]![0]) / 2,
      (first[1] + pts[VERTEX_COUNT - 1]![1]) / 2,
    );
    for (let i = 0; i < VERTEX_COUNT; i++) {
      const curr = pts[i]!;
      const next = pts[(i + 1) % VERTEX_COUNT]!;
      path.quadTo(curr[0], curr[1], (curr[0] + next[0]) / 2, (curr[1] + next[1]) / 2);
    }
    path.close();
    return path;
  });

  const haloR = useDerivedValue(() => baseR * 1.45 + smoothed.value * baseR * 1.1);
  const haloOp = useDerivedValue(() => 0.22 + smoothed.value * 0.55);
  const coreR = useDerivedValue(() => baseR * 0.32 + smoothed.value * 14);

  const gradient = useDerivedValue<string[]>(() => {
    const m = smoothed.value;
    if (m < 0.1) return ["#A8C4C2", "#3BA79F", "#1F504E"];
    const warmth = Math.min(1, m * 1.3);
    const mix = (a: string, b: string, t: number) => {
      const ai = parseInt(a.slice(1), 16);
      const bi = parseInt(b.slice(1), 16);
      const r = Math.round(((ai >> 16) & 0xff) + (((bi >> 16) & 0xff) - ((ai >> 16) & 0xff)) * t);
      const g = Math.round(((ai >> 8) & 0xff) + (((bi >> 8) & 0xff) - ((ai >> 8) & 0xff)) * t);
      const b2 = Math.round((ai & 0xff) + ((bi & 0xff) - (ai & 0xff)) * t);
      return `#${((r << 16) | (g << 8) | b2).toString(16).padStart(6, "0")}`;
    };
    return [
      mix("#A8C4C2", "#F6C06A", warmth),
      mix("#3BA79F", "#E07A5F", warmth),
      mix("#1F504E", "#C45C3F", warmth),
    ];
  });

  const haloColor = useDerivedValue(() =>
    smoothed.value > 0.3 ? "#E07A5F" : "#3BA79F",
  );

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {/* Outer halo */}
          <Circle cx={center} cy={center} r={haloR} opacity={haloOp} color={haloColor}>
            <BlurMask blur={28} style="normal" />
          </Circle>
          {/* Soft middle glow */}
          <Circle cx={center} cy={center} r={baseR * 1.12}>
            <RadialGradient c={vec(center, center)} r={baseR * 1.15} colors={gradient} />
            <BlurMask blur={18} style="solid" />
          </Circle>
          {/* Organic core blob */}
          <Path path={blobPath}>
            <RadialGradient c={vec(center, center)} r={baseR} colors={gradient} />
            <BlurMask blur={8} style="solid" />
          </Path>
          {/* Bright inner highlight — moves with the meter */}
          <Circle
            cx={center - baseR * 0.2}
            cy={center - baseR * 0.28}
            r={coreR}
            color="rgba(255,255,255,0.4)"
          >
            <BlurMask blur={10} style="normal" />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────

const formatDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const useStyles = makeStyles(() => ({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 14, 14, 0.38)",
  },
  timerWrap: {
    position: "absolute",
    top: verticalScale(72),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  timerText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.92)",
  },
  orbAnchor: {
    position: "absolute",
    top: "22%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  transcriptWrap: {
    position: "absolute",
    top: "62%",
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
    alignItems: "center",
  },
  transcript: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(22),
    lineHeight: fontScale(30),
    letterSpacing: -0.3,
    textAlign: "center",
    color: "rgba(255,255,255,0.95)",
    minHeight: verticalScale(90),
    maxWidth: moderateScale(320),
  },
  hintWrap: {
    position: "absolute",
    bottom: verticalScale(112),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderRadius: 999,
  },
  hintText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.88)",
  },
}));
