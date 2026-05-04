import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fontScale,
  makeStyles,
  moderateScale,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { LoadingOrb } from "@/components/onboarding/first-brief/LoadingOrb";
import { BriefReveal } from "@/components/onboarding/first-brief/BriefReveal";
import { SampleBriefCard } from "@/components/onboarding/first-brief/SampleBriefCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { generateBrief, structureTranscript } from "@/services/ai";
import { uuid } from "@/utils/uuid";
import { hapticLight } from "@/services/haptics";
import type { Brief, BriefContent, PrepGap, Recording, StructuredEntry } from "@/stores/types";

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

type Phase = "loading" | "ready" | "failed";
// Why the run ended in `failed` — drives copy tailoring. `service`
// means the AI call rejected (network, quota, etc); `thin` means it
// resolved but the brief came back too sparse to be useful (commonly
// one short first note can't fill 3+ concerns, 4+ timeline items, etc).
type FailReason = "service" | "thin";

/**
 * A brief is considered "meaningful" when the model produced something
 * the user can actually look at — at minimum a summary OR at least one
 * topConcern. Thin returns (all-empty arrays + empty summary) commonly
 * happen on the very first note when there's not enough material to
 * fill the schema; rendering them looks like a broken success and
 * tanks the paywall conversion that follows. Treat them as a failure
 * with retry instead.
 */
const isBriefMeaningful = (content: BriefContent): boolean => {
  if (content.summary.trim().length > 0) return true;
  if (content.topConcerns.length > 0) return true;
  if (content.questions.length > 0) return true;
  return false;
};

/**
 * Sub-copy under the "A peek at your first brief" headline. Closes
 * the loop on the prep-gap problem-anchor (e.g. "you said you forget
 * — here's everything we pinned"), and signals that this is a
 * preview — the full brief with timeline, every question, and red
 * flags lives behind the next tap.
 */
