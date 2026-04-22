import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';
import { Recording } from './types';

type State = {
  recordings: Recording[];
};

type Actions = {
  add: (r: Recording) => void;
  update: (id: string, patch: Partial<Recording>) => void;
  remove: (id: string) => void;
  getById: (id: string) => Recording | undefined;
  recent: (n: number) => Recording[];
};

export const useRecordingsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      recordings: [],
      add: (r) =>
        set((s) => ({
          recordings: [r, ...s.recordings],
        })),
      update: (id, patch) =>
        set((s) => ({
          recordings: s.recordings.map((r) =>
            r.id === id ? { ...r, ...patch } : r
          ),
        })),
      remove: (id) =>
        set((s) => ({
          recordings: s.recordings.filter((r) => r.id !== id),
        })),
      getById: (id) => get().recordings.find((r) => r.id === id),
      recent: (n) => get().recordings.slice(0, n),
    }),
    {
      name: 'recordings',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
