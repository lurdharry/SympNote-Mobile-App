import { TAG_PALETTE } from '../palette';

export type HistoryItem = {
  id: string;
  date: string;
  time: string;
  dur: string;
  text: string;
  tags: { t: string; c: string }[];
};

function colorForTag(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length]!;
}

/**
 * Demo fallback history entries — shown when the user has logged
 * nothing yet so the layout stays dense during prototyping/review.
 */
export const DEMO_HISTORY_ITEMS: HistoryItem[] = [
  { id: 'h0', date: 'Today',     time: '10:42 AM', dur: '1:24', text: 'Morning knee pain, 6/10, worse on stairs. Stiffness lasted about 30 minutes after waking.', tags: [{t:'knee',c:'#2C6E6B'},{t:'pain',c:'#E07A5F'}] },
  { id: 'h1', date: 'Today',     time: '08:15 AM', dur: '0:48', text: 'Afternoon fatigue returning, slept 6h. Feeling drained mid-afternoon again.', tags: [{t:'fatigue',c:'#F6C06A'},{t:'sleep',c:'#5A8F6E'}] },
  { id: 'h2', date: 'Yesterday', time: '07:22 PM', dur: '2:10', text: 'Knee pain after walk, noted slight swelling around kneecap. 7/10 after 30min walk.', tags: [{t:'knee',c:'#2C6E6B'},{t:'pain',c:'#E07A5F'}] },
  { id: 'h3', date: 'Yesterday', time: '09:20 AM', dur: '0:52', text: 'Ibuprofen 400mg for knee pain. Took with breakfast.', tags: [{t:'meds',c:'#5A8F6E'}] },
  { id: 'h4', date: 'Nov 20',    time: '09:05 AM', dur: '1:38', text: 'Headache behind eyes, took ibuprofen. Resolved in an hour.', tags: [{t:'headache',c:'#E07A5F'},{t:'meds',c:'#5A8F6E'}] },
  { id: 'h5', date: 'Nov 19',    time: '06:50 PM', dur: '0:55', text: 'Feeling tired, mild nausea after dinner. Ate late.', tags: [{t:'fatigue',c:'#F6C06A'},{t:'nausea',c:'#D97706'}] },
  { id: 'h6', date: 'Nov 18',    time: '11:10 AM', dur: '1:12', text: 'Right knee stiff in the morning. Eased after 20 min of movement.', tags: [{t:'knee',c:'#2C6E6B'}] },
];

/**
 * Demo tag set shown in the filter strip when the store is empty.
 */
export const DEMO_ALL_TAGS = [
  'knee',
  'pain',
  'fatigue',
  'sleep',
  'meds',
  'headache',
  'nausea',
].map((t) => ({ t, c: colorForTag(t) }));
