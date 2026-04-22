import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { parseISO, subDays } from 'date-fns';
import { sortBy, uniq } from 'lodash';
import { mmkvStorage } from './mmkv';
import { Appointment } from './types';

const byDateAsc = (a: Appointment): number => parseISO(a.date).getTime();

/** Apply `patch` to the appointment with the given id, leaving others alone. */
const patchOne = (
  list: Appointment[],
  id: string,
  patch: (a: Appointment) => Appointment,
): Appointment[] => list.map((a) => (a.id === id ? patch(a) : a));

const patchQuestions = (
  a: Appointment,
  next: (questions: string[]) => string[],
): Appointment => ({
  ...a,
  brief: { questions: next(a.brief?.questions ?? []) },
});

interface State {
  appointments: Appointment[];
}

interface Actions {
  add: (a: Appointment) => void;
  update: (id: string, patch: Partial<Appointment>) => void;
  remove: (id: string) => void;
  getById: (id: string) => Appointment | undefined;
  upcoming: () => Appointment[];
  next: () => Appointment | undefined;
  attachRecording: (appointmentId: string, recordingId: string) => void;
  /** Push a question onto the appointment's brief. */
  addQuestion: (appointmentId: string, question: string) => void;
  /** Remove a question by its index in `brief.questions`. */
  removeQuestion: (appointmentId: string, index: number) => void;
  /** Replace an existing question in place. */
  updateQuestion: (appointmentId: string, index: number, next: string) => void;
}

export const useAppointmentsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      appointments: [],

      add: (a) =>
        set((s) => ({
          appointments: sortBy([a, ...s.appointments], byDateAsc),
        })),

      update: (id, patch) =>
        set((s) => ({
          appointments: patchOne(s.appointments, id, (a) => ({ ...a, ...patch })),
        })),

      remove: (id) =>
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
        })),

      getById: (id) => get().appointments.find((a) => a.id === id),

      upcoming: () => {
        const cutoff = subDays(new Date(), 1).getTime();
        return sortBy(
          get().appointments.filter((a) => parseISO(a.date).getTime() >= cutoff),
          byDateAsc,
        );
      },

      next: () => {
        const now = Date.now();
        return sortBy(
          get().appointments.filter((a) => parseISO(a.date).getTime() >= now),
          byDateAsc,
        )[0];
      },

      attachRecording: (appointmentId, recordingId) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) => ({
            ...a,
            relatedRecordingIds: uniq([...a.relatedRecordingIds, recordingId]),
          })),
        })),

      addQuestion: (appointmentId, question) => {
        const q = question.trim();
        if (!q) return;
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) =>
            patchQuestions(a, (qs) => [...qs, q]),
          ),
        }));
      },

      removeQuestion: (appointmentId, index) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) =>
            patchQuestions(a, (qs) => qs.filter((_, i) => i !== index)),
          ),
        })),

      updateQuestion: (appointmentId, index, next) => {
        const q = next.trim();
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) =>
            patchQuestions(a, (qs) => qs.map((old, i) => (i === index ? q : old))),
          ),
        }));
      },
    }),
    {
      name: 'appointments',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
