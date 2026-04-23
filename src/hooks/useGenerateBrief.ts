import { useMutation } from '@tanstack/react-query';
import { generateAppointmentBrief } from '@/services/ai';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import type {
  Appointment,
  PersonalizationProfile,
  Recording,
} from '@/stores/types';

interface GenerateBriefArgs {
  appointment: Appointment;
  sourceRecordings: Recording[];
  profile?: PersonalizationProfile | null;
}

/**
 * Mutation wrapper around the Gemini brief-generation call. On success
 * it commits the brief to the appointments store along with the IDs of
 * the recordings that fed it (for staleness detection). Callers read
 * `isPending` to drive the loading UI and `mutate(...)` to kick it off.
 */
export const useGenerateBrief = () => {
  const setBrief = useAppointmentsStore((s) => s.setBrief);

  return useMutation({
    mutationFn: async ({
      appointment,
      sourceRecordings,
      profile,
    }: GenerateBriefArgs) => {
      const brief = await generateAppointmentBrief(
        appointment,
        sourceRecordings,
        profile,
      );
      return { brief, sourceIds: sourceRecordings.map((r) => r.id) };
    },
    onSuccess: (result, { appointment }) => {
      setBrief(appointment.id, result.brief, result.sourceIds);
    },
  });
};
