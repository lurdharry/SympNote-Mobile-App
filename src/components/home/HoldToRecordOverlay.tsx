import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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
  /** Whether the hold is active + a recording is in progress. Drives
   *  mount/unmount of the overlay. */
  visible: boolean;
  /** Live partial transcript to surface while the user speaks. */
  liveTranscript: string;
  /** Seconds elapsed since recording began. */
  durationSec: number;
  /** 0–1 normalized volume, drives the orb's pulse. */
  volume: SharedValue<number>;
}

/**
 * Theatrical full-screen overlay shown while the user holds the
 * home FAB to record. A teal aurora gradient washes up from the mic
 * area, the underlying home stays visible at ~30% opacity, and a
 * volume-reactive orb plus live transcript anchor the centre.
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

  // Mount animation — sweeps from 0 to 1 as the aurora rises.
  const progress = useSharedValue(0);
  // Ambient twirl used on the aurora so it feels alive even when
  // the user is silent.
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, {
        duration: reduced ? 120 : 420,
        easing: Easing.out(Easing.cubic),
      });
      if (!reduced) {
        breathe.value = withRepeat(
          withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        );
      }
    } else {
      progress.value = withTiming(0, {
        duration: reduced ? 90 : 260,
        easing: Easing.in(Easing.cubic),
      });
      breathe.value = 0;
    }
  }, [visible, reduced, progress, breathe]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const auroraStyle = useAnimatedStyle(() => {
    // Rising band: translateY from +60% at rest → -10% fully open.
    const ty = interpolate(progress.value, [0, 1], [60, -10], Extrapolation.CLAMP);
    const scale = 1 + breathe.value * 0.08;
    return {
      transform: [{ translateY: `${ty}%` }, { scale }],
      opacity: progress.value,
    };
  });

  const orbOuterStyle = useAnimatedStyle(() => {
    const v = volume.value;
    const scale = 0.9 + progress.value * 0.1 + v * 0.25;
    return {
      transform: [{ scale }],
      opacity: 0.55 * progress.value,
    };
  });

  const orbInnerStyle = useAnimatedStyle(() => {
    const v = volume.value;
    const scale = 0.85 + progress.value * 0.15 + v * 0.35;
    return {
      transform: [{ scale }],
      opacity: 0.9 * progress.value,
    };
  });

  const orbCoreStyle = useAnimatedStyle(() => {
    const v = volume.value;
    const scale = 0.9 + v * 0.2;
    return {
      transform: [{ scale }],
      opacity: progress.value,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [20, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  if (!visible && progress.value === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Dim the underlying home to ~30% visibility. */}
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      {/* Aurora — rising from below, gradient from the mic's teal. */}
      <Animated.View style={[styles.auroraWrap, auroraStyle]}>
        <LinearGradient
          colors={[
            "rgba(44,110,107,0)",
            "rgba(44,110,107,0.18)",
            "rgba(61,166,159,0.42)",
            "rgba(246,192,106,0.22)",
          ]}
          locations={[0, 0.38, 0.78, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Volume-reactive orb: outer halo + mid ring + bright core. */}
      <View style={styles.orbAnchor} pointerEvents="none">
        <Animated.View style={[styles.orbOuter, orbOuterStyle]}>
          <LinearGradient
            colors={["rgba(61,166,159,0.55)", "rgba(61,166,159,0)"]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.orbInner, orbInnerStyle]}>
          <LinearGradient
            colors={["#3BA79F", "#2C6E6B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.orbCore, orbCoreStyle]}>
          <LinearGradient
            colors={["#F5F1EA", "#F6C06A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Content — transcript preview, timer, hint. */}
      <Animated.View style={[styles.content, contentStyle]} pointerEvents="none">
        <Text style={[styles.timer, { color: colors.textPrimary }]}>
          {formatDuration(durationSec)}
        </Text>
        <Text
          style={[styles.transcript, { color: colors.textPrimary }]}
          numberOfLines={4}
        >
          {liveTranscript || "Listening…"}
        </Text>
        <View style={styles.hintRow}>
          <View style={[styles.hintDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Release to save
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const formatDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const useStyles = makeStyles(() => ({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 18, 18, 0.72)",
  },
  auroraWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orbAnchor: {
    position: "absolute",
    top: "28%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  orbOuter: {
    position: "absolute",
    width: moderateScale(220),
    height: moderateScale(220),
    borderRadius: moderateScale(110),
    overflow: "hidden",
  },
  orbInner: {
    position: "absolute",
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    overflow: "hidden",
  },
  orbCore: {
    position: "absolute",
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    overflow: "hidden",
  },
  content: {
    position: "absolute",
    top: "54%",
    left: 0,
    right: 0,
    paddingHorizontal: spacing.s6,
    alignItems: "center",
  },
  timer: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(38),
    letterSpacing: -1,
    marginBottom: verticalScale(12),
  },
  transcript: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(18),
    lineHeight: fontScale(26),
    textAlign: "center",
    minHeight: verticalScale(52),
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: verticalScale(24),
  },
  hintDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  hint: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.4,
  },
}));
