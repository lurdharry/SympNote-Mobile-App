import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { addDays } from "date-fns";
import { Plan, purchase } from "../services/subscription";
import { structureTranscript } from "../services/ai";
import { useProfileStore } from "../stores/useProfileStore";
import { useRecordingsStore } from "../stores/useRecordingsStore";
import { usePendingRecordingStore } from "../stores/usePendingRecordingStore";
import { StructuredEntry } from "../stores/types";
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
  const personalization = useProfileStore((s) => s.personalization);

  const [loading, setLoading] = useState(false);
  const [crafting, setCrafting] = useState(false);

  const commitDraft = async (): Promise<void> => {
    const pending = usePendingRecordingStore.getState().draft;
    if (!pending) return;
    let structured: StructuredEntry = EMPTY_STRUCTURED;
    let tags: string[] = [];
    try {
      const result = await structureTranscript(pending.transcript, personalization);
      structured = result as StructuredEntry;
      tags = result.symptoms.filter(Boolean).slice(0, 2);
    } catch {
      // Gemini failure post-purchase — save raw; retry later from home.
    }
    useRecordingsStore.getState().add({
      id: uuid(),
      createdAt: pending.createdAt,
      durationSec: pending.durationSec,
      transcript: pending.transcript,
      structured,
      tags,
    });
    usePendingRecordingStore.getState().clear();
  };

  const buy = async (planId: Plan["id"]) => {
    setLoading(true);
    try {
      await purchase(planId);
      hapticHeavy();
      if (mode === "onboarding") {
        setCrafting(true);
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
      await commitDraft();
      complete();
      router.replace("/(tabs)/home");
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return { loading, crafting, buy, skipDev };
}
