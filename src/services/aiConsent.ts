import { Alert } from "react-native";
import { useProfileStore } from "../stores/useProfileStore";

const TITLE = "Use AI for your notes?";

const MESSAGE =
  "Sympnote sends your note text to AI to organize it into clinician-ready briefs. " +
  "Your name, email, and audio stay on your device. " +
  "See the Privacy Policy in Settings for details.";

/**
 * Show the AI data-sharing disclosure as a one-shot Alert and capture
 * the user's response. Resolves to `true` and persists the
 * acceptance via `acceptAiConsent` when the user agrees, `false`
 * otherwise. Required by App Review guideline 5.1.2(i): users must
 * agree in-app before any data is sent to AI providers.
 *
 * Idempotent — when consent has already been granted (e.g. user is
 * past onboarding) this resolves `true` immediately without
 * prompting again.
 */
export const ensureAiConsent = (): Promise<boolean> => {
  if (useProfileStore.getState().aiConsentAcceptedAt) return Promise.resolve(true);
  return new Promise((resolve) => {
    Alert.alert(TITLE, MESSAGE, [
      { text: "Don't allow", style: "cancel", onPress: () => resolve(false) },
      {
        text: "I agree",
        onPress: () => {
          useProfileStore.getState().acceptAiConsent();
          resolve(true);
        },
      },
    ]);
  });
};

/**
 * Read-only variant for the Settings row. Always shows the
 * disclosure with a single dismiss button — useful when the user
 * has already granted consent and wants to re-read what they
 * agreed to. Doesn't change consent state either way.
 */
export const showAiConsentInfo = (): void => {
  Alert.alert(TITLE, MESSAGE, [{ text: "Got it" }]);
};
