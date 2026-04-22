export type UrgencyLevel = 'routine' | 'follow-up' | 'soon' | 'urgent';

export type StructuredEntry = {
  symptoms: string[];
  location: string;
  duration: string;
  severity: number; // 1-10
  triggers: string[];
  medications: string[];
  notes: string;
  /**
   * Body system classification (e.g. "Musculoskeletal", "Cardiovascular").
   * Empty string if uncertain.
   */
  bodySystem: string;
  /**
   * Concerning signs the patient should make sure their doctor hears
   * (high severity, sudden onset, worsening, blood, neurological signs, etc.).
   * Empty when nothing warrants flagging.
   */
  redFlags: string[];
  /**
   * Coarse urgency tier to help the user pace when to seek care. This is
   * NEVER a diagnosis — it's a heuristic cue based on the words they used.
   */
  urgency: UrgencyLevel;
};

export type Recording = {
  id: string;
  createdAt: string;
  /**
   * Transcription happens on-device via speech recognition — the raw
   * audio is never persisted. Kept as an optional string for forward
   * compatibility if we later offer a "keep audio" opt-in.
   */
  audioUri?: string;
  durationSec: number;
  transcript: string;
  structured: StructuredEntry;
  tags: string[];
};

/**
 * Per-visit "brief" — user-curated content that sits alongside the
 * AI-generated `summary`. These are things the patient wants to
 * bring up with the doctor; they persist even if the summary is
 * regenerated.
 */
export type AppointmentBrief = {
  questions: string[];
};

export type Appointment = {
  id: string;
  title: string;
  doctorName: string;
  specialty: string;
  date: string;
  relatedRecordingIds: string[];
  summary: string | null;
  generatedAt: string | null;
  /**
   * Optional for forward compatibility with existing MMKV-persisted
   * records written before the field was added. Treat `undefined` as
   * an empty brief.
   */
  brief?: AppointmentBrief;
};

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';

export type UserProfile = {
  onboardingComplete: boolean;
  onboardingAnswers: Record<string, unknown>;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
};
