import { StructuredEntry, Recording } from '../stores/types';

// TODO: Move these calls to a server-side proxy before production launch.
// Bundling API keys in a mobile binary is not safe.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// 2.5-flash-lite has the highest free-tier daily quota (~1000 RPD) and is
// plenty capable for simple JSON structuring.
const STRUCTURE_MODEL = 'gemini-2.5-flash-lite';
// 2.5-flash for summaries — more headroom than 2.5-pro's 100 RPD free tier.
const SUMMARY_MODEL = 'gemini-2.5-flash';

/** Typed error so the UI can distinguish rate limits from real failures. */
export class GeminiQuotaError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSec: number | null,
    public readonly scope: 'minute' | 'day' | 'unknown'
  ) {
    super(message);
    this.name = 'GeminiQuotaError';
  }
}

type StructuredWithSources = StructuredEntry & {
  sourcePhrases: Record<string, string>;
};

type GeminiPart = { text: string };

type GeminiRequest = {
  contents: Array<{ role?: string; parts: GeminiPart[] }>;
  generationConfig?: {
    temperature?: number;
    responseMimeType?: string;
    maxOutputTokens?: number;
  };
  systemInstruction?: { parts: Array<{ text: string }> };
};

async function callGemini(model: string, body: GeminiRequest): Promise<string> {
  if (
    !GEMINI_API_KEY ||
    GEMINI_API_KEY === 'your-gemini-api-key-here' ||
    GEMINI_API_KEY.startsWith('your-')
  ) {
    throw new Error(
      'EXPO_PUBLIC_GEMINI_API_KEY is missing or still set to the placeholder. ' +
        'Add a real key to .env and restart Expo with `npx expo start -c`.'
    );
  }
  const res = await fetch(
    `${GEMINI_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      throw parseQuotaError(errText);
    }
    throw new Error(`Gemini ${model} failed: ${res.status} ${errText}`);
  }
  const json = await res.json();
  const text: string | undefined =
    json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

function parseQuotaError(errText: string): GeminiQuotaError {
  let retry: number | null = null;
  let scope: 'minute' | 'day' | 'unknown' = 'unknown';
  try {
    const parsed = JSON.parse(errText);
    const details: Array<Record<string, unknown>> =
      parsed?.error?.details ?? [];
    for (const d of details) {
      const t = d['@type'];
      if (
        typeof t === 'string' &&
        t.endsWith('google.rpc.RetryInfo') &&
        typeof d['retryDelay'] === 'string'
      ) {
        const delay = d['retryDelay'] as string; // e.g. "56s"
        const n = parseFloat(delay);
        if (Number.isFinite(n)) retry = Math.ceil(n);
      }
      if (t && typeof t === 'string' && t.endsWith('google.rpc.QuotaFailure')) {
        const v = (d['violations'] as Array<{ quotaId?: string }>) ?? [];
        const ids = v.map((x) => x.quotaId ?? '').join(',');
        if (ids.includes('PerDay')) scope = 'day';
        else if (ids.includes('PerMinute')) scope = 'minute';
      }
    }
  } catch {
    // fall through — we still surface a quota error
  }
  const msg =
    scope === 'day'
      ? 'Daily Gemini free-tier limit reached. Try again tomorrow or upgrade your API plan.'
      : retry
      ? `Gemini rate limit — try again in ${retry}s.`
      : 'Gemini rate limit reached. Please wait and try again.';
  return new GeminiQuotaError(msg, retry, scope);
}

const STRUCTURE_SYSTEM = `You are a clinical-intake assistant preparing a patient for their doctor's appointment. Extract highly structured symptom data from the patient's description.

Return VALID JSON ONLY with these fields:
- symptoms: string[] — concise symptom names (e.g. ["dull ache", "stiffness"]). Max 5.
- location: string — specific body region or "" if none.
- duration: string — e.g. "3 days", "2 weeks", "since last month", or "" if not stated.
- severity: integer 1-10 — best calibrated estimate from the patient's language. If they say "mild", use 2-3; "uncomfortable/annoying", 4-5; "bad/hard to ignore", 6-7; "severe/worst ever", 8-10. Default 5 if unclear.
- triggers: string[] — what makes it worse, brings it on, or relieves it. Max 5.
- medications: string[] — anything they mention taking (OTC, prescribed, supplements). [] if none.
- notes: string — short free-text of meaningful context NOT in other fields (e.g. "worried about work stress contributing").
- bodySystem: string — one of "Musculoskeletal", "Cardiovascular", "Respiratory", "Neurological", "Gastrointestinal", "Dermatological", "Genitourinary", "Endocrine", "Psychological", "ENT", "Ophthalmic", "Constitutional", or "" if uncertain.
- redFlags: string[] — short phrases (max 6 words each) describing anything the patient should make sure their doctor hears. Examples: "chest pain on exertion", "severity ≥8/10", "sudden onset", "persistent >2 weeks", "numbness or weakness", "blood reported", "shortness of breath". [] when nothing warrants flagging. Be specific — cite what they said.
- urgency: one of "routine" | "follow-up" | "soon" | "urgent".
  - "routine": mild, chronic, well-controlled.
  - "follow-up": worth bringing up at next scheduled visit.
  - "soon": within 1-2 weeks ideally.
  - "urgent": they should consider same-day care (severe pain, neurological signs, chest pain, breathing trouble, bleeding). Reserve for clear signals.
- sourcePhrases: { symptoms?: string; location?: string; duration?: string; severity?: string; triggers?: string; medications?: string; redFlags?: string }
  Each value MUST be an exact substring of the transcript (case-sensitive). Omit keys with no supporting phrase.

Rules:
- NEVER diagnose. NEVER suggest treatment. NEVER prescribe.
- NEVER fabricate symptoms the patient didn't mention.
- If the patient says something reassuring ("it's mild", "nothing serious"), respect their framing — don't over-flag.
- redFlags is for patient safety cues, not alarmism. If unsure, leave it empty.`;

const VALID_URGENCY: ReadonlyArray<string> = [
  'routine',
  'follow-up',
  'soon',
  'urgent',
];

function safeParseStructured(raw: string): StructuredWithSources {
  const trimmed = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(trimmed);
  const sev = Number(parsed.severity);
  const urgencyRaw = typeof parsed.urgency === 'string' ? parsed.urgency : '';
  return {
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms.map(String) : [],
    location: typeof parsed.location === 'string' ? parsed.location : '',
    duration: typeof parsed.duration === 'string' ? parsed.duration : '',
    severity: Number.isFinite(sev) ? Math.max(1, Math.min(10, Math.round(sev))) : 5,
    triggers: Array.isArray(parsed.triggers) ? parsed.triggers.map(String) : [],
    medications: Array.isArray(parsed.medications)
      ? parsed.medications.map(String)
      : [],
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    bodySystem: typeof parsed.bodySystem === 'string' ? parsed.bodySystem : '',
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.map(String) : [],
    urgency: (VALID_URGENCY.includes(urgencyRaw)
      ? urgencyRaw
      : 'routine') as StructuredWithSources['urgency'],
    sourcePhrases:
      parsed.sourcePhrases && typeof parsed.sourcePhrases === 'object'
        ? (Object.fromEntries(
            Object.entries(parsed.sourcePhrases).filter(
              ([, v]) => typeof v === 'string' && v.length > 0
            )
          ) as Record<string, string>)
        : {},
  };
}

export async function structureTranscript(
  transcript: string
): Promise<StructuredWithSources> {
  const text = await callGemini(STRUCTURE_MODEL, {
    systemInstruction: { parts: [{ text: STRUCTURE_SYSTEM }] },
    contents: [{ parts: [{ text: `Transcript:\n${transcript}` }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
  });
  try {
    return safeParseStructured(text);
  } catch {
    return {
      symptoms: [],
      location: '',
      duration: '',
      severity: 5,
      triggers: [],
      medications: [],
      notes: transcript.slice(0, 200),
      bodySystem: '',
      redFlags: [],
      urgency: 'routine',
      sourcePhrases: {},
    };
  }
}

const SUMMARY_SYSTEM = `You are preparing a patient for a doctor's appointment. Write a clinical-grade summary they can show or read to their doctor — tight, professional, scannable. Write in the patient's voice (first person), never diagnose, never prescribe.

Output MARKDOWN with these exact section headers, in this order. Omit "Worth flagging" if there are no real concerns — do not fabricate.

## Chief concern
One sentence stating the primary reason for the visit (e.g. "Worsening knee pain when climbing stairs for the past 2 weeks.").

## What's been happening
2–4 short sentences of narrative: onset, progression, what the patient notices most. Use their own descriptors.

## Patterns we noticed
3–5 bullets. Focus on triggers, relief factors, frequency, time of day, context. Each bullet starts with a bolded hook. Example:
- **Stairs:** Pain spikes climbing up, not descending.
- **Worse in evenings** after long sitting.

## Worth flagging
(Only if genuinely concerning — omit section otherwise.)
2–4 bullets for things the doctor would want to hear early. Each starts with a ⚠ and a bolded label. Example:
- ⚠ **Severity 8/10** during episodes, interferes with sleep.
- ⚠ **Persistent >2 weeks** without improvement.

## Questions for your doctor
4–6 bullets, ranked by importance. Phrased as the patient would say them, specific, answerable. Example:
- Could this be related to the statin I started in March?
- Is imaging (MRI / X-ray) worth considering?

## Before your visit
3–4 bullets of self-checks the patient should be ready to discuss — specific things to time/measure/notice. Example:
- Note exactly when pain peaks (mornings? after activity?).
- Count episodes over the next 48 hours.

Tone: clinical but human. No fluff, no hedging, no "consult your doctor" boilerplate — that's implicit. Keep the whole thing under 400 words.`;

export async function generateAppointmentSummary(
  recordings: Recording[]
): Promise<string> {
  const logs = recordings
    .slice()
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((r, i) => {
      const s = r.structured;
      return `Entry ${i + 1} (${new Date(r.createdAt).toLocaleString('en-US')}):
Transcript: ${r.transcript}
Symptoms: ${s.symptoms.join(', ') || '—'}
Location: ${s.location || '—'}
Duration: ${s.duration || '—'}
Severity: ${s.severity}/10
Triggers: ${s.triggers.join(', ') || '—'}
Medications: ${s.medications.join(', ') || '—'}`;
    })
    .join('\n\n');

  return callGemini(SUMMARY_MODEL, {
    systemInstruction: { parts: [{ text: SUMMARY_SYSTEM }] },
    contents: [{ parts: [{ text: `Patient symptom logs:\n\n${logs}` }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
  });
}

export type { StructuredWithSources };
