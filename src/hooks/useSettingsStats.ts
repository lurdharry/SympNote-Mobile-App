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
  streak: number;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
  badges: Badge[];
  recordingsCount: number;
  summariesCount: number;
};

/**
 * Derived gamification + engagement stats surfaced on the settings
 * screen: consecutive-day streak, XP/level, and badge unlock state.
 */
export function useSettingsStats(): SettingsStats {
  const recordings = useRecordingsStore((s) => s.recordings);
  const appointments = useAppointmentsStore((s) => s.appointments);

  const streak = useMemo(() => computeStreak(recordings), [recordings]);
  const summariesCount = useMemo(
    () => appointments.filter((a) => !!a.brief?.summary).length,
    [appointments]
  );

  const xp = recordings.length * 10 + summariesCount * 50;
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  const xpForNextLevel = 100 * level;
  const levelProgress = (xpIntoLevel / 100) * 100;

  const badges: Badge[] = [
    { key: 'first',  label: 'First note', unlocked: recordings.length >= 1 },
    { key: 'streak', label: '5-day',      unlocked: streak >= 5 },
    { key: 'prep',   label: 'Prep pro',   unlocked: summariesCount >= 1 },
    { key: 'thirty', label: '30 notes',   unlocked: recordings.length >= 30 },
  ];

  return {
    streak,
    xp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    levelProgress,
    badges,
    recordingsCount: recordings.length,
    summariesCount,
  };
}
