import { useCallback, useEffect, useRef, useState } from 'react';
import { omit } from 'lodash';
import { useProfileStore } from '@/stores/useProfileStore';
import { hapticLight } from '@/services/haptics';
import {
  Option,
  QUALIFIER_TIMINGS,
  Question,
  QUESTIONS,
} from '@/constants/onboarding';

type Phase = 'typing' | 'answering' | 'advancing' | 'complete';

/**
 * A stored answer is a single option (single-select question) or an
 * array of options (multi-select). The UI renders labels from this
 * shape for the chat-bubble history.
 */
export type QualifierAnswer = Option | Option[];

export interface QualifierFlow {
  questions: Question[];
  step: number;
  current: Question;
  answers: Record<string, QualifierAnswer>;
  typing: boolean;
  complete: boolean;
  answer: (value: QualifierAnswer) => void;
  /**
   * Advance past the current question without persisting. Downstream
   * derivation falls back to defaults for skipped answers.
   */
  skip: () => void;
  back: () => void;
}

/**
 * Extract the machine value(s) from an answer and persist them under
 * the question's `profileKey`. Single → string, multi → string[].
 */
const persistedValue = (answer: QualifierAnswer): string | string[] =>
  Array.isArray(answer) ? answer.map((o) => o.v) : answer.v;

/**
 * Drives the onboarding qualifier chat. Owns the step cursor, per-
 * question answer map, typing timings. Persists each answer's machine
 * value (single string or string[] for multi-select) under the
 * question's `profileKey`.
 */
export const useQualifierFlow = (onComplete: () => void): QualifierFlow => {
  const setProfileAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QualifierAnswer>>({});
  const [phase, setPhase] = useState<Phase>('typing');

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    [],
  );

  const current = QUESTIONS[step]!;

  useEffect(() => {
    setPhase('typing');
    const id = scheduleTimeout(
      () => setPhase('answering'),
      QUALIFIER_TIMINGS.typingMs,
    );
    return () => clearTimeout(id);
  }, [step, scheduleTimeout]);

  const answer = useCallback(
    (value: QualifierAnswer) => {
      hapticLight();
      setAnswers((prev) => ({ ...prev, [current.id]: value }));
      setProfileAnswer(current.profileKey, persistedValue(value));

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
    [current, step, scheduleTimeout, setProfileAnswer, onComplete],
  );

  const skip = useCallback(() => {
    hapticLight();
    // Mirror answer()'s advance, but don't persist anything.
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
  }, [step, scheduleTimeout, onComplete]);

  const back = useCallback(() => {
    if (step === 0) return;
    const prevStep = step - 1;
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
    typing: phase === 'typing',
    complete: phase === 'complete',
    answer,
    skip,
    back,
  };
};
