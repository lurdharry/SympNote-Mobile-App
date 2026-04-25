import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Mic, Pencil } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { SympnoteSprite } from "@/components/onboarding/SympnoteSprite";
import { HoldToRecordOverlay } from "@/components/home/HoldToRecordOverlay";
import { useHoldToRecord } from "@/hooks/useHoldToRecord";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";

type Mode = "idle" | "review";

const ScreenFirstRecording: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const personalization = useProfileStore((s) => s.personalization);
  const headline = personalization?.firstRecordingPrompt ?? "What's been going on with you?";

  const [mode, setMode] = useState<Mode>("idle");
  const [postCapture, setPostCapture] = useState<{
    transcript: string;
    durationSec: number;
    createdAt: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
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
      setPostCapture({ transcript, durationSec, createdAt: new Date().toISOString() });
      setEditValue(transcript);
      setMode("review");
    },
  });

  // Once the user has actually started a recording, the teaching
  // spotlight has done its job — retire it for the rest of the session.
  useEffect(() => {
    if (holdState.isRecording && !hasHeldOnce) setHasHeldOnce(true);
  }, [holdState.isRecording, hasHeldOnce]);

  const onContinue = () => {
    if (!postCapture) return;
    const text = editValue.trim() || postCapture.transcript;
    usePendingRecordingStore.getState().setDraft({
      transcript: text,
      durationSec: postCapture.durationSec,
      createdAt: postCapture.createdAt,
    });
    router.push("/onboarding/paywall");
  };

  const onReRecord = () => {
    hapticLight();
    setMode("idle");
    setPostCapture(null);
    setEditValue("");
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        {/* Ambient aurora — softens the screen, ties it to the rest
            of onboarding. Visible in both modes. */}
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

          {mode === "idle" && (
            <Animated.View
              key="idle"
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
                {!hasHeldOnce && <TeachingTip reduced={reduced} />}
              </View>
            </Animated.View>
          )}

          {mode === "review" && postCapture && (
            <Animated.View
              key="review"
              entering={FadeIn.duration(320)}
              exiting={FadeOut.duration(180)}
              style={styles.flex}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.flex}
              >
                <ScrollView
                  contentContainerStyle={styles.reviewScroll}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Animated.View
                    entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}
                    style={[
                      styles.eyebrow,
                      {
                        backgroundColor: colors.accent + "14",
                        borderColor: colors.accent + "33",
                      },
                    ]}
                  >
                    <View style={[styles.eyebrowDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.eyebrowText, { color: colors.accent }]}>
                      YOUR FIRST NOTE
                    </Text>
                  </Animated.View>

                  <Animated.Text
                    entering={FadeInDown.duration(520).delay(80).easing(Easing.out(Easing.cubic))}
                    style={[styles.headline, { color: colors.textPrimary }]}
                  >
                    Your next visit,{"\n"}
                    <Text style={{ fontStyle: "italic", color: colors.accent }}>
                      already prepared
                    </Text>
                    .
                  </Animated.Text>

                  <Animated.Text
                    entering={FadeInDown.duration(520).delay(160).easing(Easing.out(Easing.cubic))}
                    style={[styles.sub, { color: colors.textSecondary }]}
                  >
                    We'll turn what you just said into a clinical note your doctor can act on.
                  </Animated.Text>

                  <Animated.View
                    entering={FadeInDown.duration(560).delay(240).easing(Easing.out(Easing.cubic))}
                  >
                    <TranscriptQuote
                      transcript={editValue}
                      durationSec={postCapture.durationSec}
                      onChangeText={setEditValue}
                      onReRecord={onReRecord}
                    />
                  </Animated.View>
                </ScrollView>
              </KeyboardAvoidingView>

              <View style={styles.ctaArea}>
                <PrimaryButton label="Make my story doctor-ready" onPress={onContinue} />
              </View>
            </Animated.View>
          )}
        </SafeAreaView>

        {/* Hold-recording overlay — same one used on home. */}
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

