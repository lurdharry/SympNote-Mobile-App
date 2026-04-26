import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { generateBrief } from "@/services/ai";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import {
  type BriefWindowKind,
  labelForWindow,
  recordingsInWindow,
  resolveBriefWindow,
} from "@/utils/briefSource";
import { uuid } from "@/utils/uuid";
import type { Brief } from "@/stores/types";

export interface GenerateBriefArgs {
  /** Window scope. "sinceLastBrief" is the simple default; the others
   *  are explicit overrides. */
  windowKind: BriefWindowKind;
  /** Custom range in ms — only used when `windowKind` is "custom". */
  custom?: { startMs: number; endMs?: number };
  /** Optional audience tag; empty = "for everyone". */
  clinicianIds?: string[];
  /** Optional appointment link. */
  appointmentId?: string;
  /** Optional override for the auto-generated title. */
  title?: string;
}

const friendlyTitle = (
  windowLabel: string,
  startMs: number,
  endMs: number,
): string => {
  const sameYear = new Date(startMs).getFullYear() === new Date(endMs).getFullYear();
  const startStr = format(new Date(startMs), sameYear ? "MMM d" : "MMM d, yyyy");
  const endStr = format(new Date(endMs), "MMM d");
  // For non-custom windows the kind label reads better; custom uses range.
  return windowLabel === "Custom window" ? `${startStr} – ${endStr}` : windowLabel;
};

/**
 * One-shot brief generation — the primary "Generate" action. Resolves
 * the window, picks source recordings, calls the AI, persists the
 * resulting Brief into the store, and returns it. The UI is meant to
 * navigate into the brief detail screen on success.
 */
export const useGenerateBrief = () => {
  const profile = useProfileStore((s) => s.personalization);
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);

  return useMutation<Brief, Error, GenerateBriefArgs>({
    mutationFn: async (args) => {
      const allBriefs = useBriefsStore.getState().briefs;
      const allRecordings = useRecordingsStore.getState().recordings;

      const window = resolveBriefWindow(args.windowKind, allBriefs, args.custom);
      const recordings = recordingsInWindow(window, allRecordings);

      if (recordings.length === 0) {
        throw new Error("No notes in this window — record something first.");
      }

      const clinicianIds = args.clinicianIds ?? [];
      const clinicians = clinicianIds
        .map((id) => careTeam.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c);

      const windowLabel = labelForWindow(window);

      const content = await generateBrief({
        recordings,
        windowLabel,
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
        title:
          args.title ??
          friendlyTitle(
            windowLabel,
            parseISO(oldest).getTime(),
            parseISO(newest).getTime(),
          ),
      };

      useBriefsStore.getState().add(brief);
      return brief;
    },
  });
};
