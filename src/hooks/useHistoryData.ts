import { useMemo } from "react";
import { format, isSameDay, isYesterday, parseISO } from "date-fns";
import { groupBy } from "lodash";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { formatDuration } from "@/utils/date";

export type FeedKind = "note" | "brief";

export interface NoteFeedItem {
  kind: "note";
  id: string;
  createdAtMs: number;
  date: string;
  time: string;
  dur: string;
  text: string;
}

export interface BriefFeedItem {
  kind: "brief";
  id: string;
  createdAtMs: number;
  date: string;
  time: string;
  title: string;
  sourceCount: number;
  clinicianIds: string[];
  summarySnippet: string;
}

export type FeedItem = NoteFeedItem | BriefFeedItem;

export type FeedFilter = "all" | "notes" | "briefs";

export type FeedDateRange = "all" | "today" | "7d" | "30d";

const DAY_MS = 86_400_000;

const cutoffMsForRange = (range: FeedDateRange): number => {
  const now = Date.now();
  switch (range) {
    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return start.getTime();
    }
    case "7d":
      return now - 7 * DAY_MS;
    case "30d":
      return now - 30 * DAY_MS;
    case "all":
    default:
      return 0;
  }
};

export interface FeedGroup {
  date: string;
  entries: FeedItem[];
}

export interface UseHistoryDataResult {
  items: FeedItem[];
  filtered: FeedItem[];
  groups: FeedGroup[];
  notesCount: number;
  briefsCount: number;
  /** True when the user has no notes AND no briefs. */
  isEmpty: boolean;
}

const dateLabel = (d: Date, today: Date): string => {
  if (isSameDay(d, today)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
};

const matchesQuery = (item: FeedItem, query: string): boolean => {
  if (!query) return true;
  const haystack =
    item.kind === "note"
      ? item.text
      : `${item.title} ${item.summarySnippet}`;
  return haystack.toLowerCase().includes(query.toLowerCase());
};

const matchesFilter = (item: FeedItem, filter: FeedFilter): boolean => {
  if (filter === "all") return true;
  if (filter === "notes") return item.kind === "note";
  return item.kind === "brief";
};

const matchesDate = (item: FeedItem, cutoffMs: number): boolean =>
  cutoffMs === 0 || item.createdAtMs >= cutoffMs;

/**
 * Owns the History tab's derived feed — a unified chronological stream
 * of notes (recordings) and briefs interleaved, date-grouped, with
 * search + kind filtering on top. Tells the user the story of their
 * tracking instead of just listing audio clips.
 */
export const useHistoryData = (
  query: string,
  filter: FeedFilter,
  dateRange: FeedDateRange = "all",
): UseHistoryDataResult => {
  const recordings = useRecordingsStore((s) => s.recordings);
  const briefs = useBriefsStore((s) => s.briefs);
  const isEmpty = recordings.length === 0 && briefs.length === 0;

  const items = useMemo<FeedItem[]>(() => {
    if (isEmpty) return [];
    const today = new Date();

    const notes: NoteFeedItem[] = recordings.map((r) => {
      const d = parseISO(r.createdAt);
      return {
        kind: "note",
        id: r.id,
        createdAtMs: d.getTime(),
        date: dateLabel(d, today),
        time: format(d, "h:mm a"),
        dur: formatDuration(r.durationSec),
        text: r.transcript,
      };
    });

    const briefItems: BriefFeedItem[] = briefs.map((b) => {
      const d = parseISO(b.generatedAt);
      const summary = b.content.summary ?? "";
      const firstSentence = summary.split(/(?<=[.!?])\s+/)[0] ?? summary;
      return {
        kind: "brief",
        id: b.id,
        createdAtMs: d.getTime(),
        date: dateLabel(d, today),
        time: format(d, "h:mm a"),
        title: b.title ?? "Brief",
        sourceCount: b.sourceRecordingIds.length,
        clinicianIds: b.clinicianIds,
        summarySnippet: firstSentence,
      };
    });

    return [...notes, ...briefItems].sort(
      (a, b) => b.createdAtMs - a.createdAtMs,
    );
  }, [recordings, briefs, isEmpty]);

  const filtered = useMemo(() => {
    const cutoffMs = cutoffMsForRange(dateRange);
    return items.filter(
      (it) =>
        matchesQuery(it, query) &&
        matchesFilter(it, filter) &&
        matchesDate(it, cutoffMs),
    );
  }, [items, query, filter, dateRange]);

  const groups = useMemo<FeedGroup[]>(() => {
    const byDate = groupBy(filtered, (it) => it.date);
    const orderedDates: string[] = [];
    filtered.forEach((it) => {
      if (!orderedDates.includes(it.date)) orderedDates.push(it.date);
    });
    return orderedDates.map((date) => ({ date, entries: byDate[date]! }));
  }, [filtered]);

  return {
    items,
    filtered,
    groups,
    notesCount: items.filter((i) => i.kind === "note").length,
    briefsCount: items.filter((i) => i.kind === "brief").length,
    isEmpty,
  };
};
