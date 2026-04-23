import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { sortBy } from 'lodash';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { deriveAppointmentBrief } from '@/utils/prep';
import { isBriefStale } from '@/utils/briefSource';
import { daysUntil, formatDate, formatTime } from '@/utils/date';
import type { PrepContent } from '@/constants/demo/prep';
import type { AppointmentStatus } from '@/stores/types';

/**
 * Brief generation state the Prep card surfaces so the user knows
 * whether to draft, revisit, or just view the AI brief.
 *  - `none`: never generated. Card shows "Draft brief →".
 *  - `ready`: brief exists and matches current entries.
 *  - `stale`: brief exists but entries have changed since generation.
 */
export type PrepBriefState = 'none' | 'ready' | 'stale';

export interface PrepRow {
  id: string;
  doc: string;
  spec: string;
  dateLabel: string;
  timeLabel: string;
  inDays: number;
  color: string;
  content: PrepContent;
  briefState: PrepBriefState;
}

const ACCENTS = ['#2C6E6B', '#E07A5F', '#D97706', '#5A8F6E', '#F6C06A'];

/**
 * A past-visit row shown in the Past section on the Prep tab. Slimmer
 * than PrepRow — no expandable content, no preview brief — because
 * past visits are archive-style. Tapping opens the detail screen
 * where the user can re-read the brief they used.
 */
export interface PastVisitRow {
  id: string;
  doc: string;
  spec: string;
  dateLabel: string;
  status: AppointmentStatus;
  /** Relative-time descriptor, e.g. "2 days ago". */
  ago: string;
  hasBrief: boolean;
}

interface PrepRowsResult {
  /** Upcoming appointments only, oldest→newest. */
  upcoming: PrepRow[];
  /** Terminal-status appointments, newest→oldest. */
  past: PastVisitRow[];
}

const relativeLabel = (iso: string): string => {
  const diff = Math.floor((Date.now() - parseISO(iso).getTime()) / 86_400_000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return 'last week';
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 60) return 'last month';
  return `${Math.floor(diff / 30)} months ago`;
};

/**
 * Compose the rows rendered on the Prep tab. Split into upcoming
 * (full expandable cards with brief preview) and past (slim archive
 * rows). Returns empty arrays when the user has no appointments —
 * the screen renders the PrepEmpty state in that case.
 */
export const usePrepRows = (): PrepRowsResult => {
  const storeAppts = useAppointmentsStore((s) => s.appointments);
  const storeRecordings = useRecordingsStore((s) => s.recordings);

  return useMemo<PrepRowsResult>(() => {
    const upcomingAppts = storeAppts.filter((a) => a.status === 'upcoming');
    const pastAppts = sortBy(
      storeAppts.filter((a) => a.status !== 'upcoming'),
      (a) => -parseISO(a.date).getTime(),
    );

    const upcoming: PrepRow[] = upcomingAppts.map((a, i) => {
      const derived = deriveAppointmentBrief(a, storeRecordings, storeAppts);
      const briefState: PrepBriefState = !a.brief?.summary
        ? 'none'
        : isBriefStale(a, storeRecordings)
          ? 'stale'
          : 'ready';
      return {
        id: a.id,
        doc: a.doctorName,
        spec: a.specialty,
        dateLabel: formatDate(a.date),
        timeLabel: formatTime(a.date),
        inDays: Math.max(0, daysUntil(a.date)),
        color: ACCENTS[i % ACCENTS.length]!,
        content: {
          concerns: derived.concerns,
          timeline: derived.timeline,
          severity: derived.severity,
          meds: derived.meds,
          questions: a.brief?.questions ?? [],
        },
        briefState,
      };
    });

    const past: PastVisitRow[] = pastAppts.map((a) => ({
      id: a.id,
      doc: a.doctorName,
      spec: a.specialty,
      dateLabel: formatDate(a.date),
      status: a.status,
      ago: relativeLabel(a.date),
      hasBrief: !!a.brief?.summary,
    }));

    return { upcoming, past };
  }, [storeAppts, storeRecordings]);
};
