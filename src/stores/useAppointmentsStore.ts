import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';
import { Appointment } from './types';

type State = {
  appointments: Appointment[];
};

type Actions = {
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
  updateQuestion: (
    appointmentId: string,
    index: number,
    next: string
  ) => void;
};

export const useAppointmentsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      appointments: [],
      add: (a) =>
        set((s) => ({
          appointments: [a, ...s.appointments].sort(
            (x, y) => new Date(x.date).getTime() - new Date(y.date).getTime()
          ),
        })),
      update: (id, patch) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        })),
      remove: (id) =>
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
        })),
      getById: (id) => get().appointments.find((a) => a.id === id),
      upcoming: () =>
        get()
          .appointments.filter((a) => new Date(a.date).getTime() >= Date.now() - 86400000)
          .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime()),
      next: () => {
        const up = get().appointments
          .filter((a) => new Date(a.date).getTime() >= Date.now())
          .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
        return up[0];
      },
      attachRecording: (appointmentId, recordingId) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  relatedRecordingIds: Array.from(
                    new Set([...a.relatedRecordingIds, recordingId])
                  ),
                }
              : a
          ),
        })),
      addQuestion: (appointmentId, question) => {
        const q = question.trim();
        if (!q) return;
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  brief: {
                    questions: [...(a.brief?.questions ?? []), q],
                  },
                }
              : a
          ),
        }));
      },
      removeQuestion: (appointmentId, index) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  brief: {
                    questions: (a.brief?.questions ?? []).filter(
                      (_, i) => i !== index
                    ),
                  },
                }
              : a
          ),
        })),
      updateQuestion: (appointmentId, index, next) => {
        const q = next.trim();
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  brief: {
                    questions: (a.brief?.questions ?? []).map((old, i) =>
                      i === index ? q : old
                    ),
                  },
                }
              : a
          ),
        }));
      },
    }),
    {
      name: 'appointments',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
