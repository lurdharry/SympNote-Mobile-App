import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { compact, omit } from 'lodash';
import { useProfileStore } from '@/stores/useProfileStore';
import { hapticLight } from '@/services/haptics';
import {
  Option,
  PLAN_UNLOCKS,
  PlanItem,
  QUALIFIER_TIMINGS,
  Question,
  QUESTIONS,
} from '@/constants/onboarding';

type Phase = 'typing' | 'answering' | 'advancing' | 'complete';

export type QualifierFlow = {
  /** All questions (stable reference). */
  questions: Question[];
  /** Index of the question currently being asked. */
  step: number;
  /** Current question. */
  current: Question;
  /** Map of question id → Option. Only contains answered questions up to `step`. */
  answers: Record<string, Option>;
  /** Plan-card rows derived from answers above the cursor. */
  planItems: PlanItem[];
  /**
   * True while the assistant's "typing" indicator is showing. Answer
   * chips should disable during this window so the user can't race
   * ahead of the prompt.
   */
  typing: boolean;
  /** True once the last answer has been recorded and routing is imminent. */
  complete: boolean;
  /** Record an answer for the current question and advance. */
  answer: (opt: Option) => void;
  /** Step back one question, dropping that answer and any after it. */
  back: () => void;
};

/**
 * Drives the onboarding qualifier (screen 02). Owns the step cursor,
 * local answer map, plan-card derivation, and the staged advance/typing
 * timings. Persists each answer's label into the profile store so the
 * analyzing + paywall screens can reference it.
 *
 * `onComplete` fires once the user answers the final question — the
 * screen uses it to route forward. The hook manages timer cleanup so
 * the screen doesn't need to.
 */
export function useQualifierFlow(onComplete: () => void): QualifierFlow {
  const setProfileAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Option>>({});
  const [phase, setPhase] = useState<Phase>('typing');

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scheduleTimeout = useCallback(
    (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timersRef.current = timersRef.current.filter((t) => t !== id);
        fn();
      }, ms);
      timersRef.current.push(id);
      return id;
    },
    []
  );

  // Clean up any pending timeouts on unmount so they don't fire after
  // the screen is gone.
  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    []
  );

  const current = QUESTIONS[step]!;

  // Enter "typing" whenever the step changes; flip to "answering" after
  // the chat-like delay so the chip tray activates.
  useEffect(() => {
    setPhase('typing');
    const id = scheduleTimeout(
      () => setPhase('answering'),
      QUALIFIER_TIMINGS.typingMs
    );
    return () => clearTimeout(id);
  }, [step, scheduleTimeout]);

  const planItems = useMemo<PlanItem[]>(() => {
    // Drive from QUESTIONS order (not Object.keys) so the list is
    // deterministic and slicing to `step` naturally hides any answer
    // the user has walked back past.
    return compact(
      QUESTIONS.slice(0, step).map((q) => {
        const a = answers[q.id];
        if (!a) return null;
        return PLAN_UNLOCKS[`${q.id}:${a.v}`] ?? null;
      }),
    );
  }, [answers, step]);

  const answer = useCallback(
    (opt: Option) => {
      hapticLight();
      setAnswers((prev) => ({ ...prev, [current.id]: opt }));
      setProfileAnswer(current.profileKey, opt.t);

      const isLast = step >= QUESTIONS.length - 1;
      scheduleTimeout(() => {
        if (isLast) {
          setPhase('complete');
          scheduleTimeout(onComplete, QUALIFIER_TIMINGS.completeMs);
        } else {
          setPhase('advancing');
          setStep((s) => s + 1);
        }
      }, QUALIFIER_TIMINGS.advanceMs);
    },
    [current, step, scheduleTimeout, setProfileAnswer, onComplete]
  );

  const back = useCallback(() => {
    if (step === 0) return;
    const prevStep = step - 1;
    // Drop every answer at or after the step we're returning to, both
    // locally and in the persisted profile, so the plan card + paywall
    // progress reflect only what's still "locked in".
    const toDrop = QUESTIONS.slice(prevStep);
    setAnswers((prev) => omit(prev, toDrop.map((q) => q.id)));
    toDrop.forEach((q) => setProfileAnswer(q.profileKey, ''));
    setStep(prevStep);
  }, [step, setProfileAnswer]);

  return {
    questions: QUESTIONS,
    step,
    current,
    answers,
    planItems,
    typing: phase === 'typing',
    complete: phase === 'complete',
    answer,
    back,
  };
}
