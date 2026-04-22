import { useMemo } from 'react';
import { useAppointmentsStore } from '../stores/useAppointmentsStore';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { deriveAppointmentBrief } from '../utils/prep';
import { daysUntil, formatDate, formatTime } from '../utils/date';
import {
  DEMO_APPTS,
  DEMO_PREP_CONTENT,
  PrepContent,
} from '../constants/demo/prep';

export type PrepRow = {
  id: string;
  /**
   * True when this row came from the local demo array rather than the
   * appointments store. Demo rows suppress mutations so we never fake
   * persistence.
   */
  isDemo: boolean;
  doc: string;
  spec: string;
  dateLabel: string;
  timeLabel: string;
  inDays: number;
  color: string;
  content: PrepContent;
};

/**
 * Compose the rows rendered on the Prep tab. Falls back to demo
 * appointments when the user has none attached; otherwise derives
 * real content (concerns/timeline/severity/meds) from the recordings
 * attached to each appointment.
 */
export function usePrepRows(): PrepRow[] {
  const storeAppts = useAppointmentsStore((s) => s.appointments);
  const storeRecordings = useRecordingsStore((s) => s.recordings);

  return useMemo<PrepRow[]>(() => {
    if (storeAppts.length > 0) {
      return storeAppts.map((a, i) => {
        const derived = deriveAppointmentBrief(a, storeRecordings);
        return {
          id: a.id,
          isDemo: false,
          doc: a.doctorName,
          spec: a.specialty,
          dateLabel: formatDate(a.date),
          timeLabel: formatTime(a.date),
          inDays: Math.max(0, daysUntil(a.date)),
          color: i === 0 ? '#2C6E6B' : '#E07A5F',
          content: {
            concerns: derived.concerns,
            timeline: derived.timeline,
            severity: derived.severity,
            meds: derived.meds,
            questions: a.brief?.questions ?? [],
          },
        };
      });
    }
    return DEMO_APPTS.map((a) => ({
      id: a.id,
      isDemo: true,
      doc: a.doc,
      spec: a.spec,
      dateLabel: a.date,
      timeLabel: a.time,
      inDays: a.inDays,
      color: a.color,
      content: DEMO_PREP_CONTENT[a.id]!,
    }));
  }, [storeAppts, storeRecordings]);
}
