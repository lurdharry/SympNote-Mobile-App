export type UrgencyLevel = 'routine' | 'follow-up' | 'soon' | 'urgent';

export type StructuredEntry = {
  symptoms: string[];
  location: string;
  duration: string;
  severity: number; // 0-10 (0 = patient reports no symptom)
  triggers: string[];
  /**
   * What the patient says makes the symptom better / relieves it. Kept
   * separate from triggers so correlations don't conflate "coffee
   * worsens my headache" with "coffee relieves my headache". Older
   * recordings persisted before this split will read as an empty list.
   */
  relievers?: string[];
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
  /**
   * Optional multi-select routing. Each name matches a clinician
   * display name on the user's care team.
   *  - Empty / undefined: recording is "general" and feeds every
   *    clinician's visit brief (within the time window).
   *  - Non-empty: recording is routed only to the named clinicians'
   *    briefs.
   *
   * Cached display names — canonical reference is `clinicianIds`.
   */
  clinicianNames?: string[];
  /**
   * Canonical id-based routing — populated alongside (or in place of)
   * clinicianNames. The reconcile pass backfills this for legacy
   * recordings by mapping each clinicianName to a Clinician id.
   */
  clinicianIds?: string[];
};

/**
 * AI-synthesised content of a brief — the actual prose the user reads.
 * Same shape regardless of whether the brief is tagged with a clinician,
 * an appointment, or nothing at all.
 *
 *  - `summary`: one-paragraph framing for the doctor to read first.
 *  - `topConcerns`: ranked 3-5 concerns with a one-line detail each.
 *  - `timeline`: chronological bullets drawn from the source notes.
 *  - `patterns`: triggers / worsens / improves observations.
 *  - `medications`: meds mentioned across notes.
 *  - `questions`: questions to ask the doctor (AI-seeded, user-editable).
 *  - `flags`: concerning observations (high severity, worsening, etc.).
 */
export type BriefContent = {
  summary: string;
  topConcerns: Array<{ label: string; detail: string }>;
  timeline: Array<{ date: string; line: string }>;
  patterns: string[];
  medications: string[];
  questions: string[];
  flags: string[];
};

/**
 * @deprecated alias — use `BriefContent`. Kept for the few legacy
 * call sites that still reference the appointment-anchored model
 * during the transition.
 */
export type AppointmentBrief = BriefContent;

/**
 * A synthesised, standalone brief — the first-class artefact users
 * generate. Independent of any appointment or clinician; metadata
 * tags optionally associate it with a clinician (or several) and/or
 * a specific appointment for sharing context.
 *
 * Briefs are immutable snapshots. To "update" a brief the user
 * generates a new one (same window or wider) — old briefs stay as
 * history.
 */
