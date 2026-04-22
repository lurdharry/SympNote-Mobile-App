import { useMemo } from 'react';
import { useAppointmentsStore } from '../stores/useAppointmentsStore';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { topTrendingSymptom } from '../utils/insights';
import { timeGreeting } from '../utils/date';
import {
  DEMO_TODAY_ENTRIES,
  DemoEntry,
} from '../constants/demo/home';

/**
 * Derived data the Home screen renders: the next upcoming
 * appointment, today's logged entries, the real trending-symptom
 * insight, and the date/greeting strings for the header.
 *
 * Demo fallbacks kick in only for the today-entries list so the
 * timeline isn't empty during onboarding review.
 */
export function useHomeDashboard() {
  const appointments = useAppointmentsStore((s) => s.appointments);
  const recordings = useRecordingsStore((s) => s.recordings);

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => new Date(a.date).getTime() >= now)
      .sort(
        (x, y) => new Date(x.date).getTime() - new Date(y.date).getTime()
      )[0];
  }, [appointments]);

  const todayEntries = useMemo<DemoEntry[]>(() => {
    if (recordings.length === 0) return DEMO_TODAY_ENTRIES;
    const now = new Date();
    const todays = recordings.filter((r) => {
      const d = new Date(r.createdAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
    if (todays.length === 0) return DEMO_TODAY_ENTRIES;
    return todays.slice(0, 5).map<DemoEntry>((r) => {
      const d = new Date(r.createdAt);
      const h = d.getHours();
      const hour12 = ((h + 11) % 12) + 1;
      return {
        time: `${hour12.toString().padStart(2, '0')}:${d
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        period: h >= 12 ? 'PM' : 'AM',
        text: r.transcript.slice(0, 110),
        tags: r.tags.slice(0, 2).map((t) => ({ t, c: '#2C6E6B' })),
        dur: `${Math.floor(r.durationSec / 60)}:${(r.durationSec % 60)
          .toString()
          .padStart(2, '0')}`,
        kind: 'voice',
      };
    });
  }, [recordings]);

  const nudge = useMemo(() => {
    if (recordings.length < 3) return null;
    return topTrendingSymptom(recordings, '30d');
  }, [recordings]);

  const dateEyebrow = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const greeting = timeGreeting().replace('.', '');

  return {
    nextAppointment,
    todayEntries,
    nudge,
    dateEyebrow,
    greeting,
    recordingsCount: recordings.length,
  };
}
