import { useMemo, useState } from 'react';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import {
  computeHeatmap,
  filterByRange,
  InsightsRange,
  peakHeatmapRow,
  summarize,
  SymptomFrequency,
  symptomFrequencies,
} from '../utils/insights';
import { DEMO_SYMPTOMS } from '../constants/demo/insights';

/**
 * Drives the Insights tab: owns the time-range selector, decides when
 * to render real aggregations versus demo fallbacks (threshold: ≥3
 * recordings in range), and memoizes the expensive transforms.
 */
export function useInsightsData() {
  const [range, setRange] = useState<InsightsRange>('30d');
  const recordings = useRecordingsStore((s) => s.recordings);

  const { summary, symptoms, heatmap, peakLabel, isReal } = useMemo(() => {
    const inRange = filterByRange(recordings, range);
    if (inRange.length < 3) {
      return {
        summary: null,
        symptoms: DEMO_SYMPTOMS as SymptomFrequency[],
        heatmap: null as number[][] | null,
        peakLabel: null as string | null,
        isReal: false,
      };
    }
    const grid = computeHeatmap(inRange);
    return {
      summary: summarize(inRange),
      symptoms: symptomFrequencies(inRange, range, 4),
      heatmap: grid,
      peakLabel: peakHeatmapRow(grid),
      isReal: true,
    };
  }, [recordings, range]);

  return {
    range,
    setRange,
    summary,
    symptoms,
    heatmap,
    peakLabel,
    isReal,
  };
}
