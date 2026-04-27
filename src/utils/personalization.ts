import type {
  AgeBand,
  AllergyEntry,
  Clinician,
  FocusArea,
  PersonalizationProfile,
  PregnancyStatus,
  PrepGap,
  SexAssigned,
  TrackingStyle,
} from '@/stores/types';

/**
 * Raw onboarding answers keyed by each question's `profileKey`. Each
 * value is the option `v` string for single-select, or a string[] for
 * multi-select (conditions), or an ISO string / 'none' for the
 * care-team date picker.
 */
export interface RawOnboardingAnswers {
  ageBand?: string;
  knownConditions?: string | string[];
  nextAppointment?: string;
  [key: string]: unknown;
}

const AGE_BANDS: readonly AgeBand[] = ['teen', '18-29', '30-49', '50-64', '65-plus'];
const SEXES: readonly SexAssigned[] = ['female', 'male', 'intersex', 'prefer-not'];
const PREGNANCY: readonly PregnancyStatus[] = ['yes', 'no', 'possibly', 'unknown'];
const TRACKING: readonly TrackingStyle[] = ['daily', 'episodic', 'mixed'];
const PREP_GAPS: readonly PrepGap[] = ['often', 'sometimes', 'occasional', 'rare'];

const FOCI: readonly FocusArea[] = [
  'investigate',
  'upcoming-visit',
  'patterns',
  'recovery-track',
  'mental-health',
  'general',
];

/**
 * Specificity order — most actionable / symptom-focused goals first.
 * Used to pick a dominant focus when the user selected multiple.
 */
const FOCUS_PRIORITY: readonly FocusArea[] = [
  'investigate',
  'recovery-track',
  'upcoming-visit',
  'patterns',
  'mental-health',
  'general',
];

const isFocusArea = (v: unknown): v is FocusArea =>
  typeof v === 'string' && (FOCI as readonly string[]).includes(v);

const coerce = <T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T,
): T =>
  typeof raw === 'string' && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;

const coerceFocusList = (raw: unknown): FocusArea[] => {
  const fallback: FocusArea[] = ['general'];
  if (Array.isArray(raw)) {
    const valid = Array.from(new Set(raw.filter(isFocusArea)));
    return valid.length > 0 ? valid : fallback;
  }
  if (isFocusArea(raw)) return [raw];
  return fallback;
};

/**
 * Coerce the conditions answer into a clean, de-duped string[]. Accepts
 * the live multi-select array form or a single string (legacy / edge
 * cases). Returns [] when nothing was picked.
 */
const coerceConditions = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(raw.filter((v): v is string => typeof v === 'string' && v.length > 0)),
    );
  }
  if (typeof raw === 'string' && raw.length > 0) return [raw];
  return [];
};

/**
 * Coerce the allergies answer into AllergyEntry[]. Accepts:
 *  - structured form: AllergyEntry[] from the dynamic walk
 *  - legacy flat form: string[] of categories (pre-v4 callers)
 * Specifics within a category are de-duped; the entries themselves
 * preserve insertion order (the order the user selected categories
 * on health-context).
 */
const coerceAllergies = (raw: unknown): AllergyEntry[] => {
  if (!Array.isArray(raw)) return [];
  const out: AllergyEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'string' && item.length > 0) {
      if (seen.has(item)) continue;
      seen.add(item);
      out.push({ category: item, specifics: [] });
      continue;
    }
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as AllergyEntry).category === 'string'
    ) {
      const e = item as AllergyEntry;
      if (seen.has(e.category)) continue;
      seen.add(e.category);
      const specifics = Array.isArray(e.specifics)
        ? Array.from(
            new Set(
              e.specifics.filter(
                (v): v is string => typeof v === 'string' && v.length > 0,
              ),
            ),
          )
        : [];
      out.push({ category: e.category, specifics });
    }
  }
  return out;
};

const dominantFocus = (list: FocusArea[]): FocusArea =>
  FOCUS_PRIORITY.find((f) => list.includes(f)) ?? list[0] ?? 'general';

/**
 * Mic-area copy for the first-recording screen, tailored to the user's
 * dominant focus so the prompt matches their mental model.
 */
export const pickFirstRecordingPrompt = (focusList: FocusArea[]): string => {
  switch (dominantFocus(focusList)) {
    case 'investigate':
      return 'Walk us through what feels new or different.';
    case 'recovery-track':
      return 'Tell us how recovery is going today.';
    case 'upcoming-visit':
      return 'Tell us what you want to bring up with your doctor.';
    case 'patterns':
      return "Describe what's different today compared to your baseline.";
    case 'mental-health':
      return "Share how you're feeling. Mood, sleep, anything that stood out.";
    case 'general':
    default:
      return "Tell us what's going on today.";
  }
};

/**
 * Map raw onboarding answers + focus + care team into the typed
 * profile. Pure function — unit-testable and idempotent.
 */
export const buildPersonalizationProfile = (
  answers: RawOnboardingAnswers,
  focusRaw: unknown,
  careTeam: Clinician[],
): PersonalizationProfile => {
  const ageBand = coerce(answers.ageBand, AGE_BANDS, '30-49');
  const sex = coerce(answers.sex, SEXES, 'prefer-not');
  const pregnancyStatus = coerce(answers.pregnancyStatus, PREGNANCY, 'unknown');
  const knownConditions = coerceConditions(answers.knownConditions);
  const allergies = coerceAllergies(answers.allergies);
  const trackingStyle = coerce(answers.trackingStyle, TRACKING, 'mixed');
  const focus = coerceFocusList(focusRaw);
  const prepGap = coerce(answers.prepGap, PREP_GAPS, 'sometimes');

  return {
    ageBand,
    sex,
    pregnancyStatus,
    knownConditions,
    allergies,
    focus,
    trackingStyle,
    careTeam,
    prepGap,
    firstRecordingPrompt: pickFirstRecordingPrompt(focus),
  };
};
