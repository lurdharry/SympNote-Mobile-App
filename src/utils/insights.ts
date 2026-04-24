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

export type SeverityPoint = {
  /** Day index relative to the range, 0 = oldest. */
  day: number;
  /** Mean severity of symptom-bearing entries that day, or null if none. */
  severity: number | null;
  /** Number of symptom-bearing entries on that day. */
  count: number;
};

export type SeverityTrendSummary = {
  points: SeverityPoint[];
  /** Simple comparison of the second half's mean vs the first half's. */
  trend: 'up' | 'down' | 'flat';
  /** Peak severity observed in the range (0 when none). */
  peak: number;
  /** Number of entries contributing to the trend (severity > 0). */
  sampleCount: number;
};

/**
 * Daily severity trend across the range. Entries with severity 0
 * ("no symptom reported") are excluded — they'd drag the mean on
 * reassuring-check-in days. Returns a per-day point array zero-filled
 * so the chart has a stable x-axis.
 *
 * Trend direction compares the mean of the second half of the range
 * against the first half. Flat when the gap is small (< 0.5).
 */
export function severityTrend(
  recordings: Recording[],
  range: InsightsRange,
): SeverityTrendSummary {
  const days = rangeToDays(range) ?? computeSpanDays(recordings) ?? 30;
  const endOfToday = startOfDay(new Date());
  const buckets: number[][] = Array.from({ length: days }, () => []);

  let peak = 0;
  recordings.forEach((r) => {
    if (r.structured.severity <= 0) return;
    const dayIndex = differenceInCalendarDays(endOfToday, parseISO(r.createdAt));
    if (dayIndex < 0 || dayIndex >= days) return;
    const bucketIndex = days - 1 - dayIndex;
    buckets[bucketIndex]!.push(r.structured.severity);
    if (r.structured.severity > peak) peak = r.structured.severity;
  });

  const points: SeverityPoint[] = buckets.map((entries, day) => ({
    day,
    severity:
      entries.length === 0 ? null : sum(entries) / entries.length,
    count: entries.length,
  }));

  const sampleCount = sum(buckets.map((b) => b.length));

  const halfIdx = Math.floor(days / 2);
  const firstMeanNums = buckets
    .slice(0, halfIdx)
    .flat();
  const secondMeanNums = buckets.slice(halfIdx).flat();
  const meanOf = (arr: number[]): number =>
    arr.length === 0 ? 0 : sum(arr) / arr.length;
  const firstMean = meanOf(firstMeanNums);
  const secondMean = meanOf(secondMeanNums);
  const diff = secondMean - firstMean;
  let trend: 'up' | 'down' | 'flat';
  if (Math.abs(diff) < 0.5) trend = 'flat';
  else trend = diff > 0 ? 'up' : 'down';

  return { points, trend, peak, sampleCount };
}

export type TriggerFrequency = {
  name: string;
  count: number;
  pct: number;
  color: string;
};

/**
 * Top triggers across the range, aggregated from `structured.triggers`
 * (the "worsens / brings on" side — relievers live in their own field).
 * Returns up to `topN` by frequency.
 */
export function triggerFrequencies(
  recordings: Recording[],
  range: InsightsRange,
  topN = 4,
): TriggerFrequency[] {
  const days = rangeToDays(range);
  const cutoff =
    days == null ? 0 : subDays(new Date(), days).getTime();

  const counts = new Map<string, number>();
  let total = 0;
  recordings.forEach((r) => {
    if (days != null && parseISO(r.createdAt).getTime() < cutoff) return;
    r.structured.triggers.forEach((raw) => {
      const name = normalize(raw);
      if (!name) return;
      counts.set(name, (counts.get(name) ?? 0) + 1);
      total += 1;
    });
  });

  const ranked = take(
    orderBy(Array.from(counts.entries()), ([, c]) => c, ['desc']),
    topN,
  );

  return ranked.map(([name, count], i) => ({
    name: capitalize(name),
    count,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
    color: PALETTE[i % PALETTE.length]!,
  }));
}

export type BodySystemSlice = {
  name: string;
  count: number;
  pct: number;
  color: string;
};

/**
 * Counts entries per body-system category. Empty / "" bodySystem
 * values are excluded — they represent "AI wasn't confident" which
 * shouldn't count as a bucket. Returns non-empty slices ordered by
 * frequency, with percentages out of the entries that DID have a
 * body system classified.
 */
