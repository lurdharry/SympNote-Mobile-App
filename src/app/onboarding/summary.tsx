import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Mic } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { HoldToRecordOverlay } from "@/components/home/HoldToRecordOverlay";
import { useHoldToRecord } from "@/hooks/useHoldToRecord";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";

/**
 * Onboarding step 1 — record. Captures a hold-to-record voice note,
 * stores it as the pending draft, and pushes to /onboarding/review for
 * transcript editing + confirmation. Splitting the review surface into
 * its own route was deliberate: back from the review screen now lands
 * here (re-record), and back from analyzing/paywall returns to review,
 * instead of a single screen toggling internal modes.
 */
const ScreenFirstRecording: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const personalization = useProfileStore((s) => s.personalization);
  const headline = personalization?.firstRecordingPrompt ?? "What's been going on with you?";

  // Educational layer: shown on the very first time the user is on
  // this screen until they successfully begin a hold. After that it
  // disappears for the rest of the session.
  const [hasHeldOnce, setHasHeldOnce] = useState(false);

  const { state: holdState, handlers: holdHandlers } = useHoldToRecord({
    holdThresholdMs: 500,
    minCommitDurationMs: 1000,
    onShortTap: () => {
      hapticLight();
    },
    onCommit: ({ transcript, durationSec }) => {
      usePendingRecordingStore.getState().setDraft({
        transcript,
        durationSec,
        createdAt: new Date().toISOString(),
      });
      router.push("/onboarding/review");
    },
  });

  // Once the user has actually started a recording, the teaching
  // spotlight has done its job — retire it for the rest of the session.
  useEffect(() => {
    if (holdState.isRecording && !hasHeldOnce) setHasHeldOnce(true);
  }, [holdState.isRecording, hasHeldOnce]);

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[colors.accent + "1E", colors.accent + "00"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={1} />
          </View>

          <Animated.View
            entering={FadeIn.duration(280)}
            exiting={FadeOut.duration(180)}
            style={styles.flex}
          >
            <View style={styles.idleContent}>
              <Text style={[styles.idleHeadline, { color: colors.textPrimary }]}>{headline}</Text>
              <Text style={[styles.idleSub, { color: colors.textSecondary }]}>
                Speak in your own words. Sympnote keeps your transcript safe on your device.
              </Text>
            </View>

            <View style={styles.holdArea}>
              <HoldButton
                onPressIn={holdHandlers.onPressIn}
                onPressOut={holdHandlers.onPressOut}
                isRecording={holdState.isRecording}
                highlight={!hasHeldOnce}
                reduced={reduced}
              />
              {!hasHeldOnce && <TeachingTip />}
            </View>
          </Animated.View>
        </SafeAreaView>

        <HoldToRecordOverlay
          visible={holdState.isRecording}
          mode="recording"
          liveTranscript={holdState.liveTranscript}
          durationSec={holdState.durationSec}
          volume={holdState.volume}
        />
      </View>
    </SceneTransition>
  );
};

interface HoldButtonProps {
  onPressIn: () => void;
  onPressOut: () => void;
  isRecording: boolean;
  highlight: boolean;
  reduced: boolean;
}

const HoldButton: React.FC<HoldButtonProps> = ({
  onPressIn,
  onPressOut,
  isRecording,
  highlight,
  reduced,
}) => {
  const styles = useStyles();
  // Spotlight ring breathes only while the user hasn't held yet.
  const halo = useSharedValue(0);
  useEffect(() => {
    if (reduced || !highlight || isRecording) {
      halo.value = 0;
      return;
    }
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [highlight, isRecording, reduced, halo]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + halo.value * 0.4,
    transform: [{ scale: 1 + halo.value * 0.18 }],
  }));

  return (
    <View style={styles.holdButtonWrap}>
      {highlight && <Animated.View pointerEvents="none" style={[styles.holdHalo, haloStyle]} />}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel="Hold to record your voice note"
        accessibilityHint="Press and hold to record. Release to save."
        style={styles.holdButton}
      >
        <LinearGradient
          colors={["#4DB8B0", "#2C6E6B"]}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Mic size={moderateScale(36)} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
    </View>
  );
};

const TeachingTip: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Animated.View
      entering={FadeIn.duration(420).delay(180)}
      exiting={FadeOut.duration(180)}
      style={styles.teachingWrap}
    >
      <Text style={[styles.teachingText, { color: colors.textPrimary }]}>
        Press and hold the mic
      </Text>
      <Text style={[styles.teachingHint, { color: colors.textSecondary }]}>
        Release when you're done. Sympnote keeps it safe on your device.
      </Text>
    </Animated.View>
  );
};

export default ScreenFirstRecording;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  aurora: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(320),
    overflow: "hidden",
  },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressSlot: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
  },
  idleContent: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s5,
  },
  idleHeadline: {
    ...theme.typography.h1,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(28),
    lineHeight: fontScale(36),
    letterSpacing: -0.6,
    textAlign: "center",
  },
  idleSub: {
    ...theme.typography.body,
    textAlign: "center",
    marginTop: moderateScale(10),
    lineHeight: fontScale(22),
    paddingHorizontal: theme.spacing.s4,
  },
  holdArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s6,
  },
  holdButtonWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: moderateScale(132),
    height: moderateScale(132),
  },
  holdHalo: {
    position: "absolute",
    width: moderateScale(132),
    height: moderateScale(132),
    borderRadius: moderateScale(66),
    backgroundColor: "rgba(246,192,106,0.32)",
  },
  holdButton: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#2C6E6B",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  teachingWrap: {
    marginTop: verticalScale(28),
    alignItems: "center",
    paddingHorizontal: theme.spacing.s6,
  },
  teachingText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: verticalScale(8),
  },
  teachingHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
    textAlign: "center",
    marginTop: verticalScale(4),
    fontStyle: "italic",
    maxWidth: moderateScale(280),
  },
}));
