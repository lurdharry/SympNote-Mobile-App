import * as StoreReview from 'expo-store-review';
import { storage } from '@/stores/mmkv';

/**
 * Brief counts at which we trigger Apple's in-app review prompt.
 * Apple caps total prompts at 3 per user per 365 days, so we spend
 * them on moments of compounding goodwill: first magic moment, then
 * habit confirmation, then power-user validation. Asking sooner
 * (e.g. on first launch) catches users before they've felt the value.
 */
const BRIEF_MILESTONES = [1, 3, 7] as const;

const milestoneKey = (count: number) => `review_asked_at_brief_${count}`;

/**
 * Triggers the in-app review prompt if the user has just hit one of
 * the configured milestones AND we haven't already asked at that
 * milestone. Idempotent — safe to call from a useEffect that re-runs.
 *
 * Call this after the brief has rendered successfully (the emotional
 * peak) — never on errors, empty briefs, or the onboarding draft.
 */
export const maybeRequestReviewAtBriefPeak = async (briefCount: number): Promise<void> => {
  if (!BRIEF_MILESTONES.includes(briefCount as (typeof BRIEF_MILESTONES)[number])) return;

  const key = milestoneKey(briefCount);
  if (storage.getString(key)) return;

  const available = await StoreReview.isAvailableAsync();
  if (!available) return;

  storage.set(key, new Date().toISOString());
  await StoreReview.requestReview();
};
