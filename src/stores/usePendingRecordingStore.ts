import { create } from 'zustand';
import type { Brief, PersonalizationProfile, Recording } from './types';

/**
 * In-memory draft store for the entire onboarding flow.
 *
 * The product policy: nothing the user touches during onboarding
 * lands in persisted storage until they subscribe (or activate the
 * trial). Only on a successful purchase does `usePaywallPurchase`
 * sweep this store into the persisted stores (`useProfileStore`,
 * `useRecordingsStore`, `useBriefsStore`).
 *
 * That avoids two real bugs:
 *  - duplicate recordings/briefs piling up if a user navigates
 *    back-and-forth through onboarding (each AI run currently
 *    minted a new uuid'd row in the persisted stores)
 *  - orphan profile data from users who quit before subscribing
 *
 * Trade-off: no resumable onboarding. If the user kills the app
 * mid-flow, all answers are forfeit and they restart from the hook
 * screen. Acceptable for a subscription-required product.
 */
export interface DraftRecording {
  transcript: string;
  durationSec: number;
  /** Original capture time, preserved across the paywall step. */
  createdAt: string;
}

interface PendingRecordingState {
  /** Raw recording draft — transcript + duration, before AI runs. */
  draft: DraftRecording | null;

  /**
   * Onboarding answers keyed by profile field (e.g. `prepGap`,
   * `ageBand`, `sex`, `knownConditions`). These would normally be
   * persisted to `useProfileStore.onboardingAnswers`, but during
   * the onboarding flow we hold them here until commit.
   */
  answers: Record<string, unknown>;

  /**
   * Personalization derived from `answers` + the empty initial care
   * team. Built on the summary screen's `onCommit` so the AI calls in
   * first-brief have it. Committed to `useProfileStore.personalization`
   * on subscribe.
   */
  personalization: PersonalizationProfile | null;

  /**
   * Structured recording from the AI run on first-brief. Held here
   * until commit; `useRecordingsStore` only sees it after subscribe.
   */
  pendingRecording: Recording | null;

  /**
   * AI-generated brief. Held here until commit. Hero copy on the
   * paywall reads from this (it's the brief the user just saw on
   * first-brief, not yet in `useBriefsStore`).
   */
  pendingBrief: Brief | null;

  // Actions
  setDraft: (d: DraftRecording) => void;
  /** Patch just the transcript on the existing draft. Used by the
   * review screen's editable quote so corrections land in the draft. */
  updateTranscript: (text: string) => void;
  setAnswer: (key: string, value: unknown) => void;
  setPersonalization: (profile: PersonalizationProfile) => void;
  setArtifacts: (recording: Recording, brief: Brief | null) => void;
  /** Wipes everything — used by `resetApp` and on commit success. */
  clear: () => void;
}

const empty = {
  draft: null,
  answers: {},
  personalization: null,
  pendingRecording: null,
  pendingBrief: null,
};

export const usePendingRecordingStore = create<PendingRecordingState>((set) => ({
  ...empty,

  setDraft: (d) => set({ draft: d }),
  updateTranscript: (text) =>
    set((s) => (s.draft ? { draft: { ...s.draft, transcript: text } } : s)),
  setAnswer: (key, value) =>
    set((s) => ({ answers: { ...s.answers, [key]: value } })),
  setPersonalization: (profile) => set({ personalization: profile }),
  setArtifacts: (recording, brief) =>
    set({ pendingRecording: recording, pendingBrief: brief }),
  clear: () => set({ ...empty }),
}));
