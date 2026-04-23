import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./mmkv";
import {
  Clinician,
  PersonalizationProfile,
  SubscriptionStatus,
  UserProfile,
} from "./types";

export type ThemePreference = "auto" | "light" | "dark";
export type ReduceMotionPreference = "auto" | "on" | "off";

type State = UserProfile & {
  themePreference: ThemePreference;
  hapticsEnabled: boolean;
  reduceMotionOverride: ReduceMotionPreference;
  /**
   * Set once the user has seen (and dismissed) the one-time hero card
   * that celebrates their first recording on the home screen. Gates
   * the card so it never shows twice.
   */
  firstEntryHeroDismissed: boolean;
};

type Actions = {
  setOnboardingAnswer: (key: string, value: unknown) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setSubscription: (status: SubscriptionStatus, trialEndsAt?: string | null) => void;
  setPersonalization: (profile: PersonalizationProfile) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setReduceMotionOverride: (pref: ReduceMotionPreference) => void;
  dismissFirstEntryHero: () => void;
  /**
   * Care team management — post-onboarding adds / edits / removes a
   * clinician on `personalization.careTeam`. No-ops when personalization
   * is null (pre-onboarding state). `updateClinician` / `removeClinician`
   * identify the target by its current array index; callers are expected
   * to use the same list they read from the store.
   */
  addClinician: (clinician: Clinician) => void;
  updateClinician: (index: number, clinician: Clinician) => void;
  removeClinician: (index: number) => void;
};

const initial: State = {
  onboardingComplete: false,
  onboardingAnswers: {},
  subscriptionStatus: "none",
  trialEndsAt: null,
  personalization: null,
  themePreference: "auto",
  hapticsEnabled: true,
  reduceMotionOverride: "auto",
  firstEntryHeroDismissed: false,
};

export const useProfileStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,
      setOnboardingAnswer: (key, value) =>
        set((s) => ({
          onboardingAnswers: { ...s.onboardingAnswers, [key]: value },
        })),
      completeOnboarding: () => set(() => ({ onboardingComplete: true })),
      resetOnboarding: () => set(() => ({ ...initial })),
      setSubscription: (status, trialEndsAt = null) =>
        set(() => ({ subscriptionStatus: status, trialEndsAt })),
      setPersonalization: (profile) => set(() => ({ personalization: profile })),

      setThemePreference: (pref) => set(() => ({ themePreference: pref })),
      setHapticsEnabled: (enabled) => set(() => ({ hapticsEnabled: enabled })),
      setReduceMotionOverride: (pref) => set(() => ({ reduceMotionOverride: pref })),

      dismissFirstEntryHero: () => set(() => ({ firstEntryHeroDismissed: true })),

      addClinician: (clinician) =>
        set((s) =>
          s.personalization
            ? {
                personalization: {
                  ...s.personalization,
                  careTeam: [...s.personalization.careTeam, clinician],
                },
              }
            : s,
        ),

      updateClinician: (index, clinician) =>
        set((s) =>
          s.personalization
            ? {
                personalization: {
                  ...s.personalization,
                  careTeam: s.personalization.careTeam.map((c, i) =>
                    i === index ? clinician : c,
                  ),
                },
              }
            : s,
        ),

      removeClinician: (index) =>
        set((s) =>
          s.personalization
            ? {
                personalization: {
                  ...s.personalization,
                  careTeam: s.personalization.careTeam.filter(
                    (_, i) => i !== index,
                  ),
                },
              }
            : s,
        ),
    }),
    {
      name: "profile",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
