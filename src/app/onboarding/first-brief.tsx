import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
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
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { generateBrief, structureTranscript } from "@/services/ai";
import { uuid } from "@/utils/uuid";
import { hapticLight } from "@/services/haptics";
import type {
  Brief,
  BriefContent,
  Recording,
  StructuredEntry,
} from "@/stores/types";

const EMPTY_STRUCTURED: StructuredEntry = {
  symptoms: [],
  location: "",
  duration: "",
  severity: 0,
  triggers: [],
  medications: [],
  notes: "",
  bodySystem: "",
  redFlags: [],
  urgency: "routine",
};

type Phase = "loading" | "ready";

/**
 * The aha moment in onboarding — runs the AI on the user's first
 * recording and shows them their first synthesised brief before they
 * hit the paywall. Two AI calls fire in parallel: structureTranscript
 * (for the recording's clinical fields) and generateBrief (for the
 * brief content). When both settle, the recording + brief are saved
 * and the pending draft is cleared so paywall's commitDraft becomes
 * a no-op.
 *
 * Failure-tolerant: if the brief AI call fails the user still
 * advances with their recording saved — the empty-state retry path
 * on the brief detail handles regeneration later. If both fail the
 * recording is saved with empty structured fields and no brief is
 * created; user moves on cleanly.
 */
