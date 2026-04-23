import { useEffect, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { parseISO } from 'date-fns';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import type { Clinician, PersonalizationProfile } from '@/stores/types';
import { buildPersonalizationProfile } from '@/utils/personalization';
import { uuid } from '@/utils/uuid';
import { hapticLight, hapticSuccess } from '@/services/haptics';
import {
  ANALYZING_STEPS,
  READY_SETTLE_MS,
  STEP_MIN_MS,
  XP_PER_STEP,
} from '@/constants/analyzing';

type DoneTuple = [boolean, boolean, boolean];

export interface AnalyzingFlow {
  done: DoneTuple;
  activeText: number;
  ready: boolean;
  confetti: boolean;
  xpEarned: number;
  xpTotal: number;
  completedCount: number;
  progressSv: SharedValue<number>;
  xpPulse: SharedValue<number>;
  caretOpacity: SharedValue<number>;
}

const STEP_COUNT = ANALYZING_STEPS.length;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse the `careTeam` onboarding answer into typed Clinician[]. The
 * raw value may be undefined or shaped as `[{ name, role }, ...]`.
 */
const readCareTeam = (raw: unknown): Clinician[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const name = (item as { name?: unknown }).name;
      const role = (item as { role?: unknown }).role;
      if (typeof name !== 'string' || !name) return null;
      return { name, role: typeof role === 'string' ? role : 'Clinician' };
    })
    .filter((c): c is Clinician => c !== null);
};

/**
 * Seed a pending Appointment from the `nextAppointment` onboarding
 * answer. Does nothing when the answer is missing or 'none'. The first
 * clinician in the care team (if any) gets credit as the doctor —
 * users can always edit the appointment later.
 */
const seedPendingAppointment = (
  rawDate: unknown,
  careTeam: Clinician[],
): void => {
  if (typeof rawDate !== 'string' || !rawDate || rawDate === 'none') return;
  let iso: string;
  try {
    iso = parseISO(rawDate).toISOString();
  } catch {
    return;
  }
  const lead = careTeam[0];
  useAppointmentsStore.getState().add({
    id: uuid(),
    title: lead ? `Visit with ${lead.name}` : 'Upcoming visit',
    doctorName: lead?.name ?? 'Your clinician',
    specialty: lead?.role ?? 'General',
    date: iso,
    relatedRecordingIds: [],
    summary: null,
    generatedAt: null,
  });
};

/**
 * Owns the state for the onboarding "Analyzing" screen. Unlike the
 * previous version (fake setTimeouts), this actually does the work in
 * three phases:
 *
 *  1. Derive + persist the PersonalizationProfile from onboarding answers
 *  2. Seed a pending appointment if the user entered one on the care-team screen
 *  3. Finalize — hapticSuccess, confetti, ready flag
 *
 * Each step is floored to `STEP_MIN_MS[i]` so the animation still reads
 * intentionally even though the underlying work is essentially instant.
 */
export const useAnalyzingFlow = (reduced: boolean): AnalyzingFlow => {
  const [done, setDone] = useState<DoneTuple>([false, false, false]);
  const [activeText, setActiveText] = useState(0);
  const [ready, setReady] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const completedCount = done.filter(Boolean).length;
  const xpEarned = completedCount * XP_PER_STEP;
  const xpTotal = STEP_COUNT * XP_PER_STEP;

  const progressSv = useSharedValue(0);
  const xpSv = useSharedValue(0);
  const xpPulse = useSharedValue(0);

  useEffect(() => {
    const target = completedCount / STEP_COUNT;
    if (reduced) {
      progressSv.value = target;
      xpSv.value = xpEarned;
      return;
    }
    progressSv.value = withTiming(target, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    xpSv.value = withTiming(xpEarned, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    const popTo = completedCount === STEP_COUNT ? 1.22 : 1.12;
    xpPulse.value = withSequence(
      withTiming(popTo, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 9, stiffness: 180 }),
    );
  }, [completedCount, xpEarned, reduced, progressSv, xpSv, xpPulse]);

  const caretOpacity = useSharedValue(1);
  useEffect(() => {
    if (reduced) {
      caretOpacity.value = 1;
      return;
    }
    caretOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.15, { duration: 420, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [reduced, caretOpacity]);

  useEffect(() => {
    let cancelled = false;

    const markDone = (i: number) => {
      if (cancelled) return;
      setDone((d) => {
        const next = [...d] as DoneTuple;
        next[i] = true;
        return next;
      });
      if (i < STEP_COUNT - 1) setActiveText(i + 1);
      hapticLight();
    };

    const run = async () => {
      // -------- Step 1: derive + persist the PersonalizationProfile --------
      const t0 = Date.now();
      const { onboardingAnswers, setPersonalization } = useProfileStore.getState();
      const careTeam = readCareTeam(onboardingAnswers.careTeam);
      const profile: PersonalizationProfile = buildPersonalizationProfile(
        onboardingAnswers,
        onboardingAnswers.focus,
        careTeam,
      );
      setPersonalization(profile);
      await wait(Math.max(0, STEP_MIN_MS[0] - (Date.now() - t0)));
      markDone(0);

      // -------- Step 2: seed a pending appointment if provided --------
      const t1 = Date.now();
      seedPendingAppointment(onboardingAnswers.nextAppointment, careTeam);
      await wait(Math.max(0, STEP_MIN_MS[1] - (Date.now() - t1)));
      markDone(1);

      // -------- Step 3: finalize --------
      const t2 = Date.now();
      await wait(Math.max(0, STEP_MIN_MS[2] - (Date.now() - t2)));
      markDone(2);

      await wait(READY_SETTLE_MS);
      if (cancelled) return;
      setReady(true);
      setConfetti(true);
      hapticSuccess();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    done,
    activeText,
    ready,
    confetti,
    xpEarned,
    xpTotal,
    completedCount,
    progressSv,
    xpPulse,
    caretOpacity,
  };
};

