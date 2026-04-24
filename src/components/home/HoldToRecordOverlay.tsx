import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
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
 * Hold-to-record overlay. Glass-blurred canvas where the live
 * transcript is the hero — nothing decorative to fight with it.
 * A horizontal waveform at the bottom breathes with your voice, a
 * tiny pill at the top shows the timer + recording dot, everything
 * else is typography and space.
 */
export const HoldToRecordOverlay: React.FC<HoldToRecordOverlayProps> = ({
  visible,
  liveTranscript,
  durationSec,
  volume,
}) => {
  const styles = useStyles();
  const reduced = useReducedMotion();

  const progress = useSharedValue(0);
  // Mount-state mirrors `visible` but stays true long enough for the
  // exit animation to finish. Reading progress.value during render
  // to decide mounting would trigger Reanimated strict-mode warnings.
  const [mounted, setMounted] = useState(visible);
  const exitDuration = reduced ? 100 : 220;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = reduced
        ? withTiming(1, { duration: 90 })
        : withSpring(1, { damping: 20, stiffness: 160, mass: 0.8 });
      return;
    }
    progress.value = withTiming(0, {
      duration: exitDuration,
      easing: Easing.in(Easing.cubic),
    });
    const id = setTimeout(() => setMounted(false), exitDuration + 20);
    return () => clearTimeout(id);
  }, [visible, reduced, progress, exitDuration]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const timerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-12, 0]) }],
  }));

  const transcriptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [28, 0]) }],
  }));

  const waveformStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [40, 0]) }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.8, 1], [0, 0, 1]),
  }));

  if (!mounted) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={reduced ? 30 : 80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
      </Animated.View>

      <Animated.View style={[styles.timerWrap, timerStyle]}>
        <View style={styles.timerPill}>
          <RecordingDot />
          <Text style={styles.timerText}>{formatDuration(durationSec)}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.transcriptWrap, transcriptStyle]}>
        <Text style={styles.transcript} numberOfLines={5}>
          {liveTranscript || "Listening…"}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.waveformWrap, waveformStyle]}>
        <Waveform volume={volume} />
      </Animated.View>

      <Animated.View style={[styles.hintWrap, hintStyle]}>
        <Text style={styles.hintText}>Release to save</Text>
      </Animated.View>
    </View>
  );
};

// ── Recording dot ──────────────────────────────────────────────────

const RecordingDot: React.FC = () => {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    // withRepeat+withSequence loops on the UI thread — doesn't bounce
    // a JS callback each cycle like a recursive `loop()` would (which
    // Reanimated 4 strict mode rejects).
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 720, easing: Easing.out(Easing.sin) }),
        withTiming(1, { duration: 720, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[dotStyles.dot, style]} />;
};

const dotStyles = StyleSheet.create({
  dot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: "#F06060",
  },
});

// ── Horizontal waveform ───────────────────────────────────────────
// N centered bars, each with a phase-offset idle breath that volume
// amplifies. No wobble tricks — it's a clean mic meter.

const BAR_COUNT = 28;

interface WaveformProps {
  volume: SharedValue<number>;
}

const Waveform: React.FC<WaveformProps> = ({ volume }) => {
  // Smooth the meter so jitter doesn't reach the bars.
  const smoothed = useSharedValue(0);
  useEffect(() => {
    const id = setInterval(() => {
      smoothed.value = smoothed.value + (volume.value - smoothed.value) * 0.25;
    }, 32);
    return () => clearInterval(id);
  }, [volume, smoothed]);

  return (
    <View style={waveStyles.row}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <WaveBar key={i} index={i} volume={smoothed} />
      ))}
    </View>
  );
};

interface WaveBarProps {
  index: number;
  volume: SharedValue<number>;
}

const WaveBar: React.FC<WaveBarProps> = ({ index, volume }) => {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    // Each bar has its own phase so the row feels organic without
    // individual wobble math per frame. withRepeat runs entirely on
    // the UI thread, so no JS callback is invoked per cycle.
    const dur = 900 + (index % 4) * 140;
    const startDelay = (index * 70) % 900;
    const id = setTimeout(() => {
      t.value = withRepeat(
        withSequence(
          withTiming(1, { duration: dur / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: dur / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, startDelay);
    return () => clearTimeout(id);
  }, [index, reduced, t]);

  // Distance from centre in [0,1]; outer bars get scaled down a touch
  // so the row has a subtle envelope shape instead of flat tops.
  const distFromCenter = Math.abs(index - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
  const envelope = 1 - distFromCenter * 0.55;

  const style = useAnimatedStyle(() => {
    const idleAmp = 0.18 + t.value * 0.22;
    const liveAmp = volume.value * 1.1;
    const h = Math.min(1, (idleAmp + liveAmp) * envelope);
    return {
      transform: [{ scaleY: 0.15 + h }],
    };
  });

  return (
    <View style={waveStyles.barWrap}>
      <Animated.View style={[waveStyles.bar, style]} />
    </View>
  );
};

const waveStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(56),
    gap: moderateScale(3),
  },
  barWrap: {
    height: verticalScale(56),
    justifyContent: "center",
    alignItems: "center",
  },
  bar: {
    width: moderateScale(3),
    height: verticalScale(56),
    borderRadius: moderateScale(2),
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});

// ── Helpers ──────────────────────────────────────────────────────

const formatDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const useStyles = makeStyles(() => ({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 14, 14, 0.42)",
  },
  timerWrap: {
    position: "absolute",
    top: verticalScale(78),
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
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  timerText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.92)",
  },
  transcriptWrap: {
    position: "absolute",
    top: "28%",
    bottom: "32%",
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
    alignItems: "center",
    justifyContent: "center",
  },
  transcript: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(26),
    lineHeight: fontScale(36),
    letterSpacing: -0.4,
    textAlign: "center",
    color: "rgba(255,255,255,0.96)",
    maxWidth: moderateScale(340),
  },
  waveformWrap: {
    position: "absolute",
    bottom: verticalScale(170),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintWrap: {
    position: "absolute",
    bottom: verticalScale(124),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.65)",
  },
}));