const ScreenFirstBrief: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const profile = useProfileStore((s) => s.personalization);
  const draft = usePendingRecordingStore((s) => s.draft);

  const [phase, setPhase] = useState<Phase>("loading");
  const [briefId, setBriefId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<BriefContent | null>(null);

  // Defensive — if a user lands here with no draft (back nav, hot
  // reload, etc.), bounce back to the recording surface.
  useEffect(() => {
    if (!draft) router.back();
  }, [draft, router]);

  useEffect(() => {
    if (!draft) return;
    let cancelled = false;

    const run = async () => {
      const recId = uuid();
      const createdAt = draft.createdAt;

      const provisional: Recording = {
        id: recId,
        createdAt,
        durationSec: draft.durationSec,
        transcript: draft.transcript,
        structured: EMPTY_STRUCTURED,
        tags: [],
      };

      const [structuredResult, briefResult] = await Promise.allSettled([
        structureTranscript(draft.transcript, profile),
        generateBrief({
          recordings: [provisional],
          windowLabel: "Your first note",
          profile,
        }),
      ]);

      if (cancelled) return;

      const structured =
        structuredResult.status === "fulfilled"
          ? structuredResult.value
          : EMPTY_STRUCTURED;
      const tags = structured.symptoms.filter(Boolean).slice(0, 2);

      useRecordingsStore.getState().add({
        ...provisional,
        structured,
        tags,
      });

      if (briefResult.status === "fulfilled") {
        const brief: Brief = {
          id: uuid(),
          generatedAt: new Date().toISOString(),
          windowStart: createdAt,
          windowEnd: createdAt,
          sourceRecordingIds: [recId],
          content: briefResult.value,
          clinicianIds: [],
          title: "Your first brief",
        };
        useBriefsStore.getState().add(brief);
        if (!cancelled) {
          setBriefId(brief.id);
          setPreviewContent(brief.content);
        }
      }

      // Clear the pending draft — paywall's commitDraft sees nothing
      // to commit and no-ops.
      usePendingRecordingStore.getState().clear();

      if (!cancelled) setPhase("ready");
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSeeBrief = () => {
    if (!briefId) return;
    hapticLight();
    router.push(`/brief/${briefId}`);
  };

  const onContinue = () => {
    hapticLight();
    router.push("/onboarding/paywall");
  };

  if (!draft) return null;

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <View style={{ width: moderateScale(40) }} />
            <View style={{ width: moderateScale(40) }} />
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={0.95} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR FIRST BRIEF</Text>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Watch your note{"\n"}
              <Text style={{ fontStyle: "italic", color: colors.accent }}>
                become a brief
              </Text>
              .
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Sympnote is reading what you said and distilling the clinical signal. Takes a
              few seconds — this is the loop you'll use whenever you need a doctor-ready
              summary.
            </Text>

            {phase === "loading" ? (
              <LoadingOrb reduced={reduced} colors={colors} styles={styles} />
            ) : previewContent ? (
              <PreviewCard
                content={previewContent}
                colors={colors}
                styles={styles}
              />
            ) : (
              <SampleBriefCard colors={colors} styles={styles} />
            )}
          </ScrollView>

          {phase === "ready" && (
            <View style={styles.cta}>
              {previewContent && briefId && (
                <Pressable
                  onPress={onSeeBrief}
                  style={styles.seeBrief}
                  accessibilityRole="button"
                  accessibilityLabel="See full brief"
                >
                  <Text style={[styles.seeBriefText, { color: colors.accent }]}>
                    See the full brief ›
                  </Text>
                </Pressable>
              )}
              <PrimaryButton label="See my plan" onPress={onContinue} />
            </View>
          )}
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

// ─── Loading orb ────────────────────────────────────────────────────────

const LoadingOrb: React.FC<{
  reduced: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}> = ({ reduced, colors, styles }) => {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.5,
    transform: [{ scale: 0.85 + pulse.value * 0.25 }],
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.orbWrap}>
      <Animated.View style={[styles.orbRing, ringStyle]}>
        <LinearGradient
          colors={[colors.accent + "33", colors.accent + "00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[styles.orbCore, { backgroundColor: colors.accent }]}>
        <Animated.View style={sparkleStyle}>
          <Sparkles size={moderateScale(28)} color="#FFFFFF" strokeWidth={2.2} />
        </Animated.View>
      </View>
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        Reading your note…
      </Text>
    </Animated.View>
  );
};

// ─── Preview card ───────────────────────────────────────────────────────

const PreviewCard: React.FC<{
  content: BriefContent;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}> = ({ content, colors, styles }) => {
  const topConcern = content.topConcerns[0];
  const summary = content.summary;
  const showConcern = !!topConcern;
  return (
    <Animated.View
      entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}
      style={[
        styles.previewCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent + "55" },
        shadows.card,
      ]}
    >
      <LinearGradient
        colors={[colors.accent + "12", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.previewWash}
        pointerEvents="none"
      />
      <Text style={[styles.previewEyebrow, { color: colors.accent }]}>
        {showConcern ? "TOP CONCERN" : "SUMMARY"}
      </Text>
      {showConcern ? (
        <>
          <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
            {topConcern.label}
          </Text>
          {topConcern.detail ? (
            <Text style={[styles.previewBody, { color: colors.textSecondary }]}>
              {topConcern.detail}
            </Text>
          ) : null}
        </>
      ) : (
        <Text
          style={[styles.previewBody, { color: colors.textPrimary, marginTop: 4 }]}
          numberOfLines={4}
        >
          {summary || "Sympnote read your note. Tap below to see the full brief."}
        </Text>
      )}
      <View style={styles.previewFoot}>
        <Sparkles size={moderateScale(11)} color={colors.accent} strokeWidth={2.2} />
        <Text style={[styles.previewFootText, { color: colors.accent }]}>
          {content.topConcerns.length + content.questions.length + content.flags.length}{" "}
          insights inside
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Sample brief — shown when AI fails, marked as an example ──────────
// Aha must never fail silently. If the live generation didn't return
// usable content we show a hand-written sample so the user still sees
// what a brief looks like before the paywall ask. Marked clearly so
// they don't think the example is theirs.

const SampleBriefCard: React.FC<{
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}> = ({ colors, styles }) => (
  <Animated.View
    entering={FadeIn.duration(280)}
    style={[
      styles.previewCard,
      { backgroundColor: colors.bgSurface, borderColor: colors.accent + "55" },
      shadows.card,
    ]}
  >
    <LinearGradient
      colors={[colors.accent + "12", colors.accent + "00"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.previewWash}
      pointerEvents="none"
    />
    <View style={styles.sampleBadgeRow}>
      <Text style={[styles.previewEyebrow, { color: colors.accent }]}>EXAMPLE BRIEF</Text>
      <View
        style={[styles.sampleBadge, { borderColor: colors.accent + "55" }]}
        pointerEvents="none"
      >
        <Text style={[styles.sampleBadgeText, { color: colors.accent }]}>
          What yours will look like
        </Text>
      </View>
    </View>
    <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
      Right knee pain, getting sharper
    </Text>
    <Text style={[styles.previewBody, { color: colors.textSecondary }]}>
      Worse climbing stairs, eases with rest — started ~10 days ago. Mild swelling overnight,
      no obvious trigger.
    </Text>
    <View style={styles.previewFoot}>
      <Sparkles size={moderateScale(11)} color={colors.accent} strokeWidth={2.2} />
      <Text style={[styles.previewFootText, { color: colors.accent }]}>
        + 4 patterns · 3 questions · 1 flag
      </Text>
    </View>
  </Animated.View>
);

export default ScreenFirstBrief;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressSlot: {
    paddingHorizontal: theme.spacing.s5,
    paddingTop: theme.spacing.s2,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s5,
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  headline: {
    ...typography.h1,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
    letterSpacing: -0.5,
    marginTop: 4,
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
    maxWidth: moderateScale(360),
  },
  // ── Loading orb
  orbWrap: {
    alignItems: "center",
    marginTop: theme.spacing.s8,
    gap: theme.spacing.s4,
  },
  orbRing: {
    position: "absolute",
    top: -moderateScale(20),
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(75),
    overflow: "hidden",
  },
  orbCore: {
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(43),
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.accentGlow,
  },
  loadingText: {
    ...typography.body,
    fontSize: fontScale(13),
    fontStyle: "italic",
  },
  // ── Preview card
  previewCard: {
    marginTop: theme.spacing.s6,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  previewWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(60),
  },
  previewEyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  previewTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(20),
    lineHeight: fontScale(26),
    letterSpacing: -0.3,
    marginTop: 4,
  },
  previewBody: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: 6,
  },
  previewFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    marginTop: theme.spacing.s3,
  },
  previewFootText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  sampleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },
  sampleBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  sampleBadgeText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(9),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  // ── CTA
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
    gap: theme.spacing.s2,
  },
  seeBrief: {
    alignItems: "center",
    paddingVertical: verticalScale(6),
  },
  seeBriefText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
}));
