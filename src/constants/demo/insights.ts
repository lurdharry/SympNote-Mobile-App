import { SymptomFrequency } from '../../utils/insights';

export type DemoSymptom = SymptomFrequency;

export type DemoCorrelation = {
  a: string;
  b: string;
  strength: number;
  pattern: string;
  severity: string;
};

/**
 * Demo symptom rows surfaced when the user has <3 recordings in the
 * selected range — keeps the chart populated during onboarding/review.
 */
export const DEMO_SYMPTOMS: DemoSymptom[] = [
  { name: 'Knee pain', count: 18, trend: 'up',   pct: 72, color: '#2C6E6B', sparkline: [3,4,5,4,6,7,6,5,7,8] },
  { name: 'Fatigue',   count: 12, trend: 'up',   pct: 48, color: '#F6C06A', sparkline: [4,5,4,6,5,7,6,5,6,7] },
  { name: 'Headache',  count:  6, trend: 'down', pct: 24, color: '#E07A5F', sparkline: [5,6,4,3,4,3,2,2,3,2] },
  { name: 'Nausea',    count:  3, trend: 'flat', pct: 12, color: '#D97706', sparkline: [2,3,2,3,2,3,2,2,3,2] },
];

/** Demo correlations. Real correlation logic needs more data than
 * most early users will have. */
export const DEMO_CORRELATIONS: DemoCorrelation[] = [
  { a: 'Fatigue',   b: 'Poor sleep',   strength: 0.8, pattern: 'Fatigue follows nights with <6h sleep 4 of 5 times.', severity: 'strong'   },
  { a: 'Knee pain', b: 'Stairs',       strength: 0.7, pattern: 'Knee pain is ~2× more severe on days you mention stairs.', severity: 'strong' },
  { a: 'Headache',  b: 'Dehydration',  strength: 0.5, pattern: 'Headaches cluster on low-water days.', severity: 'moderate' },
];

/**
 * Shape-only demo heatmap. Intentionally smooth so it doesn't look
 * like it's claiming a specific user pattern.
 */
export const DEMO_HEATMAP: number[][] = (() => {
  const rows = 5;
  const cols = 7;
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const intensity = (Math.sin(r * 1.3 + c * 0.7) + 1) / 2;
      return r === 0 || r === 2 ? intensity * 0.9 : intensity * 0.4;
    })
  );
})();