const readySubCopy = (prepGap: PrepGap | undefined, content: BriefContent | null): string => {
  const captured =
    (content?.topConcerns.length ?? 0) +
    (content?.questions.length ?? 0) +
    (content?.patterns.length ?? 0) +
    (content?.flags.length ?? 0);
  if (prepGap === "often") {
    return captured > 0
      ? `You said you usually leave wishing you'd said more. ${captured} moments are already pinned. Timeline, every question, and red flags wait inside the full brief.`
      : "You said you usually leave wishing you'd said more. The full brief — timeline, every question, red flags — is one tap away.";
  }
  if (prepGap === "sometimes") {
    return captured > 0
      ? `You said something always slips. ${captured} pinned here so nothing does. Open the full brief for the timeline and the rest.`
      : "You said something always slips. The full brief pins it all — timeline, questions, flags. One tap away.";
  }
  return "A snapshot of what you said. Open the full brief for the timeline, every question, and red flags.";
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
 * Failure handling: when the brief AI call fails we surface a
 * dedicated "failed" phase that explains what happened, shows a
 * sample brief so the user still sees the value, and offers a
 * one-tap retry. Skipping forward (Continue anyway) is allowed but
 * de-emphasised — seeing their own brief is the strongest paywall
 * conversion driver, so the primary action pushes toward retry.
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
  const [failReason, setFailReason] = useState<FailReason>("service");
  const [briefId, setBriefId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<BriefContent | null>(null);
  // Structured fields from `structureTranscript` — drive the
  // "your note, parsed" header card in BriefReveal. Visceral
  // counterpart to the brief's interpretive cards.
  const [previewStructured, setPreviewStructured] = useState<StructuredEntry | null>(null);
  // Cancellation token shared across mounts. Set true by the cleanup
  // of the most recent invocation; new invocations reset it. Lets the
  // retry handler abort an in-flight run cleanly if the component
  // unmounts mid-retry.
  const cancelRef = useRef(false);

  // Defensive — if a user lands here with no draft AND no already-run
  // artifacts, bounce back. Runs once on mount only.
  useEffect(() => {
    const { pendingRecording, pendingBrief } = usePendingRecordingStore.getState();
    if (!draft && !pendingRecording && !pendingBrief) {
      router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The AI run, hoisted out of useEffect so the retry button can
  // re-invoke it without remounting the screen. Idempotent against
  // setArtifacts — re-running just overwrites pendingRecording/Brief.
  const runAi = useCallback(async () => {
    if (!draft) return;
    cancelRef.current = false;
    setPhase("loading");
    setPreviewContent(null);
    setBriefId(null);

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

    if (cancelRef.current) return;

    const structured =
      structuredResult.status === "fulfilled" ? structuredResult.value : EMPTY_STRUCTURED;
    const tags = structured.symptoms.filter(Boolean).slice(0, 2);

    const fullRecording: Recording = {
      ...provisional,
      structured,
      tags,
    };

    // Two distinct failure modes have to land in the same UX so the
    // user isn't stuck on a half-empty success screen:
    //   • briefResult rejected → service-side flap (network/quota)
    //   • briefResult fulfilled but content is thin → AI couldn't
    //     produce a meaningful brief from one short note
    let brief: Brief | null = null;
    let failure: FailReason | null = null;
    if (briefResult.status === "fulfilled") {
      if (isBriefMeaningful(briefResult.value)) {
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
      } else {
        failure = "thin";
      }
    } else {
      failure = "service";
    }

    // Hold artifacts in the draft store. They land in the persisted
    // stores only when `usePaywallPurchase` runs `commitDraft` after
    // a successful subscribe — see the wide-scope commit pipeline.
    usePendingRecordingStore.getState().setArtifacts(fullRecording, brief);

    if (cancelRef.current) return;
    setPreviewStructured(structured);
    if (brief) {
      setBriefId(brief.id);
      setPreviewContent(brief.content);
      setPhase("ready");
    } else {
      setFailReason(failure ?? "service");
      setPhase("failed");
    }
  }, [draft, profile]);

  useEffect(() => {
    // Idempotency: if we already have artifacts for THIS draft (from a
    // prior mount of this screen — user navigated back then forward),
    // restore them and skip the AI call. Prevents duplicate generations
    // and wasted API spend.
    const existing = usePendingRecordingStore.getState();
    // Same draft only counts as cached if the timestamp AND the
    // transcript match. If the user edited transcript on the review
    // screen, `setDraft` preserves the original `createdAt` (that's
    // the original capture time) but the text changes — and we want
    // to regenerate against the edited text, not restore the stale
    // brief built from the previous wording.
    const sameDraft =
      !draft ||
      (existing.pendingRecording &&
        existing.pendingRecording.createdAt === draft.createdAt &&
        existing.pendingRecording.transcript === draft.transcript);
    if (existing.pendingRecording && existing.pendingBrief && sameDraft) {
      setBriefId(existing.pendingBrief.id);
      setPreviewContent(existing.pendingBrief.content);
      setPreviewStructured(existing.pendingRecording.structured);
      setPhase("ready");
      return;
    }

    if (!draft) return;
    runAi();
    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRetry = () => {
    hapticLight();
    runAi();
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

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR FIRST BRIEF</Text>
            {phase === "loading" && (
              <>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>
                  Watch your note{"\n"}
                  <Text style={{ fontStyle: "italic", color: colors.accent }}>become a brief</Text>
                  .
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  Sympnote is reading what you said and distilling the clinical signal. Takes a few
                  seconds — this is the loop you'll use whenever you need a doctor-ready summary.
                </Text>
              </>
            )}
            {phase === "ready" && previewContent && (
              <>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>
                  A peek at your{"\n"}
                  <Text style={{ fontStyle: "italic", color: colors.accent }}>first brief</Text>
                  .
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  {readySubCopy(profile?.prepGap, previewContent)}
                </Text>
              </>
            )}
            {phase === "failed" && failReason === "service" && (
              <>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>
                  Couldn't write your{"\n"}
                  <Text style={{ fontStyle: "italic", color: colors.accent }}>brief this time</Text>
                  .
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  Your note is saved. The AI service had a hiccup — it usually
                  works on the second go. Here's what your brief will look like
                  once it does.
                </Text>
              </>
            )}
            {phase === "failed" && failReason === "thin" && (
              <>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>
                  Not quite enough{"\n"}
                  <Text style={{ fontStyle: "italic", color: colors.accent }}>to work with</Text>
                  .
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  Your note is saved, but it was a little thin for a full brief.
                  Try again with more detail — when it happened, how it felt,
                  what you were doing — or peek at a sample below.
                </Text>
              </>
            )}

            {phase === "loading" ? (
              <LoadingOrb reduced={reduced} />
            ) : previewContent ? (
              <BriefReveal
                content={previewContent}
                structured={previewStructured}
                reduced={reduced}
              />
            ) : (
              <SampleBriefCard />
            )}
          </ScrollView>

          {phase === "ready" && (
            <View style={styles.cta}>
              <PrimaryButton label="Show the full brief" onPress={onContinue} />
            </View>
          )}
          {phase === "failed" && (
            <View style={styles.cta}>
              {failReason === "thin" ? (
                <PrimaryButton
                  label="Add more detail"
                  onPress={() => {
                    hapticLight();
                    router.back();
                  }}
                />
              ) : (
                <PrimaryButton label="Try again" onPress={onRetry} />
              )}
              <Pressable
                onPress={onContinue}
                style={({ pressed }) => [
                  styles.skipLink,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue anyway"
              >
                <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                  Continue anyway
                </Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

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
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
    gap: theme.spacing.s2,
  },
  skipLink: {
    alignSelf: "center",
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(20),
    marginTop: verticalScale(2),
  },
  skipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(14),
  },
}));
