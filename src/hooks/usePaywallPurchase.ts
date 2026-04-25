import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
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

/**
 * Drives the paywall's purchase flow: handles the mock RevenueCat call,
 * structures any pending draft recording, completes onboarding, and
 * routes to home. `crafting` flips on after a successful purchase to
 * cover the post-purchase summarisation step with an overlay.
 */
export function usePaywallPurchase() {
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
      setCrafting(true);
      await commitDraft();
      complete();
      router.replace("/(tabs)/home");
    } catch (e) {
      setCrafting(false);
      Alert.alert("Purchase failed", String(e));
    } finally {
      setLoading(false);
    }
  };

  const skipDev = async () => {
    if (!__DEV__) return;
    setCrafting(true);
    await commitDraft();
    complete();
    router.replace("/(tabs)/home");
  };

  return { loading, crafting, buy, skipDev };
}
