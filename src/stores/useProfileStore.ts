import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./mmkv";
import {
  AppointmentBrief,
  Clinician,
  PersonalizationProfile,
  SubscriptionStatus,
  UserProfile,
} from "./types";
import { uuid } from "../utils/uuid";

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
   *
   * `addClinician` accepts an optional id so callers can supply a
   * stable id (e.g. when re-adding from a deleted state); when
   * omitted, a fresh uuid is generated. The returned Clinician has
   * `id` populated either way.
   */
  addClinician: (clinician: { name: string; role: string; id?: string }) => Clinician;
  updateClinician: (index: number, clinician: { name: string; role: string }) => void;
  removeClinician: (index: number) => void;
  /** Find an existing clinician by case-insensitive name match, or
   *  create one with the given role and add it to careTeam. Used by
   *  the cross-store reconcile pass to convert legacy `doctorName`
   *  strings into Clinician references. */
  findOrCreateClinicianByName: (name: string, role: string) => Clinician | null;
  /**
   * Persist a freshly generated brief onto a clinician. Called by
   * `useClinicianBrief` after a successful AI fetch. Preserves any
   * user-curated questions on the existing brief by merging them in
   * the same way the appointments store does — questions are user
   * intent, AI shouldn't blow them away.
   */
  setClinicianBrief: (
    clinicianId: string,
    brief: AppointmentBrief,
    sourceRecordingIds: string[],
  ) => void;
  /** Drop a clinician's current brief — lets the user start fresh. */
  clearClinicianBrief: (clinicianId: string) => void;
};

const initial: State = {
  onboardingComplete: false,
  onboardingAnswers: {},
  subscriptionStatus: "none",
  trialEndsAt: null,
  personalization: null,
  themePreference: "light",
  hapticsEnabled: true,
  reduceMotionOverride: "auto",
  firstEntryHeroDismissed: false,
};

export const useProfileStore = create<State & Actions>()(
  persist(
    (set, get) => ({
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

      addClinician: (clinician) => {
        const next: Clinician = {
          id: clinician.id ?? uuid(),
          name: clinician.name,
          role: clinician.role,
          brief: null,
          briefGeneratedAt: null,
          briefSourceRecordingIds: [],
        };
        set((s) =>
          s.personalization
            ? {
                personalization: {
                  ...s.personalization,
                  careTeam: [...s.personalization.careTeam, next],
                },
              }
            : s,
        );
        return next;
      },

      updateClinician: (index, patch) =>
        set((s) => {
          if (!s.personalization) return s;
          return {
            personalization: {
              ...s.personalization,
              careTeam: s.personalization.careTeam.map((c, i) =>
                i === index ? { ...c, name: patch.name, role: patch.role } : c,
              ),
            },
          };
        }),

      removeClinician: (index) =>
        set((s) =>
          s.personalization
            ? {
                personalization: {
                  ...s.personalization,
                  careTeam: s.personalization.careTeam.filter((_, i) => i !== index),
                },
              }
            : s,
        ),

      findOrCreateClinicianByName: (name, role) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const lower = trimmed.toLowerCase();
        const personalization = get().personalization;
        if (!personalization) return null;
        const existing = personalization.careTeam.find(
          (c) => c.name.trim().toLowerCase() === lower,
        );
        if (existing) return existing;
        const next: Clinician = {
          id: uuid(),
          name: trimmed,
          role: role || "Clinician",
          brief: null,
          briefGeneratedAt: null,
          briefSourceRecordingIds: [],
        };
        set((s) =>
          s.personalization
            ? {
                personalization: {
                  ...s.personalization,
                  careTeam: [...s.personalization.careTeam, next],
                },
              }
            : s,
        );
        return next;
      },

      setClinicianBrief: (clinicianId, brief, sourceRecordingIds) =>
        set((s) => {
          if (!s.personalization) return s;
          return {
            personalization: {
              ...s.personalization,
              careTeam: s.personalization.careTeam.map((c) => {
                if (c.id !== clinicianId) return c;
                // Preserve user-authored questions by prepending them
                // to the AI-generated set (dedup case-insensitive).
                const userQs = c.brief?.questions ?? [];
                const aiQs = brief.questions;
                const seen = new Set(userQs.map((q) => q.trim().toLowerCase()));
                const merged = [
                  ...userQs,
                  ...aiQs.filter((q) => !seen.has(q.trim().toLowerCase())),
                ];
                return {
                  ...c,
                  brief: { ...brief, questions: merged },
                  briefGeneratedAt: new Date().toISOString(),
                  briefSourceRecordingIds: sourceRecordingIds,
                };
              }),
            },
          };
        }),

      clearClinicianBrief: (clinicianId) =>
        set((s) => {
          if (!s.personalization) return s;
          return {
            personalization: {
              ...s.personalization,
              careTeam: s.personalization.careTeam.map((c) =>
                c.id === clinicianId
                  ? { ...c, brief: null, briefGeneratedAt: null, briefSourceRecordingIds: [] }
                  : c,
              ),
            },
          };
        }),
    }),
    {
      name: "profile",
      storage: createJSONStorage(() => mmkvStorage),
      version: 3,
      migrate: (persisted, version) => {
        // v0 → v1: pre-existing migration target (none captured).
        // v1 → v2: backfill `id` on every Clinician in careTeam so
        // appointments + recordings can reference them stably.
        // v2 → v3: backfill brief / briefGeneratedAt / briefSourceRecordingIds
        // on every Clinician — briefs now live on the clinician
        // (not the appointment) so the user can get a brief for any
        // clinician regardless of whether a visit is scheduled.
        let s = persisted as State;
        if (version < 2 && s.personalization) {
          const careTeam = s.personalization.careTeam.map((c) => ({
            ...c,
            id: (c as Clinician).id ?? uuid(),
          }));
          s = { ...s, personalization: { ...s.personalization, careTeam } };
        }
        if (version < 3 && s.personalization) {
          const careTeam = s.personalization.careTeam.map((c) => ({
            ...c,
            brief: (c as Clinician).brief ?? null,
            briefGeneratedAt: (c as Clinician).briefGeneratedAt ?? null,
            briefSourceRecordingIds: (c as Clinician).briefSourceRecordingIds ?? [],
          }));
          s = { ...s, personalization: { ...s.personalization, careTeam } };
        }
        return s;
      },
    },
  ),
);
