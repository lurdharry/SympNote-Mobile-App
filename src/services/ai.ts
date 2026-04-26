import { format, parseISO } from 'date-fns';
import { sortBy } from 'lodash';
import type {
  Appointment,
  BriefContent,
  Clinician,
  PersonalizationProfile,
  Recording,
} from '@/stores/types';
import {
  BRIEF_SYSTEM_PROMPT,
  STRUCTURE_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildPatientContext,
} from '@/constants/aiPrompts';
import { useProfileStore } from '@/stores/useProfileStore';
import { GeminiQuotaError, parseQuotaError } from './aiQuota';
import { parseStructured, type StructuredWithSources } from './aiParse';

// TODO: Move these calls to a server-side proxy before production launch.
// Bundling API keys in a mobile binary is not safe.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// 2.5-flash-lite has the highest free-tier daily quota (~1000 RPD) and is
// plenty capable for simple JSON structuring.
const STRUCTURE_MODEL = 'gemini-2.5-flash-lite';
// 2.5-flash for summaries — more headroom than 2.5-pro's 100 RPD free tier.
const SUMMARY_MODEL = 'gemini-2.5-flash';

interface GeminiPart {
  text: string;
}

interface GeminiRequest {
  contents: Array<{ role?: string; parts: GeminiPart[] }>;
  generationConfig?: {
    temperature?: number;
    responseMimeType?: string;
    maxOutputTokens?: number;
  };
  systemInstruction?: { parts: Array<{ text: string }> };
}

const isPlaceholderKey = (key: string): boolean =>
  !key || key === 'your-gemini-api-key-here' || key.startsWith('your-');

async function callGemini(model: string, body: GeminiRequest): Promise<string> {
  if (isPlaceholderKey(GEMINI_API_KEY)) {
    throw new Error(
      'EXPO_PUBLIC_GEMINI_API_KEY is missing or still set to the placeholder. ' +
        'Add a real key to .env and restart Expo with `npx expo start -c`.',
    );
  }
  const res = await fetch(
    `${GEMINI_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw parseQuotaError(errText);
    throw new Error(`Gemini ${model} failed: ${res.status} ${errText}`);
  }
  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

const FALLBACK_STRUCTURED: Omit<StructuredWithSources, 'notes'> = {
  symptoms: [],
  location: '',
  duration: '',
  severity: 0,
  triggers: [],
  relievers: [],
  medications: [],
  bodySystem: '',
  redFlags: [],
  urgency: 'routine',
  sourcePhrases: {},
};

const currentProfile = (): PersonalizationProfile | null =>
  useProfileStore.getState().personalization;

const withContext = (body: string, profile?: PersonalizationProfile | null): string => {
  const context = buildPatientContext(profile === undefined ? currentProfile() : profile);
  return context ? `${context}\n\n${body}` : body;
};

export async function structureTranscript(
  transcript: string,
  profile?: PersonalizationProfile | null,
): Promise<StructuredWithSources> {
  const text = await callGemini(STRUCTURE_MODEL, {
    systemInstruction: { parts: [{ text: STRUCTURE_SYSTEM_PROMPT }] },
    contents: [
      { parts: [{ text: withContext(`Transcript:\n${transcript}`, profile) }] },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
  });
  try {
    return parseStructured(text);
  } catch {
    return { ...FALLBACK_STRUCTURED, notes: transcript.slice(0, 200) };
  }
}

const formatLog = (r: Recording, i: number): string => {
  const s = r.structured;
  return `Entry ${i + 1} (${format(parseISO(r.createdAt), 'PPpp')}):
Transcript: ${r.transcript}
Symptoms: ${s.symptoms.join(', ') || '—'}
Location: ${s.location || '—'}
Duration: ${s.duration || '—'}
Severity: ${s.severity}/10
Triggers: ${s.triggers.join(', ') || '—'}
Medications: ${s.medications.join(', ') || '—'}`;
};

export async function generateAppointmentSummary(
  recordings: Recording[],
  profile?: PersonalizationProfile | null,
): Promise<string> {
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  return callGemini(SUMMARY_MODEL, {
    systemInstruction: { parts: [{ text: SUMMARY_SYSTEM_PROMPT }] },
    contents: [
      { parts: [{ text: withContext(`Patient symptom logs:\n\n${logs}`, profile) }] },
    ],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
  });
}

const EMPTY_BRIEF: BriefContent = {
  summary: '',
  topConcerns: [],
  timeline: [],
  patterns: [],
  medications: [],
  questions: [],
  flags: [],
};

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];

const asLabeledArray = (
  v: unknown,
): BriefContent['topConcerns'] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const label = (item as { label?: unknown }).label;
      const detail = (item as { detail?: unknown }).detail;
      if (typeof label !== 'string' || !label.trim()) return null;
      return {
        label: label.trim(),
        detail: typeof detail === 'string' ? detail.trim() : '',
      };
    })
    .filter((x): x is { label: string; detail: string } => x !== null);
};

const asTimelineArray = (
  v: unknown,
): BriefContent['timeline'] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const date = (item as { date?: unknown }).date;
      const line = (item as { line?: unknown }).line;
      if (typeof date !== 'string' || typeof line !== 'string') return null;
      if (!date.trim() || !line.trim()) return null;
      return { date: date.trim(), line: line.trim() };
    })
    .filter((x): x is { date: string; line: string } => x !== null);
};

const stripJsonFence = (text: string): string => {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return trimmed;
};

/**
 * Last-ditch JSON extractor — finds the first `{` and the last `}` and
 * returns the slice between. Catches the case where Gemini prepends a
 * sentence like "Here's the brief:" before the actual JSON, which
 * makes a strict JSON.parse fail.
 */
const extractJsonObject = (text: string): string | null => {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
};

/**
 * Pull a field from the raw object, accepting common alias spellings.
 * Gemini occasionally outputs snake_case or shortened keys despite
 * the schema. Trying a few aliases makes parse hits much more
 * forgiving.
 */
const pick = (raw: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const k of keys) {
    if (raw[k] !== undefined) return raw[k];
  }
  return undefined;
};

const buildBrief = (raw: Record<string, unknown>): BriefContent => ({
  summary: typeof pick(raw, 'summary', 'overview') === 'string'
    ? (pick(raw, 'summary', 'overview') as string).trim()
    : '',
  topConcerns: asLabeledArray(pick(raw, 'topConcerns', 'top_concerns', 'concerns')),
  timeline: asTimelineArray(pick(raw, 'timeline', 'events')),
  patterns: asStringArray(pick(raw, 'patterns', 'observations')),
  medications: asStringArray(pick(raw, 'medications', 'meds')),
  questions: asStringArray(pick(raw, 'questions', 'questions_to_ask')),
  flags: asStringArray(pick(raw, 'flags', 'redFlags', 'red_flags')),
});

/**
 * Try several strategies to coax JSON out of the model output:
 *   1. parse the raw text (works when responseMimeType is honoured)
 *   2. parse after stripping ``` fences
 *   3. parse the substring between the first `{` and last `}`
 * Returns null when every strategy fails — the caller surfaces the
 * empty-state retry UI instead of dumping JSON into the summary.
 */
const parseBrief = (text: string): BriefContent | null => {
  const candidates: string[] = [text.trim(), stripJsonFence(text)];
  const extracted = extractJsonObject(text);
  if (extracted) candidates.push(extracted);

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const raw = JSON.parse(candidate) as Record<string, unknown>;
      if (raw && typeof raw === 'object') return buildBrief(raw);
    } catch {
      // try the next strategy
    }
  }
  return null;
};

