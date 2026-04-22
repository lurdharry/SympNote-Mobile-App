import { format, parseISO, startOfDay } from 'date-fns';
import { capitalize, orderBy, sortBy, take, truncate } from 'lodash';
import { Appointment, Recording } from '../stores/types';

export type DerivedConcern = {
  t: string;
  s: string;
  sev: number;
};

export type DerivedSeverityPoint = {
  d: string;
  v: number;
};

export type DerivedMed = {
  name: string;
  dose: string;
  freq: string;
  last: string;
};

export type DerivedBrief = {
  concerns: DerivedConcern[];
  timeline: string;
  severity: DerivedSeverityPoint[];
  meds: DerivedMed[];
};

const TIMELINE_PREVIEW_CHARS = 160;
const CONCERN_LIMIT = 3;

const shortDate = (iso: string): string => format(parseISO(iso), 'MMM d');

/**
 * Build a visit brief from the recordings attached (via
 * `appointment.relatedRecordingIds`) to the appointment.
 *
 *  - Concerns: top 3 symptom names by frequency, paired with their
 *    supporting detail (most recent duration + peak severity).
 *  - Timeline: narrative combining earliest + most-recent transcripts,
 *    bookended by dates. Falls back to the single transcript when the
 *    user only has one related recording.
 *  - Severity: chronological (date-only, peak per day) for the chart.
 *  - Meds: de-duped from `structured.medications`. We don't know doses
 *    from the current model so we display raw name + "As needed".
 *
 * Returns all-empty arrays when no recordings are attached. Callers
 * decide whether to fall back to demo content or show empty states.
 */
export function deriveAppointmentBrief(
  appointment: Appointment,
  allRecordings: Recording[],
): DerivedBrief {
  const ids = new Set(appointment.relatedRecordingIds);
  const attached = sortBy(
    allRecordings.filter((r) => ids.has(r.id)),
    (r) => parseISO(r.createdAt).getTime(),
  );

  if (attached.length === 0) {
    return { concerns: [], timeline: '', severity: [], meds: [] };
  }

  return {
    concerns: deriveConcerns(attached),
    timeline: deriveTimeline(attached),
    severity: deriveSeverity(attached),
    meds: deriveMeds(attached),
  };
}

interface ConcernAggregate {
  name: string;
  count: number;
  peakSev: number;
  lastDuration: string;
  firstSeenAt: string;
}

function deriveConcerns(entries: Recording[]): DerivedConcern[] {
  const agg = new Map<string, ConcernAggregate>();
  entries.forEach((r) => {
    r.structured.symptoms.forEach((raw) => {
      const name = capitalize(raw.trim().toLowerCase());
      if (!name) return;
      const prev = agg.get(name);
      agg.set(name, {
        name,
        count: (prev?.count ?? 0) + 1,
        peakSev: Math.max(prev?.peakSev ?? 0, r.structured.severity),
        lastDuration: r.structured.duration || prev?.lastDuration || '',
        firstSeenAt: prev?.firstSeenAt ?? r.createdAt,
      });
    });
  });

  const ranked = take(
    orderBy(Array.from(agg.values()), ['count', 'peakSev'], ['desc', 'desc']),
    CONCERN_LIMIT,
  );

  return ranked.map<DerivedConcern>((a) => ({
    t: a.name,
    s: [a.lastDuration, countLabel(a.count)].filter(Boolean).join(' · ') || 'Logged once',
    sev: a.peakSev,
  }));
}

function countLabel(n: number): string {
  if (n === 1) return 'logged once';
  return `logged ${n}×`;
}

function deriveTimeline(entries: Recording[]): string {
  if (entries.length === 0) return '';
  const first = entries[0]!;
  const last = entries[entries.length - 1]!;
  const firstDate = shortDate(first.createdAt);
  const lastDate = shortDate(last.createdAt);
  if (entries.length === 1) {
    return `${firstDate}: ${first.transcript.trim()}`;
  }
  const preview = truncate(last.transcript.trim(), {
    length: TIMELINE_PREVIEW_CHARS,
    omission: '…',
  });
  return `Started ${firstDate}. Most recent entry ${lastDate}: "${preview}".`;
}

function deriveSeverity(entries: Recording[]): DerivedSeverityPoint[] {
  const byDay = new Map<number, DerivedSeverityPoint>();
  entries.forEach((r) => {
    const d = parseISO(r.createdAt);
    const key = startOfDay(d).getTime();
    const prev = byDay.get(key);
    if (!prev || r.structured.severity > prev.v) {
      byDay.set(key, { d: format(d, 'MMM d'), v: r.structured.severity });
    }
  });
  return sortBy(Array.from(byDay.entries()), ([key]) => key).map(([, p]) => p);
}

function deriveMeds(entries: Recording[]): DerivedMed[] {
  const seen = new Map<string, DerivedMed>();
  entries.forEach((r) => {
    r.structured.medications.forEach((raw) => {
      const name = raw.trim();
      if (!name) return;
      const key = name.toLowerCase();
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, {
          name,
          dose: '—',
          freq: 'As needed',
          last: shortDate(r.createdAt),
        });
      } else {
        existing.last = shortDate(r.createdAt);
      }
    });
  });
  return Array.from(seen.values());
}
