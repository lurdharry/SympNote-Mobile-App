/**
 * Real progress across the onboarding flow. Each stage contributes an
 * equal slice of XP so the paywall progress bar reflects what the user
 * has actually done, not a fabricated number.
 *
 * Stages tracked (4 total, 25 XP each):
 *   1. Qualifier — age band answered (required)
 *   2. Focus area picked
 *   3. Care team stage passed (answered, even if empty)
 *   4. First recording saved
 */

type Answers = Record<string, unknown>;

export interface OnboardingProgress {
  xp: number;
  total: number;
  stagesComplete: number;
  stagesTotal: number;
}

export const computeOnboardingProgress = (input: {
  answers: Answers;
  recordingCount: number;
}): OnboardingProgress => {
  const total = 100;
  const stagesTotal = 4;
  let stagesComplete = 0;

  if (typeof input.answers.ageBand === 'string' && input.answers.ageBand) {
    stagesComplete += 1;
  }

  const focus = input.answers.focus;
  if (Array.isArray(focus) ? focus.length > 0 : typeof focus === 'string' && focus) {
    stagesComplete += 1;
  }

  if ('careTeam' in input.answers || 'nextAppointment' in input.answers) {
    stagesComplete += 1;
  }

  if (input.recordingCount >= 1) stagesComplete += 1;

  const xp = Math.round((stagesComplete / stagesTotal) * total);
  return { xp, total, stagesComplete, stagesTotal };
};
