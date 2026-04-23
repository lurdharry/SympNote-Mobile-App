import { differenceInDays, parseISO } from 'date-fns';
import type { Appointment, Recording } from '@/stores/types';

/** How many days back we reach when the user hasn't attached recordings. */
const DEFAULT_WINDOW_DAYS = 30;

/**
 * Pick which recordings feed the AI brief for a given appointment.
 *
 *  - If the user has explicitly attached recordings via
 *    `relatedRecordingIds`, respect that curation (highest priority).
 *  - Else if any recordings are tagged for this appointment's doctor
 *    (matched by case-insensitive clinicianName), use that set — this
 *    is the clinician-specific "since last visit with Dr. X" proxy.
 *  - Else fall back to the last 30 days of entries.
 *
 * Returns recordings sorted oldest-first so the AI receives a
 * chronological view (earliest onset first, most recent last).
 */
export const recordingsForAppointmentBrief = (
  appointment: Appointment,
  allRecordings: Recording[],
): Recording[] => {
  const now = Date.now();

  let source: Recording[];
  if (appointment.relatedRecordingIds.length > 0) {
    const ids = new Set(appointment.relatedRecordingIds);
    source = allRecordings.filter((r) => ids.has(r.id));
  } else {
    const doctor = appointment.doctorName.trim().toLowerCase();
    const tagged = doctor
      ? allRecordings.filter(
          (r) =>
            r.clinicianName &&
            r.clinicianName.trim().toLowerCase() === doctor,
        )
      : [];
    if (tagged.length > 0) {
      source = tagged;
    } else {
      source = allRecordings.filter(
        (r) => differenceInDays(now, parseISO(r.createdAt).getTime()) <= DEFAULT_WINDOW_DAYS,
      );
    }
  }

  return [...source].sort(
    (a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime(),
  );
};

/**
 * Is the appointment's brief stale? True when at least one recording
 * has been added or modified since `briefGeneratedAt` and isn't in the
 * brief's source set. Returns false when no brief exists (caller should
 * offer "Generate" instead of "Regenerate" in that state).
 */
export const isBriefStale = (
  appointment: Appointment,
  allRecordings: Recording[],
): boolean => {
  if (!appointment.brief || !appointment.briefGeneratedAt) return false;
  const generatedAt = parseISO(appointment.briefGeneratedAt).getTime();
  const sourceIds = new Set(appointment.briefSourceRecordingIds);
  return allRecordings.some(
    (r) =>
      parseISO(r.createdAt).getTime() > generatedAt && !sourceIds.has(r.id),
  );
};
