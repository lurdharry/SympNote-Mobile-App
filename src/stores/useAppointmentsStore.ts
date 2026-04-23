import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { parseISO, subDays } from 'date-fns';
import { sortBy } from 'lodash';
import { mmkvStorage } from './mmkv';
import { Appointment, AppointmentBrief } from './types';

const byDateAsc = (a: Appointment): number => parseISO(a.date).getTime();

/** An AppointmentBrief shell — used when the user edits questions
 *  before the full AI brief has been generated. The AI generation step
 *  later overwrites all fields except `questions`, which it merges. */
const emptyBrief = (): AppointmentBrief => ({
  summary: '',
  topConcerns: [],
  timeline: [],
  patterns: [],
  medications: [],
  questions: [],
  flags: [],
});

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
  brief: a.brief
    ? { ...a.brief, questions: next(a.brief.questions) }
    : { ...emptyBrief(), questions: next([]) },
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
  /** Push a question onto the appointment's brief. */
  addQuestion: (appointmentId: string, question: string) => void;
  /** Remove a question by its index in `brief.questions`. */
  removeQuestion: (appointmentId: string, index: number) => void;
  /** Replace an existing question in place. */
  updateQuestion: (appointmentId: string, index: number, next: string) => void;
  /**
   * Commit a freshly generated AI brief. Preserves user-edited questions
   * by merging them in on top of whatever the AI returned, so manual
   * edits survive regeneration.
   */
  setBrief: (
    appointmentId: string,
    brief: AppointmentBrief,
    sourceRecordingIds: string[],
  ) => void;
  /** Forget the brief (lets the user regenerate from scratch). */
  clearBrief: (appointmentId: string) => void;
  /**
   * Lifecycle transitions — called from the post-visit prompt on home
   * and the action menu on the appointment detail screen. Each sets
   * the status and, where relevant, a timestamp / note.
   *  - `markAttended` optionally captures an outcome note (user-typed,
   *    short free text).
   *  - `reopenAppointment` flips any terminal status back to 'upcoming'
   *    in case the user marked the wrong one.
   */
  markAttended: (appointmentId: string, outcome?: string) => void;
  markMissed: (appointmentId: string) => void;
  markCancelled: (appointmentId: string) => void;
  reopenAppointment: (appointmentId: string) => void;
  /**
   * Past appointments still sitting in 'upcoming' state — used by the
   * home-screen prompt to nudge the user to categorize them.
   * Today's appointments are NOT included; the prompt kicks in the day
   * after.
   */
  unresolvedPast: () => Appointment[];
  /** All appointments in a terminal state (attended/missed/cancelled). */
  past: () => Appointment[];
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

      setBrief: (appointmentId, brief, sourceRecordingIds) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) => {
            // Preserve user-authored questions by prepending them to
            // whatever the AI returned (dedup by lowercase match).
            const userQs = a.brief?.questions ?? [];
            const aiQs = brief.questions;
            const seen = new Set(userQs.map((q) => q.trim().toLowerCase()));
            const merged = [
              ...userQs,
              ...aiQs.filter((q) => !seen.has(q.trim().toLowerCase())),
            ];
            return {
              ...a,
              brief: { ...brief, questions: merged },
              briefGeneratedAt: new Date().toISOString(),
              briefSourceRecordingIds: sourceRecordingIds,
            };
          }),
        })),

      clearBrief: (appointmentId) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) => ({
            ...a,
            brief: null,
            briefGeneratedAt: null,
            briefSourceRecordingIds: [],
          })),
        })),

      markAttended: (appointmentId, outcome) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) => ({
            ...a,
            status: 'attended',
            attendedAt: new Date().toISOString(),
            outcome: outcome?.trim() ? outcome.trim() : a.outcome,
          })),
        })),

      markMissed: (appointmentId) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) => ({
            ...a,
            status: 'missed',
          })),
        })),

      markCancelled: (appointmentId) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) => ({
            ...a,
            status: 'cancelled',
          })),
        })),

      reopenAppointment: (appointmentId) =>
        set((s) => ({
          appointments: patchOne(s.appointments, appointmentId, (a) => ({
            ...a,
            status: 'upcoming',
            attendedAt: null,
            outcome: null,
          })),
        })),

      unresolvedPast: () => {
        // "Day after" cutoff: appointment's date is before the start of
        // today (local time). We keep today's appointments in 'upcoming'
        // so the prompt doesn't fire mid-visit.
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return sortBy(
          get().appointments.filter(
            (a) =>
              a.status === 'upcoming' &&
              parseISO(a.date).getTime() < startOfToday.getTime(),
          ),
          byDateAsc,
        );
      },

      past: () =>
        sortBy(
          get().appointments.filter((a) => a.status !== 'upcoming'),
          (a) => -parseISO(a.date).getTime(),
        ),
    }),
    {
      name: 'appointments',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
      migrate: (persisted, version) => {
        // v0 → v1: add status / attendedAt / outcome defaults to every
        // appointment so existing users land in 'upcoming' and can
        // categorize past visits through the new prompt.
        if (version === 0) {
          const s = persisted as { appointments?: Appointment[] };
          return {
            ...s,
            appointments: (s.appointments ?? []).map((a) => ({
              ...a,
              status: a.status ?? 'upcoming',
              attendedAt: a.attendedAt ?? null,
              outcome: a.outcome ?? null,
            })),
          };
        }
        return persisted as State;
      },
    },
  ),
);
