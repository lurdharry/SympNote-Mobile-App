import { format, parseISO } from 'date-fns';
import { sortBy } from 'lodash';
import type {
  Appointment,
  AppointmentBrief,
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

const EMPTY_BRIEF: AppointmentBrief = {
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
): AppointmentBrief['topConcerns'] => {
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
): AppointmentBrief['timeline'] => {
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

const parseBrief = (text: string): AppointmentBrief => {
  const raw = JSON.parse(stripJsonFence(text)) as Record<string, unknown>;
  return {
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    topConcerns: asLabeledArray(raw.topConcerns),
    timeline: asTimelineArray(raw.timeline),
    patterns: asStringArray(raw.patterns),
    medications: asStringArray(raw.medications),
    questions: asStringArray(raw.questions),
    flags: asStringArray(raw.flags),
  };
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
): Promise<AppointmentBrief> {
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

  try {
    return parseBrief(text);
  } catch {
    // Fall back to a shell brief carrying the raw prose. Caller can
    // retry; in the meantime the user still sees something useful.
    return { ...EMPTY_BRIEF, summary: text.slice(0, 800) };
  }
}

export { GeminiQuotaError };
export type { StructuredWithSources };
