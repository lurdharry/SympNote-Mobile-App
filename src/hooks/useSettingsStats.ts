import { useMemo } from 'react';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { useAppointmentsStore } from '../stores/useAppointmentsStore';
import { computeStreak } from '../utils/insights';

export type BadgeKey = 'first' | 'streak' | 'prep' | 'thirty';

export type Badge = {
  key: BadgeKey;
  label: string;
  unlocked: boolean;
};

export type SettingsStats = {
  /** Consecutive days with at least one recording. Still computed
   *  because the home FirstEntryHero copy references it; not
   *  surfaced on the settings screen anymore. */
  streak: number;
  recordingsCount: number;
  summariesCount: number;
  badges: Badge[];
};

/**
 * Honest, neutral stats for the settings screen: how much you've
 * captured + which milestone badges you've unlocked. No level / no
 * XP / no streak surfacing — they were game-mechanic borrows that
 * implied "more is better" in a clinical context where it isn't.
 *
 * `computeStreak` is still exposed for FirstEntryHero copy on home,
 * which uses it as a contextual line rather than a pressure metric.
 */
export function useSettingsStats(): SettingsStats {
  const recordings = useRecordingsStore((s) => s.recordings);
  const appointments = useAppointmentsStore((s) => s.appointments);

  const streak = useMemo(() => computeStreak(recordings), [recordings]);
  const summariesCount = useMemo(
    () => appointments.filter((a) => !!a.brief?.summary).length,
    [appointments],
  );

  const badges: Badge[] = [
    { key: 'first', label: 'First note', unlocked: recordings.length >= 1 },
    { key: 'streak', label: '5-day', unlocked: streak >= 5 },
    { key: 'prep', label: 'Prep pro', unlocked: summariesCount >= 1 },
    { key: 'thirty', label: '30 notes', unlocked: recordings.length >= 30 },
  ];

  return {
    streak,
    recordingsCount: recordings.length,
    summariesCount,
    badges,
  };
}
