import { useQuery } from '@tanstack/react-query';
import { generateAppointmentBrief } from '@/services/ai';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import type {
  Appointment,
  AppointmentBrief,
  PersonalizationProfile,
  Recording,
} from '@/stores/types';

interface UseAppointmentBriefArgs {
  /** Nullable so callers can invoke the hook before guarding on the
   * appointment lookup — React's rules require all hooks to run before
   * any early return. Passing null disables the query. */
  appointment: Appointment | undefined;
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
 * Fetch / auto-generate a visit brief for one appointment. Declarative
 * in shape — React Query owns the whole lifecycle:
 *
 *  - On mount the query fires automatically when there's no cached
 *    brief that matches the current source-recording set.
 *  - A previously-generated brief stored on the appointment is fed in
 *    via `initialData` when its `briefSourceRecordingIds` match the
 *    current source recordings. Matching → cache hit, no fetch.
 *    Mismatched (user has since recorded new entries) → initialData
 *    is undefined and the query refetches a fresh brief.
 *  - `staleTime: Infinity` and `refetchOnMount: false` keep a fresh
 *    brief sticky; it won't be regenerated without a real reason
 *    (new recording changes the `queryKey`, or the caller invokes
 *    `refetch()` via a regenerate action).
 *  - `enabled: sourceRecordings.length > 0` skips the fetch entirely
 *    until there's at least one entry to feed the model.
 *
 * On success the result is persisted to the Zustand store so the
 * brief survives future remounts without another API call.
 */
export const useAppointmentBrief = ({
  appointment,
  sourceRecordings,
  profile,
}: UseAppointmentBriefArgs) => {
  const setBrief = useAppointmentsStore((s) => s.setBrief);

  const sourceIds = sourceRecordings.map((r) => r.id);
  const storedIds = appointment?.briefSourceRecordingIds ?? [];
  const storedBriefMatches =
    !!appointment?.brief && sameIds(storedIds, sourceIds);
  const initialBrief = storedBriefMatches
    ? (appointment?.brief as AppointmentBrief)
    : undefined;

  return useQuery<AppointmentBrief>({
    queryKey: [
      'appointmentBrief',
      appointment?.id ?? '',
      [...sourceIds].sort().join(','),
      profile?.ageBand ?? '',
      profile?.knownConditions?.join(',') ?? '',
      profile?.focus?.join(',') ?? '',
    ],
    queryFn: async () => {
      if (!appointment) throw new Error('appointment missing');
      const brief = await generateAppointmentBrief(
        appointment,
        sourceRecordings,
        profile,
      );
      setBrief(appointment.id, brief, sourceIds);
      return brief;
    },
    initialData: initialBrief,
    enabled: !!appointment && sourceRecordings.length > 0,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 0,
  });
};
