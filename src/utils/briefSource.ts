import { parseISO } from 'date-fns';
import type { Appointment, Brief, Clinician, Recording } from '@/stores/types';

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

// ─── Clinician-anchored variants ────────────────────────────────────────
// Briefs now belong to the clinician, not the appointment. These mirror
// the appointment-anchored helpers above but key off `clinician.id` —
// no scheduled visit required.

const clinicianAnchorMs = (
  clinicianId: string,
  allAppointments: Appointment[],
): number | null => {
  const attendedSameDoc = allAppointments
    .filter(
      (a) =>
        a.status === 'attended' &&
        a.clinicianId === clinicianId &&
        a.attendedAt,
    )
    .map((a) => parseISO(a.attendedAt!).getTime())
    .sort((a, b) => b - a);
  if (attendedSameDoc.length > 0) return attendedSameDoc[0]!;
  // No prior visit with this clinician — fall back to the most recent
  // attended visit of any clinician so a fresh brief doesn't sweep up
  // notes already discussed elsewhere.
  const attendedAny = allAppointments
    .filter((a) => a.status === 'attended' && a.attendedAt)
    .map((a) => parseISO(a.attendedAt!).getTime())
    .sort((a, b) => b - a);
  return attendedAny[0] ?? null;
};

/**
 * Recordings that should feed a clinician's brief. Same two-filter
 * model as the appointment variant: a time window since the last
 * attended visit (with this clinician, or any clinician as fallback,
 * or 30 days), plus routing — untagged "general" notes feed every
 * clinician, tagged notes only feed the named subset.
 *
 * Returned oldest-first so the AI receives a chronological view.
 */
export const recordingsForClinicianBrief = (
  clinician: Clinician,
  allRecordings: Recording[],
  allAppointments: Appointment[] = [],
): Recording[] => {
  const anchor = clinicianAnchorMs(clinician.id, allAppointments);
  const startMs = anchor ?? Date.now() - DEFAULT_WINDOW_DAYS * DAY_MS;
  return allRecordings
    .filter((r) => parseISO(r.createdAt).getTime() >= startMs)
    .filter((r) => {
      const ids = r.clinicianIds ?? [];
      if (ids.length === 0) return true;
      return ids.includes(clinician.id);
    })
    .sort((a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime());
};

/** Window label for a clinician brief — "since your visit on Mar 14"
 *  or "last 30 days" when there's no prior visit anchor. */
export const clinicianBriefSourceWindowLabel = (
  clinician: Clinician,
  allAppointments: Appointment[],
): string => {
  const sameDoc = allAppointments
    .filter(
      (a) =>
        a.status === 'attended' &&
        a.clinicianId === clinician.id &&
        a.attendedAt,
    )
    .map((a) => parseISO(a.attendedAt!).getTime())
    .sort((a, b) => b - a)[0];
  if (sameDoc) {
    const d = new Date(sameDoc);
    return `since your visit on ${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
  }
  const anyDoc = allAppointments
    .filter((a) => a.status === 'attended' && a.attendedAt)
    .map((a) => parseISO(a.attendedAt!).getTime())
    .sort((a, b) => b - a)[0];
  if (anyDoc) {
    const d = new Date(anyDoc);
    return `since your last appointment on ${d.toLocaleString('en-US', {
      month: 'short',
    })} ${d.getDate()}`;
  }
  return `last ${DEFAULT_WINDOW_DAYS} days`;
};

/** Is the clinician's brief stale? Same definition as the appointment
 *  variant — a recording added since generation isn't in the source set. */
export const isClinicianBriefStale = (
  clinician: Clinician,
  allRecordings: Recording[],
): boolean => {
  if (!clinician.brief || !clinician.briefGeneratedAt) return false;
  const generatedAt = parseISO(clinician.briefGeneratedAt).getTime();
  const sourceIds = new Set(clinician.briefSourceRecordingIds);
  return allRecordings.some(
    (r) =>
      parseISO(r.createdAt).getTime() > generatedAt && !sourceIds.has(r.id),
  );
};

// ─── Brief-first helpers ────────────────────────────────────────────────
// These power the new Brief-collection model where briefs are
// first-class artefacts. The "since my last brief" default builds
// non-overlapping briefs by construction so each note feeds exactly
// one brief unless the user explicitly opts into a wider window.

export type BriefWindowKind = 'sinceLastBrief' | 'last7Days' | 'last30Days' | 'custom';

export interface BriefWindow {
  kind: BriefWindowKind;
  startMs: number;
  /** Inclusive upper bound. Undefined → up to "now". */
  endMs?: number;
}

/**
 * Resolve a window kind to concrete millisecond bounds. The
 * "sinceLastBrief" branch falls back to last-30-days when there's no
 * prior brief (first-time user has nothing to "since" from).
 */
export const resolveBriefWindow = (
  kind: BriefWindowKind,
  allBriefs: Brief[],
  custom?: { startMs: number; endMs?: number },
): BriefWindow => {
  const nowMs = Date.now();
  if (kind === 'custom' && custom) {
    return { kind: 'custom', startMs: custom.startMs, endMs: custom.endMs };
  }
  if (kind === 'last7Days') {
    return { kind, startMs: nowMs - 7 * DAY_MS };
  }
  if (kind === 'last30Days') {
    return { kind, startMs: nowMs - DEFAULT_WINDOW_DAYS * DAY_MS };
  }
  // sinceLastBrief — anchor on the most recent brief's generatedAt,
  // or fall back to last 30 days when the user has none.
  const latest = allBriefs
    .map((b) => parseISO(b.generatedAt).getTime())
    .sort((a, b) => b - a)[0];
  return {
    kind: 'sinceLastBrief',
    startMs: latest ?? nowMs - DEFAULT_WINDOW_DAYS * DAY_MS,
  };
};

/**
 * Pick the recordings inside a window. Sorted oldest-first so the AI
 * receives a chronological view. No clinician filtering at the source
 * level — audience tagging is a brief-level concern in the new model.
 */
export const recordingsInWindow = (
  window: BriefWindow,
  allRecordings: Recording[],
): Recording[] => {
  const endMs = window.endMs ?? Number.MAX_SAFE_INTEGER;
  return allRecordings
    .filter((r) => {
      const t = parseISO(r.createdAt).getTime();
      return t >= window.startMs && t <= endMs;
    })
    .sort((a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime());
};

/**
 * The set of recordings that haven't been included in any prior brief.
 * Powers the home-screen "N notes not yet briefed" surface — a
 * concrete count that disappears when the user generates with the
 * default "since last brief" window.
 */
export const unbriefedRecordings = (
  allRecordings: Recording[],
  allBriefs: Brief[],
): Recording[] => {
  const used = new Set<string>();
  for (const b of allBriefs) {
    for (const id of b.sourceRecordingIds) used.add(id);
  }
  return allRecordings.filter((r) => !used.has(r.id));
};

/** Friendly label for a window kind, used as a brief's auto-title. */
export const labelForWindow = (window: BriefWindow): string => {
  switch (window.kind) {
    case 'sinceLastBrief':
      return 'Since my last brief';
    case 'last7Days':
      return 'Last 7 days';
    case 'last30Days':
      return 'Last 30 days';
    case 'custom':
      return 'Custom window';
  }
};
