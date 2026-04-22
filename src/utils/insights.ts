import { differenceInCalendarDays, parseISO, startOfDay, subDays } from 'date-fns';
import { capitalize, max, min, orderBy, sum, sumBy, take, uniq } from 'lodash';
import { Recording } from '../stores/types';

export type InsightsRange = '7d' | '30d' | '90d' | 'All';

export type SymptomFrequency = {
  name: string;
  count: number;
  /** 0..100 — share of total symptom mentions in range. */
  pct: number;
  /** 'up' when the second half has more occurrences than the first half. */
  trend: 'up' | 'down' | 'flat';
  /** Per-day counts across the range, used by the sparkline. */
  sparkline: number[];
  /** Stable per-name color (picked from a palette, hashed on the name). */
  color: string;
};

export type InsightsSummary = {
  recordingCount: number;
  totalDurationSec: number;
  distinctSymptoms: number;
};

const PALETTE = ['#2C6E6B', '#F6C06A', '#E07A5F', '#D97706', '#5A8F6E'];
const TREND_THRESHOLD = 2;
const HEATMAP_ROWS = 5;
const HEATMAP_COLS = 7;

const normalize = (s: string): string => s.trim().toLowerCase();

export function rangeToDays(r: InsightsRange): number | null {
  switch (r) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    default:
      return null;
  }
}

/**
 * Filter recordings down to those inside the selected window.
 * Caller-owned filter so the range can be swapped without recomputing
 * everything for "All".
 */
export function filterByRange(
  recordings: Recording[],
  range: InsightsRange,
): Recording[] {
  const days = rangeToDays(range);
  if (days == null) return recordings;
  const cutoff = subDays(new Date(), days).getTime();
  return recordings.filter((r) => parseISO(r.createdAt).getTime() >= cutoff);
}

export function summarize(recordings: Recording[]): InsightsSummary {
  const allSymptoms = recordings.flatMap((r) =>
    r.structured.symptoms.map(normalize).filter(Boolean),
  );
  return {
    recordingCount: recordings.length,
    totalDurationSec: sumBy(recordings, (r) => r.durationSec || 0),
    distinctSymptoms: uniq(allSymptoms).length,
  };
}

/**
 * Return the top N symptom names + their per-day counts across the
 * range. Per-day buckets are zero-filled so sparklines don't need to
 * guess missing dates.
 */
export function symptomFrequencies(
  recordings: Recording[],
  range: InsightsRange,
  topN = 4,
): SymptomFrequency[] {
  if (recordings.length === 0) return [];

  const days = rangeToDays(range) ?? computeSpanDays(recordings) ?? 30;
  const endOfToday = startOfDay(new Date());

  // Bucket recordings by (symptomName, dayIndex). Day 0 is oldest.
  const nameToBuckets = new Map<string, number[]>();
  let totalMentions = 0;

  recordings.forEach((r) => {
    const dayIndex = differenceInCalendarDays(endOfToday, parseISO(r.createdAt));
    if (dayIndex < 0 || dayIndex >= days) return;
    const bucketIndex = days - 1 - dayIndex;
    r.structured.symptoms.forEach((raw) => {
      const name = normalize(raw);
      if (!name) return;
      const arr = nameToBuckets.get(name) ?? new Array<number>(days).fill(0);
      arr[bucketIndex] = (arr[bucketIndex] ?? 0) + 1;
      nameToBuckets.set(name, arr);
      totalMentions += 1;
    });
  });

  const ranked = take(
    orderBy(
      Array.from(nameToBuckets.entries()).map(([name, buckets]) => ({
        name,
        buckets,
        count: sum(buckets),
      })),
      ['count'],
      ['desc'],
    ),
    topN,
  );

  return ranked.map(({ name, buckets, count }, i) => ({
    name: capitalize(name),
    count,
    pct: totalMentions > 0 ? Math.round((count / totalMentions) * 100) : 0,
    trend: computeTrend(buckets),
    sparkline: buckets,
    color: PALETTE[i % PALETTE.length]!,
  }));
}

