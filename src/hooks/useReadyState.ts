import { useMemo } from "react";
import { differenceInCalendarDays, isSameDay, parseISO } from "date-fns";
import { sortBy } from "lodash";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import type { Appointment, Brief } from "@/stores/types";

/** A visit within this many days of today is treated as "imminent" —
 *  the home hero pivots to prep mode. */
const VISIT_IMMINENT_DAYS = 7;
/** Minimum un-briefed notes before the no-visit "compose a brief"
 *  prompt earns its slot in the home hero. Lower than this, the
 *  rhythm prompt wins. */
const COMPOSE_THRESHOLD = 3;

export type ReadyStateKind =
  | "day-zero"
  | "visit-prep-brief"
  | "visit-brief-ready"
  | "visit-no-notes"
  | "compose-brief"
  | "capture-today"
  | "rhythm-current";

export interface ReadyState {
  kind: ReadyStateKind;
  visit?: Appointment;
  daysUntil?: number;
  unbriefedCount?: number;
  brief?: Brief;
  totalNotes?: number;
}

/**
 * Picks the single most-useful next action for the user given current
 * store state. Drives `ReadyStateCard` on the home tab. Priority:
 *
 *   1. day-zero            — no recordings yet
 *   2. visit-prep-brief    — visit ≤7 days away + un-briefed notes
 *   3. visit-brief-ready   — visit ≤7 days away + a brief tagged for
 *                            that clinician already exists
 *   4. visit-no-notes      — visit ≤7 days away, nothing logged
 *   5. compose-brief       — no imminent visit + ≥3 un-briefed notes
 *   6. capture-today       — nothing logged today (last entry >today)
 *   7. rhythm-current      — caught up, no visit, logged today
 *
 * One-state-at-a-time so the home hero stays decisive.
 */
export const useReadyState = (): ReadyState => {
  const appointments = useAppointmentsStore((s) => s.appointments);
  const recordings = useRecordingsStore((s) => s.recordings);
  const briefs = useBriefsStore((s) => s.briefs);

  return useMemo<ReadyState>(() => {
    const recordingsCount = recordings.length;

    if (recordingsCount === 0) {
      return { kind: "day-zero" };
    }

    // Next upcoming visit — status 'upcoming' and date in the future.
    const now = Date.now();
    const upcoming = sortBy(
      appointments.filter(
        (a) => a.status === "upcoming" && parseISO(a.date).getTime() >= now,
      ),
      (a) => parseISO(a.date).getTime(),
    );
    const nextVisit = upcoming[0];

    const unbriefed = unbriefedRecordings(recordings, briefs);
    const unbriefedCount = unbriefed.length;

    if (nextVisit) {
      const daysUntil = differenceInCalendarDays(parseISO(nextVisit.date), new Date());
      const visitImminent = daysUntil <= VISIT_IMMINENT_DAYS;

      if (visitImminent) {
        if (unbriefedCount > 0) {
          return {
            kind: "visit-prep-brief",
            visit: nextVisit,
            daysUntil,
            unbriefedCount,
          };
        }
        // All notes are briefed. Is there a brief that surfaces for
        // this clinician? "Everyone" briefs (empty clinicianIds)
        // surface for everyone, plus those explicitly tagged for this
        // clinician. Newest first.
        const visibleBriefs = sortBy(
          briefs.filter(
            (b) =>
              b.clinicianIds.length === 0 ||
              (nextVisit.clinicianId !== undefined &&
                b.clinicianIds.includes(nextVisit.clinicianId)),
          ),
          (b) => -parseISO(b.generatedAt).getTime(),
        );
        const briefForVisit = visibleBriefs[0];
        if (briefForVisit) {
          return {
            kind: "visit-brief-ready",
            visit: nextVisit,
            daysUntil,
            brief: briefForVisit,
          };
        }
        return { kind: "visit-no-notes", visit: nextVisit, daysUntil };
      }
    }

    // No imminent visit.
    if (unbriefedCount >= COMPOSE_THRESHOLD) {
      return {
        kind: "compose-brief",
        unbriefedCount,
        totalNotes: recordingsCount,
      };
    }

    const loggedToday = recordings.some((r) =>
      isSameDay(parseISO(r.createdAt), new Date()),
    );
    if (!loggedToday) {
      return { kind: "capture-today", totalNotes: recordingsCount };
    }

    return { kind: "rhythm-current", totalNotes: recordingsCount };
  }, [appointments, recordings, briefs]);
};
