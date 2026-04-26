import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./mmkv";
import type { Brief, BriefContent } from "./types";

interface State {
  briefs: Brief[];
}

interface Actions {
  add: (brief: Brief) => void;
  update: (id: string, patch: Partial<Brief>) => void;
  remove: (id: string) => void;
  getById: (id: string) => Brief | undefined;
  /** Briefs visible to a clinician's filtered view: those tagged
   *  with their id, plus "everyone" briefs (empty clinicianIds). */
  forClinician: (clinicianId: string) => Brief[];
  /** Briefs that aren't tagged with any clinician — the "general"
   *  pool that feeds every clinician's view. */
  general: () => Brief[];
  /** Brief linked to a specific appointment, if any. */
  forAppointment: (appointmentId: string) => Brief | undefined;
  /** Most-recently-generated brief, regardless of tags. */
  latest: () => Brief | undefined;
  /** Set the linked appointment id on an existing brief. */
  linkAppointment: (briefId: string, appointmentId: string | undefined) => void;
  /** Replace the clinician tag set on an existing brief. */
  setClinicianIds: (briefId: string, clinicianIds: string[]) => void;
  /** Update title on an existing brief. */
  setTitle: (briefId: string, title: string) => void;
  /** Replace the AI content (used by regeneration). */
  setContent: (
    briefId: string,
    content: BriefContent,
    sourceRecordingIds: string[],
    generatedAt?: string,
  ) => void;
}

/**
 * The Brief collection — first-class store for synthesised briefs.
 * A brief is an immutable-ish snapshot; "regenerating" replaces its
 * content but keeps the same id so links survive. Tags
 * (`clinicianIds`, `appointmentId`) are mutable so the user can
 * re-share a brief with someone or attach it to a visit later.
 */
export const useBriefsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      briefs: [],

      add: (brief) =>
        set((s) => ({
          briefs: [brief, ...s.briefs].sort(
            (a, b) =>
              new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
          ),
        })),

      update: (id, patch) =>
        set((s) => ({
          briefs: s.briefs.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      remove: (id) =>
        set((s) => ({ briefs: s.briefs.filter((b) => b.id !== id) })),

      getById: (id) => get().briefs.find((b) => b.id === id),

      forClinician: (clinicianId) =>
        get().briefs.filter(
          (b) => b.clinicianIds.length === 0 || b.clinicianIds.includes(clinicianId),
        ),

      general: () => get().briefs.filter((b) => b.clinicianIds.length === 0),

      forAppointment: (appointmentId) =>
        get().briefs.find((b) => b.appointmentId === appointmentId),

      latest: () => get().briefs[0],

      linkAppointment: (briefId, appointmentId) =>
        set((s) => ({
          briefs: s.briefs.map((b) =>
            b.id === briefId ? { ...b, appointmentId } : b,
          ),
        })),

      setClinicianIds: (briefId, clinicianIds) =>
        set((s) => ({
          briefs: s.briefs.map((b) =>
            b.id === briefId ? { ...b, clinicianIds } : b,
          ),
        })),

      setTitle: (briefId, title) =>
        set((s) => ({
          briefs: s.briefs.map((b) => (b.id === briefId ? { ...b, title } : b)),
        })),

      setContent: (briefId, content, sourceRecordingIds, generatedAt) =>
        set((s) => ({
          briefs: s.briefs.map((b) =>
            b.id === briefId
              ? {
                  ...b,
                  content,
                  sourceRecordingIds,
                  generatedAt: generatedAt ?? new Date().toISOString(),
                }
              : b,
          ),
        })),
    }),
    {
      name: "briefs",
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
    },
  ),
);
