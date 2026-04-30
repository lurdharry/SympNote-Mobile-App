import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { parseGeminiQuotaError, parseOpenAIQuotaError } from './aiQuota';

// TODO: Move these calls to a server-side proxy before production launch.
// Bundling API keys in a mobile binary is not safe.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export type LLMProvider = 'gemini' | 'openai';
export type LLMTask = 'structure' | 'summary';

// Provider used when a call site doesn't override it. Switch by setting
// EXPO_PUBLIC_LLM_PROVIDER=openai in .env (no code change needed).
export const DEFAULT_PROVIDER: LLMProvider =
  process.env.EXPO_PUBLIC_LLM_PROVIDER === 'openai' ? 'openai' : 'gemini';

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
 * call sites stay free of provider conditionals.
 */
export async function callLLM(
  provider: LLMProvider,
  task: LLMTask,
  req: LLMRequest,
): Promise<string> {
  const model = MODELS[provider][task];
  return provider === 'openai' ? callOpenAI(model, req) : callGemini(model, req);
}

async function callGemini(model: string, req: LLMRequest): Promise<string> {
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
