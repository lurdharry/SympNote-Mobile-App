import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  useTheme,
} from "../../../theme";
import { PocketbookMascot } from "../PocketbookMascot";

interface CraftingOverlayProps {
  reduced: boolean;
}

/**
 * Post-purchase loader. Fires after a successful subscribe on the
 * onboarding paywall while `commitDraft` runs (structures the
 * pending recording, commits to persisted stores, flips
 * onboardingComplete). Mirrors the modern mascot-loader pattern from
 * first-brief's LoadingOrb so the visual language is continuous
 * across the loading moments in onboarding.
 *
 * Three layers:
 *  • Halo — radial accent gradient breathing behind the mascot
 *  • Mascot — PocketbookMascot bobbing gently (same mascot the user
 *    saw on the paywall hero — visual continuity)
 *  • Cycling status beats — three lines that map to the actual work
 *    (crafting → committing → done), holding on the last
 */
const CRAFTING_BEATS = [
  "Crafting your brief…",
  "Building your record…",
  "All set.",
];

export const CraftingOverlay: React.FC<CraftingOverlayProps> = ({ reduced }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const pulse = useSharedValue(0);
  const bob = useSharedValue(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse, bob]);

  // Brief work — purchase mock returns ~1.4s, commit is fast. Three
  // beats at 800ms each = ~2.4s, holding on "All set." until the
  // overlay unmounts on route replace to /home.
  useEffect(() => {
    const id = setInterval(() => {
      setBeat((b) => Math.min(b + 1, CRAFTING_BEATS.length - 1));
    }, 800);
    return () => clearInterval(id);
  }, []);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.45,
    transform: [{ scale: 0.9 + pulse.value * 0.2 }],
  }));
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 + bob.value * 6 }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.body}>
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
              <PocketbookMascot reduced={reduced} size={moderateScale(140)} />
            </Animated.View>
          </View>
          <Animated.Text
            key={beat}
            entering={FadeIn.duration(280)}
            style={[styles.title, { color: colors.textPrimary }]}
          >
            {CRAFTING_BEATS[beat]}
          </Animated.Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Turning your words into a record you can take to the doctor.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s6,
  },
  stage: {
    width: moderateScale(190),
    height: moderateScale(190),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s6,
  },
  halo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(95),
    overflow: "hidden",
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    textAlign: "center",
    marginTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s4,
    maxWidth: moderateScale(320),
  },
}));
