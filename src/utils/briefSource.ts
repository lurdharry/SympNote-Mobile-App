import { parseISO } from 'date-fns';
import type { Appointment, Recording } from '@/stores/types';

/** Fallback reach when there's no prior attended visit to anchor on. */
const DEFAULT_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

/**
 * The earliest moment (ms epoch) a recording may have been created to
 * be eligible for this appointment's brief. Anchored at the most recent
 * attended visit with the same doctor — everything since that visit is
 * "what's new to discuss". Falls back to 30 days before `now` when the
 * patient has no prior attended visit with this clinician.
 */
const windowStart = (
  appointment: Appointment,
  allAppointments: Appointment[],
  nowMs: number,
): number => {
  const doctor = appointment.doctorName.trim().toLowerCase();
  const thisApptMs = parseISO(appointment.date).getTime();
  const priorAttended = doctor
    ? allAppointments
        .filter(
          (a) =>
            a.id !== appointment.id &&
            a.status === 'attended' &&
            a.doctorName.trim().toLowerCase() === doctor,
        )
        .map((a) => parseISO(a.attendedAt ?? a.date).getTime())
        .filter((t) => t < thisApptMs)
        .sort((a, b) => b - a)[0]
    : undefined;
  return priorAttended ?? nowMs - DEFAULT_WINDOW_DAYS * DAY_MS;
};

/**
 * Pick which recordings feed the AI brief for a given appointment —
 * everything logged since the patient's last attended visit with the
 * same doctor, falling back to the last 30 days when no prior visit
 * exists. Returned oldest-first so the AI receives a chronological view.
 */
export const recordingsForAppointmentBrief = (
  appointment: Appointment,
  allRecordings: Recording[],
  allAppointments: Appointment[] = [],
): Recording[] => {
  const startMs = windowStart(appointment, allAppointments, Date.now());
  return allRecordings
    .filter((r) => parseISO(r.createdAt).getTime() >= startMs)
    .sort((a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime());
};

/**
 * Label describing the source window the brief is drawing from, e.g.
 * "since your visit on Mar 14" or "last 30 days". Used on the detail
 * screen so the user knows what's in scope without needing to curate
 * recordings themselves.
 */
export const briefSourceWindowLabel = (
  appointment: Appointment,
  allAppointments: Appointment[],
): string => {
  const doctor = appointment.doctorName.trim().toLowerCase();
  const thisApptMs = parseISO(appointment.date).getTime();
  const priorAttendedMs = doctor
    ? allAppointments
        .filter(
          (a) =>
            a.id !== appointment.id &&
            a.status === 'attended' &&
            a.doctorName.trim().toLowerCase() === doctor,
        )
        .map((a) => parseISO(a.attendedAt ?? a.date).getTime())
        .filter((t) => t < thisApptMs)
        .sort((a, b) => b - a)[0]
    : undefined;

  if (priorAttendedMs) {
    const d = new Date(priorAttendedMs);
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `since your visit on ${month} ${d.getDate()}`;
  }
  return `last ${DEFAULT_WINDOW_DAYS} days`;
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
