import { parseISO } from 'date-fns';
import type { Appointment, Recording } from '@/stores/types';

/** Fallback reach when there's no prior attended visit to anchor on. */
const DEFAULT_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

interface Anchor {
  ms: number;
  /** True when the anchor comes from a visit with the same clinician. */
  sameDoctor: boolean;
}

/**
 * Find the moment (ms epoch) to anchor this appointment's source window
 * on, and remember whether that anchor was the same clinician.
 *
 *  - Prefer the most recent attended visit with the SAME doctor —
 *    that's "since we last spoke" for this specific clinician.
 *  - Otherwise (brand-new clinician, no prior same-doctor history),
 *    cap at the most recent attended visit of ANY doctor. Without this
 *    cap a new clinician's brief sweeps up recordings that were
 *    already discussed at an earlier attended visit with a different
 *    doctor, which surprises the user.
 *  - If there are no attended visits at all, return null so the caller
 *    can fall back to the default 30-day reach.
 */
const priorVisitAnchor = (
  appointment: Appointment,
  allAppointments: Appointment[],
): Anchor | null => {
  const doctor = appointment.doctorName.trim().toLowerCase();
  const thisApptMs = parseISO(appointment.date).getTime();
  const attendedBefore = allAppointments
    .filter(
      (a) =>
        a.id !== appointment.id &&
        a.status === 'attended' &&
        parseISO(a.attendedAt ?? a.date).getTime() < thisApptMs,
    )
    .map((a) => ({
      ms: parseISO(a.attendedAt ?? a.date).getTime(),
      sameDoctor:
        !!doctor && a.doctorName.trim().toLowerCase() === doctor,
    }));

  if (attendedBefore.length === 0) return null;

  const sameDoc = attendedBefore
    .filter((a) => a.sameDoctor)
    .sort((a, b) => b.ms - a.ms)[0];
  if (sameDoc) return sameDoc;

  // No same-doctor history. Cap at the most recent attended visit of
  // any doctor — everything before then was already used.
  return attendedBefore.sort((a, b) => b.ms - a.ms)[0] ?? null;
};

const windowStart = (
  appointment: Appointment,
  allAppointments: Appointment[],
  nowMs: number,
): number => {
  const anchor = priorVisitAnchor(appointment, allAppointments);
  return anchor ? anchor.ms : nowMs - DEFAULT_WINDOW_DAYS * DAY_MS;
};

/**
 * Pick which recordings feed the AI brief for a given appointment.
 * Two filters combine:
 *  1. Time window — everything logged since the patient's last
 *     attended visit with the same doctor (falling back to any
 *     doctor, then the last 30 days).
 *  2. Routing — a recording with no `clinicianNames` is "general"
 *     and feeds every clinician's brief. A recording tagged for a
 *     subset of clinicians only feeds that subset — a "knee pain"
 *     entry meant for the orthopedist stops leaking into the
 *     cardiologist's brief.
 * Returned oldest-first so the AI receives a chronological view.
 */
export const recordingsForAppointmentBrief = (
  appointment: Appointment,
  allRecordings: Recording[],
  allAppointments: Appointment[] = [],
): Recording[] => {
  const startMs = windowStart(appointment, allAppointments, Date.now());
  const doctor = appointment.doctorName.trim().toLowerCase();
  return allRecordings
    .filter((r) => parseISO(r.createdAt).getTime() >= startMs)
    .filter((r) => {
      const tags = r.clinicianNames ?? [];
      if (tags.length === 0) return true;
      return tags.some((n) => n.trim().toLowerCase() === doctor);
    })
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
  const anchor = priorVisitAnchor(appointment, allAppointments);
  if (!anchor) return `last ${DEFAULT_WINDOW_DAYS} days`;
  const d = new Date(anchor.ms);
  const month = d.toLocaleString('en-US', { month: 'short' });
  return anchor.sameDoctor
    ? `since your visit on ${month} ${d.getDate()}`
    : `since your last appointment on ${month} ${d.getDate()}`;
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
