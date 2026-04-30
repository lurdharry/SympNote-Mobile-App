import { useMutation } from "@tanstack/react-query";
import { structureTranscript } from "@/services/ai";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import type { Recording } from "@/stores/types";

/** Fields needed to build a new recording when no row with `id`
 *  exists yet. Provide on first-call paths (overlay capture);
 *  omit when the recording is already persisted (detail-page
 *  re-extract). */
export type StructureMeta = Omit<Recording, "id" | "transcript" | "structured">;

export interface StructureArgs {
  /** Recording id the mutation upserts. */
  id: string;
  transcript: string;
  /** Required when no recording with this id exists yet. Ignored
   *  when one does (treated as an update). */
  meta?: StructureMeta;
}

/**
 * Mutation wrapper around the AI structuring call. On success the
 * result is upserted into the recordings store keyed by `id`:
 *   • If a row with that id exists → patch `transcript` + `structured`.
 *   • If not, and `meta` is provided → build a new row and add it.
 *   • If neither — caller is doing preview-then-commit (typed record
 *     flow); no store side-effect, the per-call `onSuccess` decides
 *     what to do.
 *
 * Caller can still wire its own `onSuccess` / `onError` to drive UI
 * (phase advance, toast, etc.); React Query fires both — global
 * first, then per-call.
 */
export const useStructureTranscript = () =>
  useMutation({
    mutationFn: ({ transcript }: StructureArgs) => structureTranscript(transcript),
    onSuccess: (structured, args) => {
      const existing = useRecordingsStore.getState().getById(args.id);
      if (existing) {
        useRecordingsStore.getState().update(args.id, {
          transcript: args.transcript,
          structured,
        });
        return;
      }
      if (args.meta) {
        useRecordingsStore.getState().add({
          id: args.id,
          transcript: args.transcript,
          structured,
          ...args.meta,
        });
        return;
      }
      // Preview path — caller will commit later via its own onSuccess.
    },
  });
