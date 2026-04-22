import { format, parseISO } from 'date-fns';
import { sortBy } from 'lodash';
import type { Recording } from '@/stores/types';
import { STRUCTURE_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT } from '@/constants/aiPrompts';
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
  severity: 5,
  triggers: [],
  medications: [],
  bodySystem: '',
  redFlags: [],
  urgency: 'routine',
  sourcePhrases: {},
};

export async function structureTranscript(
  transcript: string,
): Promise<StructuredWithSources> {
  const text = await callGemini(STRUCTURE_MODEL, {
    systemInstruction: { parts: [{ text: STRUCTURE_SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: `Transcript:\n${transcript}` }] }],
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
): Promise<string> {
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  return callGemini(SUMMARY_MODEL, {
    systemInstruction: { parts: [{ text: SUMMARY_SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: `Patient symptom logs:\n\n${logs}` }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
  });
}

export { GeminiQuotaError };
export type { StructuredWithSources };
