import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fontScale,
  makeStyles,
  moderateScale,
  typography,
  useTheme,
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

type Phase = "loading" | "ready";

/**
 * Sub-copy under the "Here's what your doctor will see" headline.
 * Closes the loop on the prep-gap problem-anchor: when the user said
 * they often forget at the doctor's office, the brief reveal directly
 * addresses that pain ("you said you forget — here's everything you
 * mentioned"). Falls back to a generic descriptor when the user
 * reported they're already prepared (no pain to validate).
 */
const readySubCopy = (prepGap: PrepGap | undefined, content: BriefContent | null): string => {
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
        structuredResult.status === "fulfilled" ? structuredResult.value : EMPTY_STRUCTURED;
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
            {phase === "loading" || !previewContent ? (
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
            ) : (
              <>
                <Text style={[styles.headline, { color: colors.textPrimary }]}>
                  Here's what your{"\n"}
                  <Text style={{ fontStyle: "italic", color: colors.accent }}>doctor will see</Text>
                  .
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  {readySubCopy(profile?.prepGap, previewContent)}
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
              <PrimaryButton label="Continue" onPress={onContinue} />
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
}));
