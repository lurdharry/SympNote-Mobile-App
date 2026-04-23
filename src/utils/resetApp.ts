import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { usePendingRecordingStore } from '@/stores/usePendingRecordingStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';

/**
 * Full factory reset — wipes every user-facing store and resets the
 * profile to its initial state (including onboardingComplete). After
 * this runs the app will route the user back through onboarding.
 *
 * Shared between Settings ("Reset app") and the __DEV__ dev-reset
 * shortcut on the onboarding welcome screen. Does NOT touch subscription
 * state at the source of truth (App Store / Play Store / RevenueCat);
 * the local mirror is cleared by `resetOnboarding()` but will re-sync
 * on next launch when RevenueCat wiring lands.
 */
export const resetAppState = (): void => {
  useRecordingsStore.setState({ recordings: [] });
  useAppointmentsStore.setState({ appointments: [] });
  usePendingRecordingStore.getState().clear();
  useProfileStore.getState().resetOnboarding();
};
