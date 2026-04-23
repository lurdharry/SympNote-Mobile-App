import { create } from 'zustand';

/**
 * Slim draft of the onboarding first recording. Transcription runs
 * locally during the mic step (free), but the Gemini structuring call
 * is deferred until *after* the user starts a subscription — we don't
 * burn API credits on installs that never convert.
 *
 * The paywall reads this draft, calls Gemini once purchase succeeds,
 * then promotes the enriched recording to `useRecordingsStore`.
 *
 * Not persisted: if the user kills the app at the paywall the draft is
 * forfeit. That's the intended policy for a subscription-required app.
 */
export interface DraftRecording {
  transcript: string;
  durationSec: number;
  /** Original capture time, preserved across the paywall step. */
  createdAt: string;
}

interface PendingRecordingState {
  draft: DraftRecording | null;
  setDraft: (d: DraftRecording) => void;
  /** Patch just the transcript on the existing draft. Used by the
   * summary screen's editable quote so the user's corrections land in
   * the draft before the paywall commits it. No-op if no draft exists. */
  updateTranscript: (text: string) => void;
  clear: () => void;
}

export const usePendingRecordingStore = create<PendingRecordingState>((set) => ({
  draft: null,
  setDraft: (d) => set({ draft: d }),
  updateTranscript: (text) =>
    set((s) => (s.draft ? { draft: { ...s.draft, transcript: text } } : s)),
  clear: () => set({ draft: null }),
}));
