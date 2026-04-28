import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Sparkles } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  typography,
  useTheme,
} from "@/theme";
import { PocketbookMascot } from "@/components/onboarding/PocketbookMascot";

interface LoadingOrbProps {
  reduced: boolean;
}

const LOADING_BEATS = [
  "Reading your note…",
  "Pulling out concerns…",
  "Drafting questions for your doctor…",
  "Almost done.",
];

/**
 * Loader for the first-brief AI run. Three layers of motion: a radial
 * accent halo behind, the pocketbook mascot bobbing gently, and three
 * sparkle particles orbiting at staggered phases. Status line below
 * cycles through what the AI is actually doing — read → pull concerns
 * → draft questions → almost done.
 */
export const LoadingOrb: React.FC<LoadingOrbProps> = ({ reduced }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const pulse = useSharedValue(0);
  const bob = useSharedValue(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse, bob]);

  useEffect(() => {
    const id = setInterval(() => {
      setBeat((b) => Math.min(b + 1, LOADING_BEATS.length - 1));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.45,
    transform: [{ scale: 0.9 + pulse.value * 0.2 }],
  }));
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 + bob.value * 6 }],
  }));
  const spark1 = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.6,
    transform: [
      { translateX: -28 - bob.value * 4 },
      { translateY: -32 - pulse.value * 4 },
    ],
  }));
  const spark2 = useAnimatedStyle(() => ({
    opacity: 0.35 + (1 - pulse.value) * 0.55,
    transform: [
      { translateX: 32 + (1 - bob.value) * 4 },
      { translateY: -22 - (1 - pulse.value) * 6 },
    ],
  }));
  const spark3 = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.45,
    transform: [
      { translateX: 26 + bob.value * 4 },
      { translateY: 28 + pulse.value * 4 },
    ],
  }));

  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.wrap}>
      <View style={styles.stage}>
        <Animated.View style={[styles.halo, haloStyle]}>
          <LinearGradient
            colors={[colors.accent + "33", colors.accent + "00"]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={mascotStyle}>
          <PocketbookMascot reduced={reduced} size={moderateScale(132)} />
        </Animated.View>
        <Animated.View style={[styles.spark, spark1]} pointerEvents="none">
          <Sparkles size={moderateScale(14)} color={colors.accent} strokeWidth={2.4} />
        </Animated.View>
        <Animated.View style={[styles.spark, spark2]} pointerEvents="none">
          <Sparkles size={moderateScale(10)} color={colors.accent} strokeWidth={2.4} />
        </Animated.View>
        <Animated.View style={[styles.spark, spark3]} pointerEvents="none">
          <Sparkles size={moderateScale(12)} color={colors.accent} strokeWidth={2.4} />
        </Animated.View>
      </View>
      <Animated.Text
        key={beat}
        entering={FadeIn.duration(280)}
        style={[styles.text, { color: colors.textSecondary }]}
      >
        {LOADING_BEATS[beat]}
      </Animated.Text>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    alignItems: "center",
    marginTop: theme.spacing.s8,
    gap: theme.spacing.s5,
  },
  stage: {
    width: moderateScale(180),
    height: moderateScale(180),
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(90),
    overflow: "hidden",
  },
  spark: {
    position: "absolute",
  },
  text: {
    ...typography.body,
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(15),
    lineHeight: fontScale(20),
    letterSpacing: -0.1,
    textAlign: "center",
    paddingHorizontal: theme.spacing.s6,
  },
}));