// ── Hold button — large, centered, with a teaching spotlight ──────

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

// ── Teaching tooltip — shown until the user has held once ────────

interface TeachingTipProps {
  reduced: boolean;
}

const TeachingTip: React.FC<TeachingTipProps> = ({ reduced }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Animated.View
      entering={FadeIn.duration(420).delay(180)}
      exiting={FadeOut.duration(180)}
      style={styles.teachingWrap}
    >
      {/* <SympnoteSprite pose="listening" reduced={reduced} size={moderateScale(140)} /> */}
      <Text style={[styles.teachingText, { color: colors.textPrimary }]}>
        Press and hold the mic
      </Text>
      <Text style={[styles.teachingHint, { color: colors.textSecondary }]}>
        Release when you're done. Sympnote keeps it safe on your device.
      </Text>
    </Animated.View>
  );
};

// ── Editorial transcript quote — copied from the old summary ──────

interface TranscriptQuoteProps {
  transcript: string;
  durationSec: number;
  onChangeText: (next: string) => void;
  onReRecord: () => void;
}

const TranscriptQuote: React.FC<TranscriptQuoteProps> = ({
  transcript,
  durationSec,
  onChangeText,
  onReRecord,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.quoteCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <LinearGradient
        colors={[colors.accent + "18", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.quoteWash}
      />
      <Text style={[styles.quoteGlyph, { color: colors.accent + "55" }]}>&ldquo;</Text>
      <TextInput
        value={transcript}
        onChangeText={onChangeText}
        multiline
        scrollEnabled
        textAlignVertical="top"
        style={[styles.quoteText, styles.quoteInput, { color: colors.textPrimary }]}
        placeholder="Your words will appear here…"
        placeholderTextColor={colors.textTertiary}
      />
      <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
        <View style={[styles.metaChip, { backgroundColor: colors.bgMuted }]}>
          <Mic size={moderateScale(10)} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
            {formatDuration(durationSec)}
          </Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: colors.bgMuted }]}>
          <Clock size={moderateScale(10)} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>Just now</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onReRecord} hitSlop={8}>
          <Text style={[styles.reRecord, { color: colors.accent }]}>Re-record</Text>
        </Pressable>
      </View>
      <View style={styles.editHintRow}>
        <Pencil size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2} />
        <Text style={[styles.editHintText, { color: colors.textTertiary }]}>
          Tap the text above to edit
        </Text>
      </View>
    </View>
  );
};

const formatDuration = (s: number): string => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
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
  // ── Idle (pre-record) ───────────────────────────────────────────
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
  // ── Review (post-release) ───────────────────────────────────────
  reviewScroll: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrowDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  eyebrowText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  headline: {
    ...theme.typography.h1,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.8,
    fontSize: fontScale(32),
    lineHeight: fontScale(38),
    marginTop: spacing.s4,
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(10),
    marginBottom: theme.spacing.s6,
    lineHeight: fontScale(22),
    maxWidth: moderateScale(340),
  },
  // ── Quote card ──────────────────────────────────────────────────
  quoteCard: {
    position: "relative",
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(12),
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  quoteWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(70),
  },
  quoteGlyph: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(64),
    lineHeight: fontScale(64),
    height: fontScale(44),
    marginTop: -moderateScale(4),
    marginLeft: -moderateScale(2),
  },
  quoteText: {
    ...theme.typography.body,
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(17),
    lineHeight: fontScale(26),
    letterSpacing: -0.1,
  },
  quoteInput: {
    maxHeight: verticalScale(200),
    padding: 0,
    margin: 0,
    marginTop: moderateScale(4),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: verticalScale(14),
    paddingTop: verticalScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
  },
  metaChipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.1,
  },
  reRecord: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    textDecorationLine: "underline",
  },
  editHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    marginTop: verticalScale(8),
  },
  editHintText: {
    ...theme.typography.caption,
    fontStyle: "italic",
  },
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s4,
  },
}));
