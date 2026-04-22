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

export function rangeToDays(r: InsightsRange): number | null {
  switch (r) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    default:
      return null; // All-time
  }
}

/**
 * Filter recordings down to those inside the selected window.
 * Caller-owned filter so the range can be swapped without recomputing
 * everything for "All".
 */
export function filterByRange(
  recordings: Recording[],
  range: InsightsRange
): Recording[] {
  const days = rangeToDays(range);
  if (days == null) return recordings;
  const cutoff = Date.now() - days * 86400000;
  return recordings.filter(
    (r) => new Date(r.createdAt).getTime() >= cutoff
  );
}

export function summarize(recordings: Recording[]): InsightsSummary {
  const totalDurationSec = recordings.reduce(
    (s, r) => s + (r.durationSec || 0),
    0
  );
  const names = new Set<string>();
  recordings.forEach((r) =>
    r.structured.symptoms.forEach((s) => {
      const n = normalize(s);
      if (n) names.add(n);
    })
  );
  return {
    recordingCount: recordings.length,
    totalDurationSec,
    distinctSymptoms: names.size,
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
  topN = 4
): SymptomFrequency[] {
  if (recordings.length === 0) return [];

  const days = rangeToDays(range) ?? computeSpanDays(recordings) ?? 30;
  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  // Bucket recordings by (symptomName, dayIndex).
  // dayIndex 0 is the oldest day in the window; `days - 1` is today.
  const nameToBuckets = new Map<string, number[]>();
  let totalMentions = 0;

  recordings.forEach((r) => {
    const dayIndex = daysAgo(r.createdAt, endOfDay);
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

  const ranked = Array.from(nameToBuckets.entries())
    .map(([name, buckets]) => {
      const count = buckets.reduce((s, v) => s + v, 0);
      return { name, buckets, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return ranked.map(({ name, buckets, count }, i) => ({
    name: capitalize(name),
    count,
    pct:
      totalMentions > 0
        ? Math.round((count / totalMentions) * 100)
        : 0,
    trend: computeTrend(buckets),
    sparkline: buckets,
    color: PALETTE[i % PALETTE.length]!,
  }));
}

function computeTrend(buckets: number[]): 'up' | 'down' | 'flat' {
  if (buckets.length < 2) return 'flat';
  const mid = Math.floor(buckets.length / 2);
  const firstHalf = buckets.slice(0, mid).reduce((s, v) => s + v, 0);
  const secondHalf = buckets.slice(mid).reduce((s, v) => s + v, 0);
  const diff = secondHalf - firstHalf;
  if (Math.abs(diff) < 2) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

function daysAgo(iso: string, endOfToday: Date): number {
  const d = new Date(iso);
  const day = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999
  );
  const diffMs = endOfToday.getTime() - day.getTime();
  return Math.floor(diffMs / 86400000);
}

function computeSpanDays(recordings: Recording[]): number | null {
  if (recordings.length === 0) return null;
  const times = recordings.map((r) => new Date(r.createdAt).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  return Math.max(7, Math.ceil((max - min) / 86400000) + 1);
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0]!.toUpperCase() + s.slice(1);
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
  const daysWith = new Set<string>();
  recordings.forEach((r) => {
    const d = new Date(r.createdAt);
    daysWith.add(dayKey(d));
  });
  const today = new Date();
  let cursor = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  // If today has no entry yet, the streak can still be running if
  // yesterday has one.
  if (!daysWith.has(dayKey(cursor))) {
    cursor = new Date(cursor.getTime() - 86400000);
    if (!daysWith.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (daysWith.has(dayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Time-of-day × day-of-week heatmap. Returns a 5×7 matrix of cell
 * intensities in 0..1 — rows are [AM, Noon, PM, Eve, Night], columns
 * are Mon..Sun. Normalized to the busiest cell so the heatmap always
 * reads well regardless of absolute counts.
 */
export function computeHeatmap(recordings: Recording[]): number[][] {
  const rows = 5;
  const cols = 7;
  const grid: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0)
  );
  recordings.forEach((r) => {
    const d = new Date(r.createdAt);
    const rowIdx = timeOfDayRow(d.getHours());
    // getDay() is Sun=0..Sat=6; remap to Mon=0..Sun=6
    const colIdx = (d.getDay() + 6) % 7;
    grid[rowIdx]![colIdx] = (grid[rowIdx]![colIdx] ?? 0) + 1;
  });
  // Normalize to max cell.
  let max = 0;
  for (const row of grid) for (const v of row) if (v > max) max = v;
  if (max === 0) return grid;
  return grid.map((row) => row.map((v) => v / max));
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
  range: InsightsRange
): { name: string; count: number; trend: 'up' | 'flat' | 'down' } | null {
  const freq = symptomFrequencies(recordings, range, 4);
  const upMost = freq.find((s) => s.trend === 'up');
  if (upMost) return { name: upMost.name, count: upMost.count, trend: 'up' };
  // No strict up-trend; pick the most frequent if we have at least one.
  if (freq.length > 0 && freq[0]!.count >= 3) {
    return {
      name: freq[0]!.name,
      count: freq[0]!.count,
      trend: freq[0]!.trend,
    };
  }
  return null;
}

/** Peak row of a heatmap (AM / Noon / PM / Eve / Night). */
export function peakHeatmapRow(grid: number[][]): string | null {
  const labels = ['morning', 'midday', 'afternoon', 'evening', 'night'];
  let best = -1;
  let bestIdx = -1;
  grid.forEach((row, i) => {
    const sum = row.reduce((s, v) => s + v, 0);
    if (sum > best) {
      best = sum;
      bestIdx = i;
    }
  });
  if (best <= 0 || bestIdx < 0) return null;
  return labels[bestIdx] ?? null;
}
