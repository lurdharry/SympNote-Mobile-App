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
  allRecordings: Recording[]
): DerivedBrief {
  const ids = new Set(appointment.relatedRecordingIds);
  const attached = allRecordings
    .filter((r) => ids.has(r.id))
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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

function deriveConcerns(entries: Recording[]): DerivedConcern[] {
  // Count symptoms across entries; keep peak severity + most recent
  // duration string as the supporting detail.
  type Agg = {
    count: number;
    peakSev: number;
    lastDuration: string;
    firstSeenAt: string;
  };
  const agg = new Map<string, Agg>();
  entries.forEach((r) => {
    r.structured.symptoms.forEach((raw) => {
      const name = capitalize(raw.trim().toLowerCase());
      if (!name) return;
      const prev = agg.get(name);
      const peakSev = Math.max(prev?.peakSev ?? 0, r.structured.severity);
      const lastDuration = r.structured.duration || prev?.lastDuration || '';
      const firstSeenAt = prev?.firstSeenAt ?? r.createdAt;
      agg.set(name, {
        count: (prev?.count ?? 0) + 1,
        peakSev,
        lastDuration,
        firstSeenAt,
      });
    });
  });

  return Array.from(agg.entries())
    .sort(([, a], [, b]) => b.count - a.count || b.peakSev - a.peakSev)
    .slice(0, 3)
    .map<DerivedConcern>(([name, data]) => {
      const s = [data.lastDuration, countLabel(data.count)]
        .filter(Boolean)
        .join(' · ');
      return {
        t: name,
        s: s || 'Logged once',
        sev: data.peakSev,
      };
    });
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
  return `Started ${firstDate}. Most recent entry ${lastDate}: "${last.transcript
    .trim()
    .slice(0, 160)}${last.transcript.trim().length > 160 ? '…' : ''}".`;
}

function deriveSeverity(entries: Recording[]): DerivedSeverityPoint[] {
  // One point per day — if multiple recordings happened on the same
  // day, keep the peak severity.
  const byDay = new Map<string, DerivedSeverityPoint>();
  entries.forEach((r) => {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const label = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const prev = byDay.get(key);
    if (!prev || r.structured.severity > prev.v) {
      byDay.set(key, { d: label, v: r.structured.severity });
    }
  });
  // Insertion order isn't guaranteed chronological because we've been
  // upserting; resort by original date.
  const ordered = Array.from(byDay.entries()).sort(([a], [b]) => {
    const [ya, ma, da] = a.split('-').map(Number);
    const [yb, mb, db] = b.split('-').map(Number);
    const ta = new Date(ya!, ma!, da!).getTime();
    const tb = new Date(yb!, mb!, db!).getTime();
    return ta - tb;
  });
  return ordered.map(([, p]) => p);
}

function deriveMeds(entries: Recording[]): DerivedMed[] {
  const seen = new Map<string, DerivedMed>();
  entries.forEach((r) => {
    r.structured.medications.forEach((raw) => {
      const name = raw.trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, {
          name,
          dose: '—',
          freq: 'As needed',
          last: shortDate(r.createdAt),
        });
      } else {
        // Update last-seen date if more recent.
        const prev = seen.get(key)!;
        prev.last = shortDate(r.createdAt);
      }
    });
  });
  return Array.from(seen.values());
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0]!.toUpperCase() + s.slice(1);
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
