import React, { useEffect, useRef, useState } from "react";
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
import { CheckCircle2, Lock, Sparkles } from "lucide-react-native";
import { BlurView } from "expo-blur";
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
import { RedFlagAlert } from "@/components/clinical/RedFlagAlert";
import { StructuredHeaderCard } from "@/components/clinical/StructuredHeaderCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { generateBrief, structureTranscript } from "@/services/ai";
import { uuid } from "@/utils/uuid";
import { hapticLight } from "@/services/haptics";
import type {
  Brief,
  BriefContent,
  PrepGap,
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
 * Sub-copy under the "Here's what your doctor will see" headline.
 * Closes the loop on the prep-gap problem-anchor: when the user said
 * they often forget at the doctor's office, the brief reveal directly
 * addresses that pain ("you said you forget — here's everything you
 * mentioned"). Falls back to a generic descriptor when the user
 * reported they're already prepared (no pain to validate).
 */
const readySubCopy = (
  prepGap: PrepGap | undefined,
  content: BriefContent | null,
): string => {
  const captured =
    (content?.topConcerns.length ?? 0) +
    (content?.questions.length ?? 0) +
    (content?.patterns.length ?? 0) +
    (content?.flags.length ?? 0);
  if (prepGap === "often") {
    return captured > 0
      ? `You said you usually leave wishing you'd said more. This brief captured ${captured} things from one note.`
      : "You said you usually leave wishing you'd said more. This brief captures what you mentioned, ready for the visit.";
  }
  if (prepGap === "sometimes") {
    return captured > 0
      ? `You said something always slips. This brief pinned ${captured} things so nothing does.`
      : "You said something always slips. This brief pins what matters so nothing does.";
  }
  return "Built from what you just said. Skim it the way they will — concerns first, then the questions you should ask.";
};

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

  // Personalization lives in the draft store during onboarding (see
  // wide-scope deferred-commit pattern). Reads here so AI calls have
  // the user's clinical priors before the paywall commits anything.
  const profile = usePendingRecordingStore((s) => s.personalization);
  // Snapshot the draft at mount. The AI run reads from this; later
  // mounts after re-entry restore from `pendingRecording`/`pendingBrief`
  // instead of re-running the AI.
  const [draft] = useState(() => usePendingRecordingStore.getState().draft);

  const [phase, setPhase] = useState<Phase>("loading");
  const [briefId, setBriefId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<BriefContent | null>(null);
  // Structured fields from `structureTranscript` — drive the
  // "your note, parsed" header card in BriefReveal. Visceral
  // counterpart to the brief's interpretive cards.
  const [previewStructured, setPreviewStructured] = useState<StructuredEntry | null>(null);

  // Defensive — if a user lands here with no draft AND no already-run
  // artifacts, bounce back. Runs once on mount only.
  useEffect(() => {
    const { pendingRecording, pendingBrief } = usePendingRecordingStore.getState();
    if (!draft && !pendingRecording && !pendingBrief) {
      router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Idempotency: if we already have artifacts for THIS draft (from a
    // prior mount of this screen — user navigated back then forward),
    // restore them and skip the AI call. Prevents duplicate generations
    // and wasted API spend.
    const existing = usePendingRecordingStore.getState();
    if (
      existing.pendingRecording &&
      existing.pendingBrief &&
      (!draft || existing.pendingRecording.createdAt === draft.createdAt)
    ) {
      setBriefId(existing.pendingBrief.id);
      setPreviewContent(existing.pendingBrief.content);
      setPreviewStructured(existing.pendingRecording.structured);
      setPhase("ready");
      return;
    }

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

      const fullRecording: Recording = {
        ...provisional,
        structured,
        tags,
      };

      let brief: Brief | null = null;
      if (briefResult.status === "fulfilled") {
        brief = {
          id: uuid(),
          generatedAt: new Date().toISOString(),
          windowStart: createdAt,
          windowEnd: createdAt,
          sourceRecordingIds: [recId],
          content: briefResult.value,
          clinicianIds: [],
          title: "Your first brief",
        };
      }

      // Hold artifacts in the draft store. They land in the persisted
      // stores only when `usePaywallPurchase` runs `commitDraft` after
      // a successful subscribe — see the wide-scope commit pipeline.
      usePendingRecordingStore.getState().setArtifacts(fullRecording, brief);

      if (!cancelled) {
        setPreviewStructured(structured);
        if (brief) {
          setBriefId(brief.id);
          setPreviewContent(brief.content);
        }
        setPhase("ready");
      }
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
            {phase === "loading" || !previewContent ? (
              <>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>
                  Watch your note{"\n"}
                  <Text style={{ fontStyle: "italic", color: colors.accent }}>
                    become a brief
                  </Text>
                  .
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  Sympnote is reading what you said and distilling the clinical signal. Takes
                  a few seconds — this is the loop you'll use whenever you need a doctor-ready
                  summary.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>
                  Here's what your{"\n"}
                  <Text style={{ fontStyle: "italic", color: colors.accent }}>
                    doctor will see
                  </Text>
                  .
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  {readySubCopy(profile?.prepGap, previewContent)}
                </Text>
              </>
            )}

            {phase === "loading" ? (
              <LoadingOrb reduced={reduced} colors={colors} styles={styles} />
            ) : previewContent ? (
              <BriefReveal
                content={previewContent}
                structured={previewStructured}
                reduced={reduced}
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
              <PrimaryButton
                label={previewContent ? "Lock it in" : "See my plan"}
                onPress={onContinue}
              />
            </View>
          )}
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

// ─── Loading orb ────────────────────────────────────────────────────────
// Sequenced loading beats — instead of a single static "Reading your
// note…", the line cycles through phases that mirror what the AI is
// actually doing. Makes the wait feel like work being done, not a
// spinner stalling. Cycles slowly enough to read each line.
const LOADING_BEATS = [
  "Reading your note…",
  "Pulling out concerns…",
  "Drafting questions for your doctor…",
  "Almost done.",
];

const LoadingOrb: React.FC<{
  reduced: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}> = ({ reduced, colors, styles }) => {
  const pulse = useSharedValue(0);
  const [beat, setBeat] = useState(0);

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

  // Advance one beat every 1.6s, holding on the last one (don't wrap).
  useEffect(() => {
    const id = setInterval(() => {
      setBeat((b) => Math.min(b + 1, LOADING_BEATS.length - 1));
    }, 1600);
    return () => clearInterval(id);
  }, []);

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
      <Animated.Text
        key={beat}
        entering={FadeIn.duration(260)}
        style={[styles.loadingText, { color: colors.textSecondary }]}
      >
        {LOADING_BEATS[beat]}
      </Animated.Text>
    </Animated.View>
  );
};

// ─── Brief reveal — sequenced multi-card payoff ─────────────────────────
// Sequence: structured header (the AI's parsed reading of the user's
// own words) → red-flag alert (when present) → ASK YOUR DOCTOR
// (questions) → PATTERNS (when present) → insights count-up pill.
//
// The structured header replaces the older "TOP CONCERN" card. From
// a single recording the brief's topConcerns/patterns are partly
// forced; the structured fields (severity, body system, symptoms,
// urgency) come straight from what the user just said and read as
// "AI is reading my words" — the harder visceral hit that earns the
// paywall ask. Same component drives /record's confirm phase so the
// onboarding aha matches what every later recording will look like.

const BriefReveal: React.FC<{
  content: BriefContent;
  structured: StructuredEntry | null;
  reduced: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}> = ({ content, structured, reduced, colors, styles }) => {
  const questions = content.questions.slice(0, 3);
  const patterns = content.patterns.slice(0, 2);
  const totalInsights =
    content.topConcerns.length +
    content.questions.length +
    content.patterns.length +
    content.flags.length;

  const d = (n: number) => (reduced ? 0 : n);

  // Count-up on the insights total — pill fades in at ~640ms, then
  // the number ticks from 0 to total over 700ms (~30 frames). Single
  // animated number lands harder than four micro-counters.
  const [countProgress, setCountProgress] = useState(reduced ? 1 : 0);
  const countUpRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (reduced) {
      setCountProgress(1);
      return;
    }
    setCountProgress(0);
    const startDelay = setTimeout(() => {
      const start = Date.now();
      const dur = 700;
      const id = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(1, elapsed / dur);
        setCountProgress(p);
        if (p >= 1) clearInterval(id);
      }, 33);
      countUpRef.current = id;
    }, 1100);
    return () => {
      clearTimeout(startDelay);
      if (countUpRef.current) clearInterval(countUpRef.current);
    };
  }, [totalInsights, reduced]);
  const animatedCount = Math.round(countProgress * totalInsights);

  // Show the structured-fields card whenever we have meaningful data
  // (any of severity, body system, or symptoms). Falls back to the
  // brief summary if the structuring call failed but the brief one
  // succeeded — keeps the first slot occupied either way.
  const hasStructured =
    !!structured &&
    (structured.severity > 0 ||
      structured.bodySystem.length > 0 ||
      structured.symptoms.length > 0);

  return (
    <View style={styles.revealStack}>
      {hasStructured && structured ? (
        <Animated.View
          entering={FadeInDown.delay(d(60)).duration(420).easing(Easing.out(Easing.cubic))}
        >
          <StructuredHeaderCard structured={structured} />
        </Animated.View>
      ) : content.summary ? (
        <Animated.View
          entering={FadeInDown.delay(d(60)).duration(420).easing(Easing.out(Easing.cubic))}
          style={[
            styles.revealCard,
            { backgroundColor: colors.bgSurface, borderColor: colors.accent + "55" },
            shadows.card,
          ]}
        >
          <LinearGradient
            colors={[colors.accent + "14", colors.accent + "00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.previewWash}
            pointerEvents="none"
          />
          <Text style={[styles.previewEyebrow, { color: colors.accent }]}>
            SUMMARY
          </Text>
          <Text
            style={[styles.previewBody, { color: colors.textPrimary, marginTop: 6 }]}
            numberOfLines={5}
          >
            {content.summary}
          </Text>
        </Animated.View>
      ) : null}

      {structured && structured.redFlags.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(d(180)).duration(420).easing(Easing.out(Easing.cubic))}
        >
          <RedFlagAlert items={structured.redFlags} />
        </Animated.View>
      ) : null}

      {/* Locked section — questions + patterns sit behind a soft blur
          and a "Subscribe to unlock" badge. The user sees enough shape
          to know there's content without being able to read it. The
          structured header above and the insights count below stay
          crisp so the value is teased, not hidden entirely. */}
      {(questions.length > 0 || patterns.length > 0) && (
        <View style={styles.lockedSection}>
          {questions.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(d(280)).duration(420).easing(Easing.out(Easing.cubic))}
              style={[
                styles.revealCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
                shadows.card,
              ]}
            >
              <Text style={[styles.previewEyebrow, { color: colors.accent }]}>
                ASK YOUR DOCTOR
              </Text>
              <View style={styles.questionsList}>
                {questions.map((q, i) => (
                  <View key={`q-${i}`} style={styles.questionRow}>
                    <CheckCircle2
                      size={moderateScale(14)}
                      color={colors.accent}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[styles.questionText, { color: colors.textPrimary }]}
                      numberOfLines={3}
                    >
                      {q}
                    </Text>
                  </View>
                ))}
              </View>
              {content.questions.length > questions.length ? (
                <Text style={[styles.questionsMore, { color: colors.textTertiary }]}>
                  +{content.questions.length - questions.length} more inside
                </Text>
              ) : null}
            </Animated.View>
          ) : null}

          {patterns.length > 0 ? (
            <Animated.View
              entering={FadeInDown.delay(d(480)).duration(420).easing(Easing.out(Easing.cubic))}
              style={[
                styles.revealCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
                shadows.card,
              ]}
            >
              <Text style={[styles.previewEyebrow, { color: colors.accent }]}>
                PATTERNS WE NOTICED
              </Text>
              <View style={styles.questionsList}>
                {patterns.map((p, i) => (
                  <View key={`p-${i}`} style={styles.questionRow}>
                    <View style={[styles.patternDot, { backgroundColor: colors.accent }]} />
                    <Text
                      style={[styles.questionText, { color: colors.textPrimary }]}
                      numberOfLines={3}
                    >
                      {p}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* Frosted blur over the cards — readers see shape, not text.
              `intensity` is tuned to obscure copy without flattening the
              card silhouettes entirely (still feels like content, just
              gated). */}
          <BlurView
            intensity={42}
            tint="light"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Centered lock badge — the unlock CTA inside the blur. The
              tap target is the bottom Continue button, not this badge,
              but the badge tells the user where the door is. */}
          <Animated.View
            entering={FadeIn.delay(d(560)).duration(360)}
            pointerEvents="none"
            style={styles.lockBadgeWrap}
          >
            <View
              style={[styles.lockBadge, { backgroundColor: colors.accent }]}
            >
              <Lock size={moderateScale(12)} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.lockBadgeText}>
                Subscribe to see your doctor questions
              </Text>
            </View>
          </Animated.View>
        </View>
      )}

      <Animated.View
        entering={FadeInDown.delay(d(640)).duration(420).easing(Easing.out(Easing.cubic))}
        style={[styles.insightsPill, { backgroundColor: colors.accent + "10" }]}
      >
        <Sparkles size={moderateScale(12)} color={colors.accent} strokeWidth={2.2} />
        <Text style={[styles.insightsPillText, { color: colors.accent }]}>
          {animatedCount} insights inside
        </Text>
      </Animated.View>
    </View>
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
  // ── Brief reveal (sequenced)
  revealStack: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(10),
  },
  revealCard: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  questionsList: {
    marginTop: moderateScale(8),
    gap: moderateScale(8),
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(8),
  },
  questionText: {
    flex: 1,
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
    marginTop: 1,
  },
  questionsMore: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    fontStyle: "italic",
    marginTop: moderateScale(8),
  },
  patternDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginTop: moderateScale(7),
  },
  insightsPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: theme.radius.full,
    marginTop: moderateScale(4),
  },
  insightsPillText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 0.3,
  },
  // ── Locked tease (questions + patterns behind blur + badge)
  lockedSection: {
    position: "relative",
    gap: moderateScale(10),
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  lockBadgeWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: theme.radius.full,
    ...theme.shadows.accentGlow,
  },
  lockBadgeText: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
    letterSpacing: -0.05,
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
