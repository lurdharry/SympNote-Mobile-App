import { useMemo } from 'react';
import { format, isSameDay, isYesterday, parseISO } from 'date-fns';
import { countBy, groupBy, orderBy, toPairs } from 'lodash';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { formatDuration } from '@/utils/date';
import { colorForTag } from '@/utils/tagColor';
import {
  DEMO_ALL_TAGS,
  DEMO_HISTORY_ITEMS,
  HistoryItem,
} from '@/constants/demo/history';

export interface TagOption {
  t: string;
  c: string;
}

export interface HistoryGroup {
  date: string;
  entries: HistoryItem[];
}

export interface UseHistoryDataResult {
  items: HistoryItem[];
  filtered: HistoryItem[];
  allTags: TagOption[];
  groups: HistoryGroup[];
}

const MAX_TAGS_PER_ROW = 3;

const dateLabel = (d: Date, today: Date): string => {
  if (isSameDay(d, today)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

const matchesQuery = (item: HistoryItem, query: string): boolean => {
  if (!query) return true;
  const haystack = `${item.text} ${item.tags.map((x) => x.t).join(' ')}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const matchesTags = (item: HistoryItem, active: string[]): boolean =>
  active.length === 0 || item.tags.some((tg) => active.includes(tg.t));

/**
 * Owns the History tab's derived data: normalizes store recordings into
 * display items, applies the search + tag filter, groups by date, and
 * builds the live tag-filter strip. Demo fallbacks kick in when the
 * store is empty so the layout always has something to render.
 */
export const useHistoryData = (query: string, active: string[]): UseHistoryDataResult => {
  const storeRecordings = useRecordingsStore((s) => s.recordings);

  const items = useMemo<HistoryItem[]>(() => {
    if (storeRecordings.length === 0) return DEMO_HISTORY_ITEMS;
    const today = new Date();
    return storeRecordings.map((r) => {
      const d = parseISO(r.createdAt);
      return {
        id: r.id,
        date: dateLabel(d, today),
        time: format(d, 'h:mm a'),
        dur: formatDuration(r.durationSec),
        text: r.transcript,
        tags: r.tags.slice(0, MAX_TAGS_PER_ROW).map((t) => ({ t, c: colorForTag(t) })),
      };
    });
  }, [storeRecordings]);

  const filtered = useMemo(
    () => items.filter((it) => matchesQuery(it, query) && matchesTags(it, active)),
    [items, query, active],
  );

  const allTags = useMemo<TagOption[]>(() => {
    if (storeRecordings.length === 0) return DEMO_ALL_TAGS;
    const counts = countBy(
      storeRecordings.flatMap((r) => r.tags.map((t) => t.trim().toLowerCase())),
      (t) => t,
    );
    return orderBy(toPairs(counts).filter(([t]) => t.length > 0), [1], ['desc']).map(
      ([t]) => ({ t, c: colorForTag(t) }),
    );
  }, [storeRecordings]);

  const groups = useMemo<HistoryGroup[]>(() => {
    const byDate = groupBy(filtered, (it) => it.date);
    // Preserve the order in which date labels first appeared in `filtered`.
    const orderedDates: string[] = [];
    filtered.forEach((it) => {
      if (!orderedDates.includes(it.date)) orderedDates.push(it.date);
    });
    return orderedDates.map((date) => ({ date, entries: byDate[date]! }));
  }, [filtered]);

  return { items, filtered, allTags, groups };
};