function computeTrend(buckets: number[]): 'up' | 'down' | 'flat' {
  if (buckets.length < 2) return 'flat';
  const mid = Math.floor(buckets.length / 2);
  const diff = sum(buckets.slice(mid)) - sum(buckets.slice(0, mid));
  if (Math.abs(diff) < TREND_THRESHOLD) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

function computeSpanDays(recordings: Recording[]): number | null {
  if (recordings.length === 0) return null;
  const times = recordings.map((r) => parseISO(r.createdAt).getTime());
  const oldest = new Date(min(times)!);
  const newest = new Date(max(times)!);
  return Math.max(7, differenceInCalendarDays(newest, oldest) + 1);
}

export function formatTotalDuration(sec: number): string {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function rangeLabel(range: InsightsRange): string {
  switch (range) {
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    default:
      return 'All time';
  }
}

/**
 * Consecutive-day streak ending today (or yesterday if today has no
 * entry yet). Each day counts once no matter how many recordings
 * happened on it.
 */
export function computeStreak(recordings: Recording[]): number {
  if (recordings.length === 0) return 0;
  const daysWith = new Set(
    recordings.map((r) => startOfDay(parseISO(r.createdAt)).getTime()),
  );

  let cursor = startOfDay(new Date());
  if (!daysWith.has(cursor.getTime())) {
    cursor = subDays(cursor, 1);
    if (!daysWith.has(cursor.getTime())) return 0;
  }
  let streak = 0;
  while (daysWith.has(cursor.getTime())) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/**
 * Time-of-day × day-of-week heatmap. Returns a 5×7 matrix of cell
 * intensities in 0..1 — rows are [AM, Noon, PM, Eve, Night], columns
 * are Mon..Sun. Normalized to the busiest cell so the heatmap always
 * reads well regardless of absolute counts.
 */
export function computeHeatmap(recordings: Recording[]): number[][] {
  const grid: number[][] = Array.from({ length: HEATMAP_ROWS }, () =>
    new Array<number>(HEATMAP_COLS).fill(0),
  );
  recordings.forEach((r) => {
    const d = parseISO(r.createdAt);
    const rowIdx = timeOfDayRow(d.getHours());
    // getDay() is Sun=0..Sat=6; remap to Mon=0..Sun=6
    const colIdx = (d.getDay() + 6) % 7;
    grid[rowIdx]![colIdx] = (grid[rowIdx]![colIdx] ?? 0) + 1;
  });
  const peak = max(grid.flat()) ?? 0;
  if (peak === 0) return grid;
  return grid.map((row) => row.map((v) => v / peak));
}

function timeOfDayRow(hour: number): number {
  if (hour >= 5 && hour < 11) return 0; // AM
  if (hour >= 11 && hour < 13) return 1; // Noon
  if (hour >= 13 && hour < 17) return 2; // PM
  if (hour >= 17 && hour < 21) return 3; // Eve
  return 4; // Night
}

/**
 * Top trending-up symptom across the range. Returns null when no clear
 * trend exists (too few recordings, or no symptom is "up"). Used by
 * Home's inline insight nudge so the copy is always truthful.
 */
export function topTrendingSymptom(
  recordings: Recording[],
  range: InsightsRange,
): { name: string; count: number; trend: 'up' | 'flat' | 'down' } | null {
  const freq = symptomFrequencies(recordings, range, 4);
  const upMost = freq.find((s) => s.trend === 'up');
  if (upMost) return { name: upMost.name, count: upMost.count, trend: 'up' };
  const topFreq = freq[0];
  if (topFreq && topFreq.count >= 3) {
    return { name: topFreq.name, count: topFreq.count, trend: topFreq.trend };
  }
  return null;
}

const HEATMAP_ROW_LABELS = ['morning', 'midday', 'afternoon', 'evening', 'night'];

/** Peak row of a heatmap (morning / midday / afternoon / evening / night). */
export function peakHeatmapRow(grid: number[][]): string | null {
  const rowSums = grid.map((row) => sum(row));
  const peak = max(rowSums) ?? 0;
  if (peak <= 0) return null;
  return HEATMAP_ROW_LABELS[rowSums.indexOf(peak)] ?? null;
}
