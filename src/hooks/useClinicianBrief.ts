import { useQuery } from '@tanstack/react-query';
import { generateClinicianBrief } from '@/services/ai';
import { useProfileStore } from '@/stores/useProfileStore';
import type {
  AppointmentBrief,
  Clinician,
  PersonalizationProfile,
  Recording,
} from '@/stores/types';

interface UseClinicianBriefArgs {
  /** Nullable so callers can invoke the hook before guarding on the
   *  clinician lookup — React's rules require all hooks to run before
   *  any early return. Passing null disables the query. */
  clinician: Clinician | undefined;
  sourceRecordings: Recording[];
  profile?: PersonalizationProfile | null;
}

const sameIds = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i += 1) if (sa[i] !== sb[i]) return false;
  return true;
};

/**
 * Fetch / auto-generate a brief for one clinician — the canonical
 * "what should I tell Dr. X" answer. Mirrors `useAppointmentBrief`'s
 * caching shape exactly, just keyed off the clinician's id rather
 * than an appointment.
 *
 *  - On mount the query fires when there's no cached brief that
 *    matches the current source set.
 *  - A previously-stored brief whose `briefSourceRecordingIds` match
 *    the current source set is fed in via `initialData` — that's a
 *    cache hit, no fetch.
 *  - When the user has recorded new entries, the source set changes,
 *    `initialData` is undefined, and the query refetches.
 *  - On success the brief is persisted onto the clinician via the
 *    profile store so it survives future remounts.
 */
export const useClinicianBrief = ({
  clinician,
  sourceRecordings,
  profile,
}: UseClinicianBriefArgs) => {
  const setClinicianBrief = useProfileStore((s) => s.setClinicianBrief);

  const sourceIds = sourceRecordings.map((r) => r.id);
  const storedIds = clinician?.briefSourceRecordingIds ?? [];
  const storedBriefMatches = !!clinician?.brief && sameIds(storedIds, sourceIds);
  const initialBrief = storedBriefMatches
    ? (clinician?.brief as AppointmentBrief)
    : undefined;

  return useQuery<AppointmentBrief>({
    queryKey: [
      'clinicianBrief',
      clinician?.id ?? '',
      [...sourceIds].sort().join(','),
      profile?.ageBand ?? '',
      profile?.knownConditions?.join(',') ?? '',
      profile?.focus?.join(',') ?? '',
    ],
    queryFn: async () => {
      if (!clinician) throw new Error('clinician missing');
      const brief = await generateClinicianBrief(clinician, sourceRecordings, profile);
      setClinicianBrief(clinician.id, brief, sourceIds);
      return brief;
    },
    initialData: initialBrief,
    enabled: !!clinician && sourceRecordings.length > 0,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });
};