export function bodySystemBreakdown(
  recordings: Recording[],
): BodySystemSlice[] {
  const counts = new Map<string, number>();
  let classified = 0;
  recordings.forEach((r) => {
    const name = r.structured.bodySystem.trim();
    if (!name) return;
    counts.set(name, (counts.get(name) ?? 0) + 1);
    classified += 1;
  });
  if (classified === 0) return [];

  return orderBy(
    Array.from(counts.entries()).map(([name, count], i) => ({
      name,
      count,
      pct: Math.round((count / classified) * 100),
      color: PALETTE[i % PALETTE.length]!,
    })),
    ['count'],
    ['desc'],
  );
}

export type RedFlagRollup = {
  /** Recordings whose severity hit 7+ or carried an explicit red flag. */
  concerningCount: number;
  /** Distinct red-flag phrases observed, capped for display. */
  flags: string[];
};

/**
 * Count of entries in the range that either flew an explicit red flag
 * or hit severity ≥7. Drives a safety-oriented roll-up card so the
 * user can see "this month has a cluster of severe days" at a glance.
 */
export function redFlagRollup(
  recordings: Recording[],
  displayFlagsMax = 4,
): RedFlagRollup {
  const flagCounts = new Map<string, number>();
  let concerningCount = 0;
  recordings.forEach((r) => {
    const hasFlag = r.structured.redFlags.length > 0;
    const severe = r.structured.severity >= 7;
    if (!hasFlag && !severe) return;
    concerningCount += 1;
    r.structured.redFlags.forEach((raw) => {
      const name = raw.trim();
      if (!name) return;
      flagCounts.set(name, (flagCounts.get(name) ?? 0) + 1);
    });
  });

  const flags = orderBy(
    Array.from(flagCounts.entries()),
    ([, c]) => c,
    ['desc'],
  )
    .slice(0, displayFlagsMax)
    .map(([name]) => name);

  return { concerningCount, flags };
}

export type PeriodComparison = {
  /** Entries in the current range. */
  current: number;
  /** Entries in the immediately prior range of the same length. */
  prior: number;
  /** Direction relative to prior. */
  direction: 'up' | 'down' | 'flat';
  /** Absolute delta, current minus prior. */
  delta: number;
  /** Human-readable label for the range, e.g. "this week" / "last 30 days". */
  currentLabel: string;
  priorLabel: string;
};

/**
 * Compare entry count in the current range vs the immediately-prior
 * window of the same length. Returns null for "All" (no meaningful
 * prior to compare against). Flat when the delta is within ±1 to
 * avoid noise-driven direction flips.
 */
export function periodComparison(
  recordings: Recording[],
  range: InsightsRange,
): PeriodComparison | null {
  const days = rangeToDays(range);
  if (days == null) return null;

  const now = Date.now();
  const priorCutoff = subDays(new Date(), days * 2).getTime();
  const currentCutoff = subDays(new Date(), days).getTime();

  let current = 0;
  let prior = 0;
  recordings.forEach((r) => {
    const t = parseISO(r.createdAt).getTime();
    if (t > now) return;
    if (t >= currentCutoff) current += 1;
    else if (t >= priorCutoff) prior += 1;
  });

  const delta = current - prior;
  let direction: PeriodComparison['direction'];
  if (Math.abs(delta) <= 1) direction = 'flat';
  else direction = delta > 0 ? 'up' : 'down';

  const currentLabel =
    range === '7d'
      ? 'this week'
      : range === '30d'
        ? 'last 30 days'
        : 'last 90 days';
  const priorLabel =
    range === '7d'
      ? 'last week'
      : range === '30d'
        ? 'the 30 before'
        : 'the 90 before';

  return { current, prior, direction, delta, currentLabel, priorLabel };
}

export type PostVisitOutcome = {
  /** Display name of the doctor (or "your last visit" if missing). */
  doctor: string;
  /** ISO timestamp the visit was marked attended. */
  attendedAt: string;
  /** Mean severity in the window before the visit. */
  beforeMean: number;
  /** Mean severity in the window after the visit. */
  afterMean: number;
  /** Number of symptom-bearing entries before. */
  beforeCount: number;
  /** Number of symptom-bearing entries after. */
  afterCount: number;
  /** Direction of change. */
  direction: 'better' | 'worse' | 'flat';
};

const POST_VISIT_WINDOW_DAYS = 14;
const POST_VISIT_MIN_PER_SIDE = 2;
const POST_VISIT_FLAT_THRESHOLD = 0.5;

/**
 * Compare mean severity in a 14-day window before a recently attended
 * visit against the 14-day window after it. Returns null when there
 * aren't enough symptom-bearing entries on each side (at least 2) or
 * when the patient has no attended visits. Scopes to the most recent
 * attended visit whose post-window has started to accumulate data.
 */
