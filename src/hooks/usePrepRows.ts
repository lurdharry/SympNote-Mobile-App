import { useMemo } from 'react';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { deriveAppointmentBrief } from '@/utils/prep';
import { daysUntil, formatDate, formatTime } from '@/utils/date';
import type { PrepContent } from '@/constants/demo/prep';

export interface PrepRow {
  id: string;
  doc: string;
  spec: string;
  dateLabel: string;
  timeLabel: string;
  inDays: number;
  color: string;
  content: PrepContent;
}

const ACCENTS = ['#2C6E6B', '#E07A5F', '#D97706', '#5A8F6E', '#F6C06A'];

/**
 * Compose the rows rendered on the Prep tab. Each row is a real
 * appointment with concerns/timeline/severity/meds derived from the
 * recordings attached to it. Returns an empty array when the user has
 * no appointments — the screen renders the empty state in that case.
 */
export const usePrepRows = (): PrepRow[] => {
  const storeAppts = useAppointmentsStore((s) => s.appointments);
  const storeRecordings = useRecordingsStore((s) => s.recordings);

  return useMemo<PrepRow[]>(
    () =>
      storeAppts.map((a, i) => {
        const derived = deriveAppointmentBrief(a, storeRecordings);
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
        };
      }),
    [storeAppts, storeRecordings],
  );
};
