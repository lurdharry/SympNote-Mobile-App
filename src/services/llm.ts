import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { parseGeminiQuotaError, parseOpenAIQuotaError } from './aiQuota';
import { useProfileStore } from '../stores/useProfileStore';

/** Thrown when the user has not yet granted the AI data-sharing
 *  consent. Caught at the UI layer to redirect to the in-app
 *  consent screen. App Review guideline 5.1.2(i) requires explicit
 *  permission before sending data to third-party AI providers. */
export class AIConsentRequiredError extends Error {
  constructor() {
    super(
      "Sympnote needs your permission before sending notes to its AI providers. Open Settings → Privacy & data → AI data sharing to grant access.",
    );
    this.name = "AIConsentRequiredError";
  }
}

const requireAiConsent = (): void => {
  if (useProfileStore.getState().aiConsentAcceptedAt) return;
  throw new AIConsentRequiredError();
};

// TODO: Move these calls to a server-side proxy before production launch.
// Bundling API keys in a mobile binary is not safe.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export type LLMProvider = 'gemini' | 'openai';
export type LLMTask = 'structure' | 'summary';

// Per-task preferred provider — picked based on observed quality, not
// price. Briefs (the user-facing prose moment) go to Gemini because
// it follows the system prompt's schema more faithfully (e.g. always
// returns the `flags` array; OpenAI's loose json_object mode silently
// drops fields). High-volume invisible JSON structuring goes to
// OpenAI because gpt-4o-mini is cheap and dependable.
//
// Resilience comes from `callLLMWithFallback` — when the preferred
// provider fails, the call automatically retries on the other one
// (see below). No env-level override needed.
const TASK_PREFERRED: Record<LLMTask, LLMProvider> = {
  structure: 'openai',
  summary: 'gemini',
};

/** Resolve which provider should run a given task. */
export const providerFor = (task: LLMTask): LLMProvider => TASK_PREFERRED[task];

// Per-provider model selection.
//   • Gemini 2.5-flash-lite has the highest free-tier RPD — fine for JSON structuring.
//   • Gemini 2.5-flash for summaries — more headroom than 2.5-pro's 100 RPD free tier.
//   • gpt-4o-mini for both on OpenAI — closest to Gemini Flash on price.
const MODELS: Record<LLMProvider, Record<LLMTask, string>> = {
  gemini: {
    structure: 'gemini-2.5-flash-lite',
    summary: 'gemini-2.5-flash',
  },
  openai: {
    structure: 'gpt-4o-mini',
    summary: 'gpt-4o-mini',
  },
};

/**
 * Provider-agnostic request shape. Each adapter translates this into
 * the wire format its SDK expects.
 */
export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  jsonMode?: boolean;
}

const isPlaceholderKey = (key: string): boolean =>
  !key || key === 'your-gemini-api-key-here' || key.startsWith('your-');

// Lazily instantiated SDK clients. Skipped entirely when the matching
// key is a placeholder so module load doesn't fail in dev.
const geminiClient = !isPlaceholderKey(GEMINI_API_KEY)
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

// `dangerouslyAllowBrowser` is required to run the OpenAI SDK in the
// React Native JS runtime. Acceptable here because the key is already
// EXPO_PUBLIC_* and ships in the bundle — same threat model either way.
// Move to a server proxy before production launch (see TODO above).
const openaiClient = !isPlaceholderKey(OPENAI_API_KEY)
  ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  : null;

/**
 * Single entry point. Routes to the configured provider's adapter so
 * call sites stay free of provider conditionals. Hard-gated on
 * AI data-sharing consent — throws `AIConsentRequiredError`
 * synchronously before any network call fires so callers can
 * redirect to the in-app consent screen (App Review 5.1.2(i)).
 */
export async function callLLM(
  provider: LLMProvider,
  task: LLMTask,
  req: LLMRequest,
): Promise<string> {
  requireAiConsent();
  const model = MODELS[provider][task];
  return provider === 'openai' ? callOpenAI(model, req) : callGemini(model, req);
}

/**
 * Try `primary`, fall back to the other provider on any error. Use
 * this for high-value calls (briefs) where the user prefers a
 * degraded result over a hard failure. Structuring should stay on
 * plain `callLLM` — silently swapping the structuring backend would
 * mask real bugs.
 *
 * Heads-up: when fallback fires for a brief, the result may be lower
 * quality than the primary (e.g. OpenAI's loose json_object mode
 * sometimes drops the `flags` field that Gemini honours). Acceptable
 * trade-off: a degraded brief beats a "couldn't generate" error
 * during a prep-night session.
 *
 * If *both* providers fail, the primary's error is rethrown — that's
 * the one most likely to be actionable (placeholder key, quota, etc).
 */
export async function callLLMWithFallback(
  primary: LLMProvider,
  task: LLMTask,
  req: LLMRequest,
): Promise<string> {
  const fallback: LLMProvider = primary === 'gemini' ? 'openai' : 'gemini';
  try {
    return await callLLM(primary, task, req);
  } catch (primaryErr) {
    if (__DEV__) {
      console.warn(
        `[llm] ${primary} failed for task '${task}', falling back to ${fallback}:`,
        primaryErr,
      );
    }
    try {
      return await callLLM(fallback, task, req);
    } catch {
      throw primaryErr;
    }
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function callGemini(
  model: string,
  req: LLMRequest,
  attempt = 0,
): Promise<string> {
  if (!geminiClient) {
    throw new Error(
      'EXPO_PUBLIC_GEMINI_API_KEY is missing or still set to the placeholder. ' +
        'Add a real key to .env and restart Expo with `npx expo start -c`.',
    );
  }
  try {
    const response = await geminiClient.models.generateContent({
      model,
      contents: req.userPrompt,
      config: {
        systemInstruction: req.systemPrompt,
        temperature: req.temperature,
        maxOutputTokens: req.maxOutputTokens,
        ...(req.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    });
    const text = response.text;
    if (!text) throw new Error('Gemini returned no text');
    return text;
  } catch (err) {
    const apiErr = err as { status?: number; message?: string };
    // 503 UNAVAILABLE / "model overloaded" is transient capacity flap on
    // Google's side — retry once after 1.5s before bubbling. Briefs hit
    // this most often during prep-night peaks, which is exactly when
    // the user can least afford a hard failure.
    if (apiErr.status === 503 && attempt < 1) {
      await sleep(1500);
      return callGemini(model, req, attempt + 1);
    }
    if (apiErr.status === 429) throw parseGeminiQuotaError(apiErr.message ?? '');
    throw err;
  }
}

async function callOpenAI(model: string, req: LLMRequest): Promise<string> {
  if (!openaiClient) {
    throw new Error(
      'EXPO_PUBLIC_OPENAI_API_KEY is missing or still set to the placeholder. ' +
        'Add a real key to .env and restart Expo with `npx expo start -c`.',
    );
  }
  try {
    const completion = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userPrompt },
      ],
      temperature: req.temperature,
      max_completion_tokens: req.maxOutputTokens,
      ...(req.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });
    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('OpenAI returned no text');
    return text;
  } catch (err) {
    const apiErr = err as {
      status?: number;
      message?: string;
      headers?: Record<string, string | undefined>;
    };
    if (apiErr.status === 429) throw parseOpenAIQuotaError(apiErr);
    throw err;
  }
}