export function postVisitOutcome(
  recordings: Recording[],
  appointments: { status: string; attendedAt: string | null; doctorName: string }[],
): PostVisitOutcome | null {
  const attended = appointments
    .filter((a) => a.status === 'attended' && a.attendedAt)
    .map((a) => ({
      doctor: a.doctorName || 'your last visit',
      attendedAt: a.attendedAt as string,
      ms: parseISO(a.attendedAt as string).getTime(),
    }))
    .sort((a, b) => b.ms - a.ms);

  if (attended.length === 0) return null;

  const windowMs = POST_VISIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  for (const visit of attended) {
    const beforeStart = visit.ms - windowMs;
    const afterEnd = visit.ms + windowMs;

    const before: number[] = [];
    const after: number[] = [];
    recordings.forEach((r) => {
      if (r.structured.severity <= 0) return;
      const t = parseISO(r.createdAt).getTime();
      if (t >= beforeStart && t < visit.ms) before.push(r.structured.severity);
      else if (t >= visit.ms && t <= afterEnd) after.push(r.structured.severity);
    });

    if (before.length < POST_VISIT_MIN_PER_SIDE) continue;
    if (after.length < POST_VISIT_MIN_PER_SIDE) continue;

    const beforeMean = sum(before) / before.length;
    const afterMean = sum(after) / after.length;
    const diff = afterMean - beforeMean;
    let direction: PostVisitOutcome['direction'];
    if (Math.abs(diff) < POST_VISIT_FLAT_THRESHOLD) direction = 'flat';
    else direction = diff < 0 ? 'better' : 'worse';

    return {
      doctor: visit.doctor,
      attendedAt: visit.attendedAt,
      beforeMean,
      afterMean,
      beforeCount: before.length,
      afterCount: after.length,
      direction,
    };
  }

  return null;
}

export type TriggerCorrelation = {
  /** Symptom name (capitalized for display). */
  symptom: string;
  /** Trigger name (capitalized for display). */
  trigger: string;
  /** How many entries contained both this symptom and this trigger. */
  coCount: number;
  /** How many entries mentioned this symptom at all. */
  symptomCount: number;
  /** Percentage: coCount / symptomCount. */
  pct: number;
};

const CORRELATION_MIN_SYMPTOM_COUNT = 3;
const CORRELATION_MIN_PCT = 50;

/**
 * Finds the strongest (trigger, symptom) pairing — i.e. a trigger
 * that shows up alongside a given symptom more than half the time,
 * across at least three symptom entries. Returns null when no
 * pairing clears that bar, which is the common case at small data
 * volumes. Safety valve: we only trust pairings from the new split
 * `triggers` field, so legacy mixed-semantics data never shows up
 * here.
 */
export function topTriggerCorrelation(
  recordings: Recording[],
): TriggerCorrelation | null {
  const symptomCounts = new Map<string, number>();
  // key: `${symptom}|${trigger}`
  const pairCounts = new Map<string, number>();

  recordings.forEach((r) => {
    const symptoms = r.structured.symptoms.map(normalize).filter(Boolean);
    const triggers = r.structured.triggers.map(normalize).filter(Boolean);
    symptoms.forEach((s) => {
      symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);
      triggers.forEach((t) => {
        const key = `${s}|${t}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      });
    });
  });

  let best: TriggerCorrelation | null = null;
  pairCounts.forEach((coCount, key) => {
    const [symptom, trigger] = key.split('|');
    if (!symptom || !trigger) return;
    const symptomCount = symptomCounts.get(symptom) ?? 0;
    if (symptomCount < CORRELATION_MIN_SYMPTOM_COUNT) return;
    const pct = Math.round((coCount / symptomCount) * 100);
    if (pct < CORRELATION_MIN_PCT) return;
    if (!best || pct > best.pct || (pct === best.pct && coCount > best.coCount)) {
      best = {
        symptom: capitalize(symptom),
        trigger: capitalize(trigger),
        coCount,
        symptomCount,
        pct,
      };
    }
  });

  return best;
}

const HEATMAP_ROW_LABELS = ['morning', 'midday', 'afternoon', 'evening', 'night'];

/** Peak row of a heatmap (morning / midday / afternoon / evening / night). */
export function peakHeatmapRow(grid: number[][]): string | null {
  const rowSums = grid.map((row) => sum(row));
  const peak = max(rowSums) ?? 0;
  if (peak <= 0) return null;
  return HEATMAP_ROW_LABELS[rowSums.indexOf(peak)] ?? null;
}
