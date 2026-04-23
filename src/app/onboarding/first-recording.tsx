import React from "react";
import { Dimensions, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { makeStyles, moderateScale, spacing, typography, useTheme, verticalScale } from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { WaveformCanvas } from "@/components/animated/WaveformCanvas";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useOnboardingRecorder } from "@/hooks/useOnboardingRecorder";
import { useProfileStore } from "@/stores/useProfileStore";
import { RECORDING_PROMPTS } from "@/constants/prompts";
import { MicOrb } from "@/components/first-recording/MicOrb";
import { TranscriptCard } from "@/components/first-recording/TranscriptCard";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

const WAVE_WIDTH = Math.min(Dimensions.get("window").width - 64, 320);

const primaryLabel = (phase: "idle" | "recording" | "ready"): string => {
  switch (phase) {
    case "ready":
      return "Continue";
    case "recording":
      return "Tap when you're done";
    default:
      return "Tap mic to begin";
  }
};

const ScreenFirstRecording: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const personalization = useProfileStore((s) => s.personalization);
  const micHeadline = personalization?.firstRecordingPrompt ?? "What's been going on with you?";

  const { phase, promptIdx, transcript, duration, volume, onMic, saveFirstRecording } =
    useOnboardingRecorder();

  const onContinue = () => {
    if (phase !== "ready") return;
    saveFirstRecording();
    router.push("/onboarding/summary");
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={1} />
          </View>

          <View style={styles.content}>
            <Text style={[typography.h1, { color: colors.textPrimary, textAlign: "center" }]}>
              {micHeadline}
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 8,
                },
              ]}
            >
              Speak in your own words. Sympnote keeps your transcript safe on your device.
            </Text>

            <View style={styles.micArea}>
              <MicOrb phase={phase} onPress={onMic} reduced={reduced} />

              <View style={styles.subSlot}>
                {phase === "idle" && (
                  <Text
                    key={promptIdx}
                    style={[
                      typography.body,
                      {
                        color: colors.textTertiary,
                        textAlign: "center",
                        fontStyle: "italic",
                      },
                    ]}
                  >
                    {RECORDING_PROMPTS[promptIdx]}
                  </Text>
                )}
                {phase === "recording" && (
                  <WaveformCanvas
                    level={volume}
                    width={WAVE_WIDTH}
                    height={verticalScale(48)}
                    barCount={32}
                    colors={["#C45C3F", "rgba(196,92,63,0.08)"]}
                  />
                )}
                {phase === "ready" && (
                  <View style={styles.capturedRow}>
                    <View style={[styles.capturedDot, { backgroundColor: colors.success }]}>
                      <Check size={moderateScale(12)} color="#FFFFFF" strokeWidth={3} />
                    </View>
                    <Text
                      style={[
                        typography.body,
                        {
                          color: colors.textSecondary,
                          fontFamily: "DMSans_500Medium",
                        },
                      ]}
                    >
                      Got it. {duration}s captured.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {phase === "recording" && !!transcript && (
              <View style={styles.transcriptSlot}>
                <TranscriptCard text={transcript} autoScrollToEnd />
              </View>
            )}
          </View>

          <View style={styles.ctaArea}>
            <PrimaryButton
              label={primaryLabel(phase)}
              disabled={phase !== "ready"}
              onPress={onContinue}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenFirstRecording;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
  },
  micArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.s6,
  },
  subSlot: {
    height: verticalScale(60),
    marginTop: theme.spacing.s5,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.s4,
  },
  capturedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  capturedDot: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    alignItems: "center",
    justifyContent: "center",
  },
  transcriptSlot: {
    flex: 1,
    minHeight: verticalScale(110),
    marginTop: theme.spacing.s4,
  },
  ctaArea: {
    paddingHorizontal: spacing.s6,
    paddingTop: 8,
    paddingBottom: spacing.s4,
  },
}));
