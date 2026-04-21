import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';
import { UserProfile, SubscriptionStatus } from './types';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type ReduceMotionPreference = 'auto' | 'on' | 'off';

type State = UserProfile & {
  hasSeenPrivacyNotice: boolean;
  themePreference: ThemePreference;
  hapticsEnabled: boolean;
  reduceMotionOverride: ReduceMotionPreference;
};

type Actions = {
  setOnboardingAnswer: (key: string, value: unknown) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setSubscription: (status: SubscriptionStatus, trialEndsAt?: string | null) => void;
  acknowledgePrivacy: () => void;
  setThemePreference: (pref: ThemePreference) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setReduceMotionOverride: (pref: ReduceMotionPreference) => void;
};

const initial: State = {
  onboardingComplete: false,
  onboardingAnswers: {},
  subscriptionStatus: 'none',
  trialEndsAt: null,
  hasSeenPrivacyNotice: false,
  themePreference: 'auto',
  hapticsEnabled: true,
  reduceMotionOverride: 'auto',
};

export const useProfileStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,
      setOnboardingAnswer: (key, value) =>
        set((s) => ({
          onboardingAnswers: { ...s.onboardingAnswers, [key]: value },
        })),
      completeOnboarding: () =>
        set(() => ({ onboardingComplete: true })),
      resetOnboarding: () => set(() => ({ ...initial })),
      setSubscription: (status, trialEndsAt = null) =>
        set(() => ({ subscriptionStatus: status, trialEndsAt })),
      acknowledgePrivacy: () =>
        set(() => ({ hasSeenPrivacyNotice: true })),
      setThemePreference: (pref) =>
        set(() => ({ themePreference: pref })),
      setHapticsEnabled: (enabled) =>
        set(() => ({ hapticsEnabled: enabled })),
      setReduceMotionOverride: (pref) =>
        set(() => ({ reduceMotionOverride: pref })),
    }),
    {
      name: 'profile',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