export type Brief = {
  id: string;
  /** ISO timestamp when the AI generation completed. */
  generatedAt: string;
  /** ISO timestamp of the earliest note that fed this brief. */
  windowStart: string;
  /** ISO timestamp of the latest note that fed this brief. Usually
   *  equal to `generatedAt` for live generations; can be earlier when
   *  the user explicitly picks a closed custom window. */
  windowEnd: string;
  /** Recording ids that fed this brief. Lets us show "5 notes
   *  briefed" and detect "un-briefed" recordings created since. */
  sourceRecordingIds: string[];
  content: BriefContent;
  /**
   * Multi-select audience tag. Empty array (default) = "for everyone"
   * — surfaces under every clinician's filtered view. Non-empty =
   * scoped to those specific clinicians.
   */
  clinicianIds: string[];
  /** Optional link to a specific appointment this brief was prepared
   *  for. Lets the user surface the brief on the visit detail. */
  appointmentId?: string;
  /** Auto-generated default ("Last week", "Apr 18 — Apr 25") that the
   *  user can override. */
  title?: string;
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
  /**
   * Canonical reference to a Clinician on the profile's care team.
   * Set by writers; backfilled for legacy appointments by the
   * app-startup reconcile pass which find-or-creates a Clinician
   * for each loose `doctorName`. Optional in the type only because
   * legacy data may not yet have run through reconcile — UI should
   * prefer `clinicianId` when present and fall back to `doctorName`.
   */
  clinicianId?: string;
  /**
   * Cached display name. Kept denormalized so timeline/list reads
   * don't have to look up every clinician — but the canonical name
   * lives on the referenced Clinician. Renames in care-team settings
   * propagate down here.
   */
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
  brief: BriefContent | null;
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

/**
 * Sex assigned at birth. The second-largest clinical prior after age —
 * many symptoms (chest pain, fatigue, abdominal) read differently
 * across sexes. `prefer-not` is a real answer, not the absence of
 * one; the AI treats it as "no constraint" rather than guessing.
 */
export type SexAssigned = 'female' | 'male' | 'intersex' | 'prefer-not';

/**
 * Pregnancy status — only relevant when sex is 'female'. Surfaced as
 * a follow-up on the health-context screen for that branch only.
 * 'unknown' covers both "I don't know" and "didn't ask."
 */
export type PregnancyStatus = 'yes' | 'no' | 'possibly' | 'unknown';

/**
 * How the user expects to use the app. Calibrates UX defaults (daily
 * prompt vs ambient) and the AI's narrative tone (continuous vs
 * episodic). Not clinical — purely a preference.
 */
export type TrackingStyle = 'daily' | 'episodic' | 'mixed';

/**
 * One allergy category the user reported, paired with any specific
 * triggers they identified on the dynamic follow-up screen. Stored
 * structured (not flat) so the AI can reason across categories
 * (e.g. "drug allergies" as a clinical class) while still having the
 * specific triggers when they exist.
 *
 *  - `category`: 'drug' | 'food' | 'environmental' | 'latex' | 'other'
 *    (kept as string here to avoid a circular dependency with the
 *    constants module that owns the canonical list).
 *  - `specifics`: curated values from `ALLERGY_SPECIFICS[category]`
 *    plus any free-text the user added (prefixed `custom:`).
 */
export interface AllergyEntry {
  category: string;
  specifics: string[];
}

/**
 * How often the user wishes they'd mentioned something after leaving
 * the doctor. Captured on the very first onboarding screen as a
 * problem-anchor — the user names the pain SympNote solves before we
 * ask anything else. Used downstream to personalise the first-brief
 * sub-copy and the paywall sub-line (loss framing).
 *
 *  - `often`: almost every visit
 *  - `sometimes`: about half the time
 *  - `occasional`: now and then
 *  - `rare`: rarely / pretty prepared
 */
export type PrepGap = 'often' | 'sometimes' | 'occasional' | 'rare';

export type FocusArea =
  | 'investigate'
  | 'upcoming-visit'
  | 'patterns'
  | 'recovery-track'
  | 'mental-health'
  | 'general';

export interface Clinician {
  /**
   * Stable identity for the clinician — appointments and recordings
   * reference this from `clinicianId` / `clinicianIds` so renaming
   * one place doesn't cause drift across the app. Existing entries
   * (pre-id) are backfilled by the profile store's persist migration
   * and the app-startup reconcile pass.
   */
  id: string;
  name: string;
  role: string;
  /**
   * Canonical "what should I tell Dr. X" brief — generated from
   * recordings routed to this clinician (or general notes that feed
   * everyone). Not contingent on an appointment: a user can have a
   * clinician with no scheduled visit and still get a brief.
   *
   * Forward-looking appointments display this. Attended appointments
   * take a frozen snapshot onto Appointment.brief at attendance time.
   */
  brief: BriefContent | null;
  briefGeneratedAt: string | null;
  /**
   * Recording ids that fed the last brief generation. Compared
   * against the current source set to detect staleness — when new
   * notes have been added since, the brief is flagged stale.
   */
  briefSourceRecordingIds: string[];
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
  /** Sex assigned at birth — second-largest clinical prior. */
  sex: SexAssigned;
  /** Only meaningful when `sex === 'female'`; defaults to 'unknown'. */
  pregnancyStatus: PregnancyStatus;
  /**
   * Self-reported "how often do you forget to mention something?" from
   * the very first onboarding screen. Drives the loss-framed paywall
   * sub-line and a callback in the first-brief reveal — the user named
   * the pain, so we close the loop. Defaults to 'sometimes' when not
   * captured (e.g. legacy users from before this screen existed).
   */
  prepGap: PrepGap;
  /**
   * User-selected conditions (e.g. "Asthma", "Migraines") plus any
   * free-text additions. Used in AI context as baseline calibration.
   */
  knownConditions: string[];
  /**
   * Allergies — separate field from conditions because they carry
   * different clinical weight (drug/contrast-agent decisions ride on
   * them) and the user reports them differently. Empty array = none.
   *
   * Structured by category: each entry pairs a top-level allergy
   * category (drug / food / environmental / latex / other) with the
   * specific triggers the user identified on the dynamic follow-up
   * walk. `specifics` is empty when the category needed no detail
   * (latex), the user skipped the detail screen, or the user typed
   * only free-text into "other".
   */
  allergies: AllergyEntry[];
  /** Goals for this tracking — multi-select on the Focus screen. */
  focus: FocusArea[];
  /** How the user plans to log — calibrates daily-prompt UX + tone. */
  trackingStyle: TrackingStyle;
  careTeam: Clinician[];
  /** First-recording mic-area copy, tailored to dominant focus. */
  firstRecordingPrompt: string;
}

export type UserProfile = {
  onboardingComplete: boolean;
  /**
   * @deprecated — onboarding answers now live in
   * `usePendingRecordingStore.answers` (in-memory only) until the
   * paywall commits them via personalization. This field is no longer
   * read or written by the active flow; the v6 migration drops the
   * stored value but the type is kept for legacy access patterns.
   */
  onboardingAnswers?: Record<string, unknown>;
  subscriptionStatus: SubscriptionStatus;
  /** Expiration date for the active entitlement — used for both
   *  trial-end and active-plan renewal display. ISO string or null
   *  when not subscribed. The field name is historical; it covers
   *  both trial and paid lifecycles. */
  trialEndsAt: string | null;
  /** Which plan the user is on, derived from RevenueCat's
   *  productIdentifier on customer-info sync. Null when not
   *  subscribed. Used by Settings to surface plan + price. */
  planId: 'monthly' | 'annual' | null;
  /** Derived profile — set once the analyzing screen runs. Null before. */
  personalization: PersonalizationProfile | null;
};
