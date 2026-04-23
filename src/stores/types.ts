export type UrgencyLevel = 'routine' | 'follow-up' | 'soon' | 'urgent';

export type StructuredEntry = {
  symptoms: string[];
  location: string;
  duration: string;
  severity: number; // 0-10 (0 = patient reports no symptom)
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
/**
 * Synthesized visit brief — what the user walks into their appointment
 * with. Built by the AI from the recordings in `briefSourceRecordingIds`.
 *
 *  - `summary`: one-paragraph framing for the doctor to read first.
 *  - `topConcerns`: ranked 3-5 concerns with a one-line detail each.
 *  - `timeline`: chronological bullets drawn from recent entries.
 *  - `patterns`: triggers / worsens / improves observations.
 *  - `medications`: meds mentioned across entries.
 *  - `questions`: questions to ask the doctor (AI-seeded, user-editable).
 *  - `flags`: concerning observations (high severity, worsening, etc.).
 */
export type AppointmentBrief = {
  summary: string;
  topConcerns: Array<{ label: string; detail: string }>;
  timeline: Array<{ date: string; line: string }>;
  patterns: string[];
  medications: string[];
  questions: string[];
  flags: string[];
};

/**
 * Lifecycle state of a single appointment. Appointments start as
 * `upcoming`; once the date passes the user is prompted to mark what
 * happened (attended / missed / cancelled). Attended appointments
 * anchor the "since last visit with Dr. X" source window for future
 * briefs with the same clinician.
 */
export type AppointmentStatus = 'upcoming' | 'attended' | 'missed' | 'cancelled';

export type Appointment = {
  id: string;
  title: string;
  doctorName: string;
  specialty: string;
  date: string;
  /** Lifecycle state — see `AppointmentStatus`. Defaults to 'upcoming'. */
  status: AppointmentStatus;
  /** ISO timestamp set when the user marks the visit attended. */
  attendedAt: string | null;
  /** Optional short free-text note the user adds after attending. */
  outcome: string | null;
  /** The generated structured brief. Null until generated. */
  brief: AppointmentBrief | null;
  /** When the current brief was generated. Null when none. */
  briefGeneratedAt: string | null;
  /**
   * Which recordings fed the last generation. Used to detect staleness:
   * if recordings added since `briefGeneratedAt` aren't in this set, the
   * brief is stale and can be regenerated.
   */
  briefSourceRecordingIds: string[];
};

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';

/**
 * Age band — the single biggest clinical prior for AI reasoning.
 * Finer granularity at the young end so adolescents (12–17) are
 * carved out from the adult bands; finer split at 50 reflects where
 * cardiovascular/metabolic risk curves shift.
 */
export type AgeBand =
  | 'teen'
  | '18-29'
  | '30-49'
  | '50-64'
  | '65-plus';

export type FocusArea =
  | 'investigate'
  | 'upcoming-visit'
  | 'patterns'
  | 'recovery-track'
  | 'mental-health'
  | 'general';

export interface Clinician {
  name: string;
  role: string;
}

/**
 * Derived from the raw onboarding answers once the analyzing screen
 * runs. Downstream code (AI prompts, first-recording copy, settings
 * display) reads this — not the raw answers.
 *
 * Shape is deliberately tight: only fields that drive real AI output
 * or real UI behavior. Anything the app can observe from real logs
 * (e.g. time-of-day patterns) is computed, not asked.
 */
export interface PersonalizationProfile {
  /** Broad age bucket — biggest single clinical prior for the AI. */
  ageBand: AgeBand;
  /**
   * User-selected conditions (e.g. "Asthma", "Migraines") plus any
   * free-text additions. Used in AI context as baseline calibration.
   */
  knownConditions: string[];
  /** Goals for this tracking — multi-select on the Focus screen. */
  focus: FocusArea[];
  careTeam: Clinician[];
  /** First-recording mic-area copy, tailored to dominant focus. */
  firstRecordingPrompt: string;
}

export type UserProfile = {
  onboardingComplete: boolean;
  onboardingAnswers: Record<string, unknown>;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  /** Derived profile — set once the analyzing screen runs. Null before. */
  personalization: PersonalizationProfile | null;
};