const formatAppointmentHeader = (appt: Appointment): string =>
  `Upcoming appointment: ${appt.doctorName} (${appt.specialty}) on ${format(parseISO(appt.date), 'PPPP')}.`;

/**
 * Generate a structured visit brief from a list of recordings for a
 * specific appointment. Uses the appointment's doctor + specialty +
 * date to tailor tone and question selection. Falls back to an empty
 * brief shell if JSON parsing fails (caller can retry).
 */
export async function generateAppointmentBrief(
  appointment: Appointment,
  recordings: Recording[],
  profile?: PersonalizationProfile | null,
): Promise<BriefContent> {
  if (recordings.length === 0) {
    return EMPTY_BRIEF;
  }
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  const body = `${formatAppointmentHeader(appointment)}\n\nEntries the patient has logged since starting to track:\n\n${logs}`;

  const text = await callGemini(SUMMARY_MODEL, {
    systemInstruction: { parts: [{ text: BRIEF_SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: withContext(body, profile) }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
    },
  });

  return parseBrief(text) ?? { ...EMPTY_BRIEF };
}

const formatClinicianHeader = (clinician: Clinician): string =>
  `Brief for ${clinician.name} (${clinician.role}). The patient may not have a scheduled visit yet — focus on what's been going on so they can act when ready.`;

/**
 * Generate a structured brief for a clinician — independent of any
 * scheduled appointment. Uses the same model + system prompt as the
 * appointment-anchored variant; only the framing changes so the
 * output reads as "what to tell Dr. X" rather than "for the visit on
 * Apr 25." Falls back to a shell brief on parse failure.
 */
export async function generateClinicianBrief(
  clinician: Clinician,
  recordings: Recording[],
  profile?: PersonalizationProfile | null,
): Promise<BriefContent> {
  if (recordings.length === 0) {
    return EMPTY_BRIEF;
  }
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  const body = `${formatClinicianHeader(clinician)}\n\nEntries the patient has logged since starting to track:\n\n${logs}`;

  const text = await callGemini(SUMMARY_MODEL, {
    systemInstruction: { parts: [{ text: BRIEF_SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: withContext(body, profile) }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
    },
  });

  return parseBrief(text) ?? { ...EMPTY_BRIEF };
}

interface BriefHeaderArgs {
  clinicians?: Clinician[];
  windowLabel: string;
}

const formatBriefHeader = ({ clinicians, windowLabel }: BriefHeaderArgs): string => {
  if (clinicians && clinicians.length > 0) {
    const names = clinicians.map((c) => `${c.name} (${c.role})`).join(', ');
    return `Brief for ${names}. Window: ${windowLabel}.`;
  }
  return `General brief. Window: ${windowLabel}. Audience is unspecified — write so any clinician could read it.`;
};

/**
 * Generate a standalone brief — the new first-class entity. Window-
 * anchored, optional multi-clinician audience tag. Same model and
 * system prompt as the legacy variants; only the framing differs so
 * the output reads naturally for the chosen scope.
 */
export async function generateBrief(args: {
  recordings: Recording[];
  windowLabel: string;
  clinicians?: Clinician[];
  profile?: PersonalizationProfile | null;
}): Promise<BriefContent> {
  const { recordings, windowLabel, clinicians, profile } = args;
  if (recordings.length === 0) {
    return EMPTY_BRIEF;
  }
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  const body = `${formatBriefHeader({ clinicians, windowLabel })}\n\nNotes the patient logged in this window:\n\n${logs}`;

  const text = await callGemini(SUMMARY_MODEL, {
    systemInstruction: { parts: [{ text: BRIEF_SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: withContext(body, profile) }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
    },
  });

  return parseBrief(text) ?? { ...EMPTY_BRIEF };
}

export { GeminiQuotaError };
export type { StructuredWithSources };
