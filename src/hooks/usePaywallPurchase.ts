import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { addDays } from "date-fns";
import { Plan, purchase } from "../services/subscription";
import { structureTranscript } from "../services/ai";
import { useProfileStore } from "../stores/useProfileStore";
import { useRecordingsStore } from "../stores/useRecordingsStore";
import { useBriefsStore } from "../stores/useBriefsStore";
import { usePendingRecordingStore } from "../stores/usePendingRecordingStore";
import { Recording, StructuredEntry } from "../stores/types";
import { hapticHeavy } from "../services/haptics";
import { uuid } from "../utils/uuid";

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

export type PaywallMode = "onboarding" | "gate";

/**
 * Drives the paywall's purchase flow.
 *
 *  - `onboarding` mode: handles the mock RevenueCat call, structures
 *    any pending draft recording from the first-recording step,
 *    flips `onboardingComplete`, and routes to home.
 *  - `gate` mode: rendered by the in-app `/paywall` modal route or
 *    inside a `<LockedView>` when the user lost entitlement after
 *    onboarding. Just transacts and dismisses (router.back) so the
 *    user lands on whatever screen triggered the gate. The reactive
 *    EntitlementContext will pick up the status change and unmount
 *    any `<LockedView>` instances on its own.
 *
 * `crafting` flips on after a successful onboarding purchase to cover
 * the post-purchase summarisation step with an overlay; in gate mode
 * the purchase mock returns fast enough that the spinner alone is
 * sufficient and crafting stays false.
 */
export function usePaywallPurchase(mode: PaywallMode = "onboarding") {
  const router = useRouter();
  const complete = useProfileStore((s) => s.completeOnboarding);

  const [loading, setLoading] = useState(false);
  const [crafting, setCrafting] = useState(false);

  /**
   * Sweep the entire onboarding draft store into the persisted stores.
   * This is the only place onboarding data crosses the persistence
   * boundary — the wide-scope deferred-commit pattern.
   *
   * Three handoffs in priority order:
   *  1. Personalization → useProfileStore
   *  2. Pending recording (structured) + brief → useRecordingsStore +
   *     useBriefsStore (the normal happy path)
   *  3. Fallback: a raw draft survived but no AI was run yet (edge
   *     case if the user somehow reached the paywall without going
   *     through first-brief). Run structureTranscript here so the
   *     recording at least has fields.
   *
   * No-ops cleanly when the draft store is empty (gate-mode purchases
   * post-onboarding) — every step early-returns on null.
   */
  const commitDraft = async (): Promise<void> => {
    const draftState = usePendingRecordingStore.getState();

    // 1. Personalization
    if (draftState.personalization) {
      useProfileStore.getState().setPersonalization(draftState.personalization);
    }

    // 2. Structured recording + brief from first-brief (happy path)
    if (draftState.pendingRecording) {
      useRecordingsStore.getState().add(draftState.pendingRecording);
      if (draftState.pendingBrief) {
        useBriefsStore.getState().add(draftState.pendingBrief);
      }
    } else if (draftState.draft) {
      // 3. Fallback path — raw draft only, AI never ran. Run it now.
      const pending = draftState.draft;
      let structured: StructuredEntry = EMPTY_STRUCTURED;
      let tags: string[] = [];
      try {
        const result = await structureTranscript(
          pending.transcript,
          draftState.personalization,
        );
        structured = result as StructuredEntry;
        tags = result.symptoms.filter(Boolean).slice(0, 2);
      } catch {
        // Gemini failure — save raw; user can retry from home later.
      }
      useRecordingsStore.getState().add({
        id: uuid(),
        createdAt: pending.createdAt,
        durationSec: pending.durationSec,
        transcript: pending.transcript,
        structured,
        tags,
      });
    }

    // Wipe everything once committed.
    usePendingRecordingStore.getState().clear();
  };

  const buy = async (planId: Plan["id"]) => {
    setLoading(true);
    try {
      await purchase(planId);
      hapticHeavy();
      if (mode === "onboarding") {
        setCrafting(true);
        // Onboarding-commit semantics: "the first brief saves to a
        // fresh slate." Wipe any prior briefs / recordings before
        // committing so the home screen shows only the just-generated
        // pair. Without this, repeat test sessions (or any path that
        // re-enters onboarding) accumulate briefs in the persisted
        // store. Gate mode does NOT wipe — real users have history.
        useRecordingsStore.setState({ recordings: [] });
        useBriefsStore.setState({ briefs: [] });
        await commitDraft();
        complete();
        router.replace("/(tabs)/home");
      } else {
        // Gate purchase: dismiss back to the screen that triggered
        // the modal. The reactive EntitlementContext flips `entitled`
        // to true and any LockedView placeholders auto-unmount.
        if (router.canGoBack()) router.back();
      }
    } catch (e) {
      setCrafting(false);
      Alert.alert("Purchase failed", String(e));
    } finally {
      setLoading(false);
    }
  };

  const skipDev = async () => {
    if (!__DEV__) return;
    // Grant a 3-day trial so the skipped session lands in an entitled
    // state — otherwise every dev who taps this hits the in-app gate
    // on the next brief generation, which isn't what "skip paywall"
    // should mean during local development.
    useProfileStore
      .getState()
      .setSubscription("trial", addDays(new Date(), 3).toISOString());
    if (mode === "onboarding") {
      setCrafting(true);
      // Same fresh-slate semantics as buy() — see comment there.
      useRecordingsStore.setState({ recordings: [] });
      useBriefsStore.setState({ briefs: [] });
      await commitDraft();
      complete();
      router.replace("/(tabs)/home");
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return { loading, crafting, buy, skipDev };
}
