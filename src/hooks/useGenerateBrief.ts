import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { generateBrief } from "@/services/ai";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useCareTeam, useProfileStore } from "@/stores/useProfileStore";
import { uuid } from "@/utils/uuid";
import type { Brief, Recording } from "@/stores/types";

export interface GenerateBriefArgs {
  /** The exact set of notes the user picked to include in this
   *  brief. Source-picker UI passes them in directly — no implicit
   *  window resolution at this layer. */
  recordings: Recording[];
  /** Optional audience tag; empty = "for everyone". */
  clinicianIds?: string[];
  /** Optional appointment link. */
  appointmentId?: string;
  /** Optional override for the auto-generated title. */
  title?: string;
}

const autoTitle = (recordings: Recording[]): string => {
  const sorted = [...recordings].sort(
    (a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime(),
  );
  const start = parseISO(sorted[0]!.createdAt);
  const end = parseISO(sorted[sorted.length - 1]!.createdAt);
  if (start.toDateString() === end.toDateString()) {
    return format(start, "MMM d");
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${format(start, sameYear ? "MMM d" : "MMM d, yyyy")} – ${format(end, "MMM d")}`;
};

/**
 * Brief generation. The caller (the source-picker screen) hands in
 * the exact recordings to synthesise — this hook owns the AI call,
 * the persistence, and nothing else. No implicit time-window or
 * staleness logic; that decision belongs in the picker UI.
 */
export const useGenerateBrief = () => {
  const profile = useProfileStore((s) => s.personalization);
  const careTeam = useCareTeam();

  return useMutation<Brief, Error, GenerateBriefArgs>({
    mutationFn: async (args) => {
      const recordings = [...args.recordings].sort(
        (a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime(),
      );
      if (recordings.length === 0) {
        throw new Error("Pick at least one note to include.");
      }

      const clinicianIds = args.clinicianIds ?? [];
      const clinicians = clinicianIds
        .map((id) => careTeam.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c);

      const title = args.title ?? autoTitle(recordings);

      const content = await generateBrief({
        recordings,
        windowLabel: title,
        clinicians: clinicians.length > 0 ? clinicians : undefined,
        profile,
      });

      const oldest = parseISO(recordings[0]!.createdAt).toISOString();
      const newest = parseISO(recordings[recordings.length - 1]!.createdAt).toISOString();

      const brief: Brief = {
        id: uuid(),
        generatedAt: new Date().toISOString(),
        windowStart: oldest,
        windowEnd: newest,
        sourceRecordingIds: recordings.map((r) => r.id),
        content,
        clinicianIds,
        appointmentId: args.appointmentId,
        title,
      };

      useBriefsStore.getState().add(brief);
      return brief;
    },
  });
};
