import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./mmkv";
import {
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
    }),
    {
      name: "profile",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
