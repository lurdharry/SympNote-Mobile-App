import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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
import { HoldButton } from "@/components/onboarding/summary/HoldButton";
import { TeachingTip } from "@/components/onboarding/summary/TeachingTip";
import { HoldToRecordOverlay } from "@/components/home/HoldToRecordOverlay";
import { useHoldToRecord } from "@/hooks/useHoldToRecord";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { hapticLight } from "@/services/haptics";
import { buildPersonalizationProfile } from "@/utils/personalization";

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

  const personalization = usePendingRecordingStore((s) => s.personalization);
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
      // Build the typed personalization from raw onboarding answers
      // before pushing to review/first-brief — the AI patient context
      // and downstream copy callbacks (paywall hero, first-brief sub)
      // all read from `personalization`. We hold this in the draft
      // store (non-persisted) until the paywall commits everything
      // on subscribe — see the wide-scope commit pipeline.
      const { answers, setPersonalization } = usePendingRecordingStore.getState();
      setPersonalization(buildPersonalizationProfile(answers, answers.focus, []));

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
            <OnboardingProgress value={0.7} />
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
}));
