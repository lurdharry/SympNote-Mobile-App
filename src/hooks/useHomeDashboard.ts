import { useMemo } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { sortBy } from "lodash";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { topTrendingSymptom } from "@/utils/insights";
import { timeGreeting } from "@/utils/date";
import type { DemoEntry } from "@/constants/demo/home";
import type { Appointment } from "@/stores/types";
import type { Recording } from "@/stores/types";

interface HomeDashboard {
  nextAppointment: Appointment | undefined;
  todayEntries: DemoEntry[];
  nudge: ReturnType<typeof topTrendingSymptom>;
  dateEyebrow: string;
  greeting: string;
  recordingsCount: number;
  /** The user's one-and-only recording when count === 1; used by the
   *  first-entry celebration hero on home. Null otherwise. */
  firstRecording: Recording | null;
  /**
   * Oldest past-date appointment still sitting in 'upcoming' state. The
   * home screen surfaces a PostVisitPrompt for this one; once the user
   * resolves it, the next unresolved (if any) surfaces on re-render.
   * Undefined when everything is resolved.
   */
  unresolvedVisit: Appointment | undefined;
  /** ISO timestamp of the most recent recording, or undefined when the
   *  user has none. The TodayCheckIn card uses this to detect "gap"
   *  states (no log in >48h). */
  lastRecordingAt: string | undefined;
  /** Most-common tag across recordings in the last 7 days. The
   *  TodayCheckIn card personalises its prompt with it ("How's your
   *  knee today?"). Undefined when there's no recent tagged history. */
  recentTopTag: string | undefined;
}

const TODAYS_ENTRY_LIMIT = 5;
const TRANSCRIPT_PREVIEW_LEN = 110;

const toDemoEntry = (r: Recording): DemoEntry => {
  const d = parseISO(r.createdAt);
  return {
    time: format(d, "hh:mm"),
    period: format(d, "a").toUpperCase() as "AM" | "PM",
    text: r.transcript.slice(0, TRANSCRIPT_PREVIEW_LEN),
    tags: r.tags.slice(0, 2).map((t) => ({ t, c: "#2C6E6B" })),
    dur: `${Math.floor(r.durationSec / 60)}:${(r.durationSec % 60).toString().padStart(2, "0")}`,
    kind: "voice",
  };
};

/**
 * Derived data the Home screen renders: the next upcoming appointment,
 * today's logged entries, the real trending-symptom insight, and the
 * date/greeting strings for the header.
 *
 * Demo fallbacks kick in only for the today-entries list so the
 * timeline isn't empty during onboarding review.
 */
export const useHomeDashboard = (): HomeDashboard => {
  const appointments = useAppointmentsStore((s) => s.appointments);
  const recordings = useRecordingsStore((s) => s.recordings);

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    const upcoming = appointments.filter(
      (a) => a.status === "upcoming" && parseISO(a.date).getTime() >= now,
    );
    return sortBy(upcoming, (a) => parseISO(a.date).getTime())[0];
  }, [appointments]);

  const unresolvedVisit = useMemo(() => {
    // Appointment's date is before the start of today (local) and
    // status is still 'upcoming'. We deliberately exclude today so
    // the nudge never fires mid-visit.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const stale = appointments.filter(
      (a) => a.status === "upcoming" && parseISO(a.date).getTime() < startOfToday.getTime(),
    );
    return sortBy(stale, (a) => parseISO(a.date).getTime())[0];
  }, [appointments]);

  const todayEntries = useMemo<DemoEntry[]>(() => {
    if (recordings.length === 0) return [];
    const now = new Date();
    const todays = recordings.filter((r) => isSameDay(parseISO(r.createdAt), now));
    return todays.slice(0, TODAYS_ENTRY_LIMIT).map(toDemoEntry);
  }, [recordings]);

  const nudge = useMemo(() => {
    if (recordings.length < 3) return null;
    return topTrendingSymptom(recordings, "30d");
  }, [recordings]);

  const dateEyebrow = format(new Date(), "EEEE, MMM d");
  const greeting = timeGreeting().replace(".", "");

  const firstRecording = recordings.length === 1 ? recordings[0]! : null;

  const lastRecordingAt = useMemo(() => {
    if (recordings.length === 0) return undefined;
    const newest = sortBy(recordings, (r) => -parseISO(r.createdAt).getTime())[0];
    return newest?.createdAt;
  }, [recordings]);

  const recentTopTag = useMemo(() => {
    if (recordings.length === 0) return undefined;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const counts = new Map<string, number>();
    for (const r of recordings) {
      if (parseISO(r.createdAt).getTime() < cutoff) continue;
      for (const tag of r.tags) {
        const norm = tag.trim();
        if (!norm) continue;
        counts.set(norm, (counts.get(norm) ?? 0) + 1);
      }
    }
    if (counts.size === 0) return undefined;
    let topTag: string | undefined;
    let topCount = 0;
    for (const [tag, count] of counts) {
      if (count > topCount) {
        topTag = tag;
        topCount = count;
      }
    }
    return topTag;
  }, [recordings]);

  return {
    nextAppointment,
    todayEntries,
    nudge,
    dateEyebrow,
    greeting,
    recordingsCount: recordings.length,
    firstRecording,
    unresolvedVisit,
    lastRecordingAt,
    recentTopTag,
  };
};
