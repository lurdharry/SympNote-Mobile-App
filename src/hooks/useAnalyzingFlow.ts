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
import { hapticLight, hapticSuccess } from '@/services/haptics';
import {
  ANALYZING_STEPS,
  READY_AT_MS,
  STEP_TIMELINE,
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

/**
 * Owns the animation state machine for the onboarding "Analyzing" screen:
 *  - scheduled step-completion timers
 *  - spring-animated progress + XP shared values
 *  - blinking caret opacity
 *  - confetti + ready flag
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
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEP_TIMELINE.forEach((ms, stepIndex) => {
      timers.push(
        setTimeout(() => {
          setDone((d) => {
            const next = [...d] as DoneTuple;
            next[stepIndex] = true;
            return next;
          });
          if (stepIndex < STEP_COUNT - 1) setActiveText(stepIndex + 1);
          hapticLight();
        }, ms),
      );
    });

    timers.push(
      setTimeout(() => {
        setReady(true);
        setConfetti(true);
        hapticSuccess();
      }, READY_AT_MS),
    );

    return () => timers.forEach(clearTimeout);
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
