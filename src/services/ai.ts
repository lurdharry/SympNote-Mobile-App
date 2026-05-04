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
import { LLMQuotaError } from './aiQuota';
import { parseStructured, type StructuredWithSources } from './aiParse';
import { callLLM, callLLMWithFallback, providerFor, type LLMProvider } from './llm';
import { EMPTY_BRIEF, parseBrief } from './aiBriefParse';

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

export async function structureTranscript(
  transcript: string,
  profile?: PersonalizationProfile | null,
  provider?: LLMProvider,
): Promise<StructuredWithSources> {
  const text = await callLLMWithFallback(provider ?? providerFor('structure'), 'structure', {
    systemPrompt: STRUCTURE_SYSTEM_PROMPT,
    userPrompt: withContext(`Transcript:\n${transcript}`, profile),
    temperature: 0.2,
    maxOutputTokens: 1024,
    jsonMode: true,
  });
  try {
    return parseStructured(text);
  } catch {
    return { ...FALLBACK_STRUCTURED, notes: transcript.slice(0, 200) };
  }
}

export async function generateAppointmentSummary(
  recordings: Recording[],
  profile?: PersonalizationProfile | null,
  provider?: LLMProvider,
): Promise<string> {
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  return callLLM(provider ?? providerFor('summary'), 'summary', {
    systemPrompt: SUMMARY_SYSTEM_PROMPT,
    userPrompt: withContext(`Patient symptom logs:\n\n${logs}`, profile),
    temperature: 0.4,
    maxOutputTokens: 1200,
  });
}

// Doctor name is intentionally omitted from the prompt — the model
// only needs the specialty to frame the brief, and we don't want to
// send personally-identifying clinician info to the AI.
const formatAppointmentHeader = (appt: Appointment): string =>
  `Upcoming appointment with a ${appt.specialty || 'clinician'} on ${format(parseISO(appt.date), 'PPPP')}.`;

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
  provider?: LLMProvider,
): Promise<BriefContent> {
  if (recordings.length === 0) {
    return EMPTY_BRIEF;
  }
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  const body = `${formatAppointmentHeader(appointment)}\n\nEntries the patient has logged since starting to track:\n\n${logs}`;

  const text = await callLLMWithFallback(provider ?? providerFor('summary'), 'summary', {
    systemPrompt: BRIEF_SYSTEM_PROMPT,
    userPrompt: withContext(body, profile),
    temperature: 0.3,
    maxOutputTokens: 2048,
    jsonMode: true,
  });

  return parseBrief(text) ?? { ...EMPTY_BRIEF };
}

// Clinician name is intentionally omitted — only the role is sent.
const formatClinicianHeader = (clinician: Clinician): string =>
  `Brief for a ${clinician.role || 'clinician'}. The patient may not have a scheduled visit yet — focus on what's been going on so they can act when ready.`;

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
  provider?: LLMProvider,
): Promise<BriefContent> {
  if (recordings.length === 0) {
    return EMPTY_BRIEF;
  }
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  const body = `${formatClinicianHeader(clinician)}\n\nEntries the patient has logged since starting to track:\n\n${logs}`;

  const text = await callLLMWithFallback(provider ?? providerFor('summary'), 'summary', {
    systemPrompt: BRIEF_SYSTEM_PROMPT,
    userPrompt: withContext(body, profile),
    temperature: 0.3,
    maxOutputTokens: 2048,
    jsonMode: true,
  });

  return parseBrief(text) ?? { ...EMPTY_BRIEF };
}

interface BriefHeaderArgs {
  clinicians?: Clinician[];
  windowLabel: string;
}

const formatBriefHeader = ({ clinicians, windowLabel }: BriefHeaderArgs): string => {
  if (clinicians && clinicians.length > 0) {
    // Clinician names are intentionally omitted — only roles are sent
    // to the AI. The model needs specialty context for framing; it
    // does not need to know who the clinicians are.
    const roles = clinicians.map((c) => c.role || 'clinician').join(', ');
    return `Brief for: ${roles}. Window: ${windowLabel}.`;
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
  provider?: LLMProvider;
}): Promise<BriefContent> {
  const { recordings, windowLabel, clinicians, profile, provider = providerFor('summary') } = args;
  if (recordings.length === 0) {
    return EMPTY_BRIEF;
  }
  const logs = sortBy(recordings, (r) => parseISO(r.createdAt).getTime())
    .map(formatLog)
    .join('\n\n');

  const body = `${formatBriefHeader({ clinicians, windowLabel })}\n\nNotes the patient logged in this window:\n\n${logs}`;

  const text = await callLLMWithFallback(provider, 'summary', {
    systemPrompt: BRIEF_SYSTEM_PROMPT,
    userPrompt: withContext(body, profile),
    temperature: 0.3,
    maxOutputTokens: 2048,
    jsonMode: true,
  });

  return parseBrief(text) ?? { ...EMPTY_BRIEF };
}

export { LLMQuotaError };
export type { StructuredWithSources };
export type { LLMProvider } from './llm';
