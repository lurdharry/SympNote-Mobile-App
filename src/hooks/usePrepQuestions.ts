import { useCallback } from 'react';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { hapticLight, hapticSuccess } from '@/services/haptics';

export interface PrepQuestionsApi {
  canEdit: boolean;
  add: (question: string) => void;
  remove: (index: number) => void;
}

/**
 * Wraps appointment-question CRUD for the Prep tab. Returns no-ops and
 * `canEdit: false` when the row is a demo (no appointmentId) so the UI
 * can hide its mutation affordances without branching on the id itself.
 */
export const usePrepQuestions = (appointmentId: string | null): PrepQuestionsApi => {
  const add = useCallback(
    (question: string) => {
      if (!appointmentId) return;
      const trimmed = question.trim();
      if (!trimmed) return;
      useAppointmentsStore.getState().addQuestion(appointmentId, trimmed);
      hapticSuccess();
    },
    [appointmentId],
  );

  const remove = useCallback(
    (index: number) => {
      if (!appointmentId) return;
      hapticLight();
      useAppointmentsStore.getState().removeQuestion(appointmentId, index);
    },
    [appointmentId],
  );

  return { canEdit: appointmentId !== null, add, remove };
};
