import { InsightsRange } from '../utils/insights';

/** Time-range switcher options for the Insights tab. */
export const RANGES: InsightsRange[] = ['7d', '30d', '90d', 'All'];

/** Column headers for the symptom × time-of-day heatmap. */
export const DAY_COLS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Row labels for the symptom × time-of-day heatmap. */
export const ROW_LABELS = ['AM', 'Noon', 'PM', 'Eve', 'Night'];
