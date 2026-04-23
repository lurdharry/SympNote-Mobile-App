import { useMemo, useState } from 'react';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import {
  computeHeatmap,
  filterByRange,
  InsightsRange,
  InsightsSummary,
  peakHeatmapRow,
  summarize,
  SymptomFrequency,
  symptomFrequencies,
} from '@/utils/insights';

const INSIGHTS_THRESHOLD = 3;

export interface InsightsData {
  range: InsightsRange;
  setRange: (r: InsightsRange) => void;
  summary: InsightsSummary | null;
  symptoms: SymptomFrequency[];
  heatmap: number[][] | null;
  peakLabel: string | null;
  /** Total recordings the user has, regardless of range. Drives the empty state. */
  totalRecordings: number;
  /**
   * Recordings inside the selected range. When below
   * `INSIGHTS_THRESHOLD`, there's not enough data to compute meaningful
   * aggregations — the screen shows an "add more entries" hint.
   */
  inRangeCount: number;
  /** True once there are enough in-range recordings for aggregation. */
  hasEnoughData: boolean;
}

/**
 * Drives the Insights tab: owns the time-range selector and computes
 * aggregations once the user has at least `INSIGHTS_THRESHOLD`
 * recordings in the selected window. Below that threshold we return
 * empty arrays and let the screen render an empty/progress state
 * instead of demo charts.
 */
export const useInsightsData = (): InsightsData => {
  const [range, setRange] = useState<InsightsRange>('30d');
  const recordings = useRecordingsStore((s) => s.recordings);

  const derived = useMemo(() => {
    const inRange = filterByRange(recordings, range);
    const hasEnoughData = inRange.length >= INSIGHTS_THRESHOLD;
    if (!hasEnoughData) {
      return {
        summary: null,
        symptoms: [] as SymptomFrequency[],
        heatmap: null as number[][] | null,
        peakLabel: null as string | null,
        inRangeCount: inRange.length,
        hasEnoughData: false,
      };
    }
    const grid = computeHeatmap(inRange);
    return {
      summary: summarize(inRange),
      symptoms: symptomFrequencies(inRange, range, 4),
      heatmap: grid,
      peakLabel: peakHeatmapRow(grid),
      inRangeCount: inRange.length,
      hasEnoughData: true,
    };
  }, [recordings, range]);

  return {
    range,
    setRange,
    ...derived,
    totalRecordings: recordings.length,
  };
};
