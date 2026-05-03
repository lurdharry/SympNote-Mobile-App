/** Typed error so the UI can distinguish rate limits from real failures. */
export class LLMQuotaError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSec: number | null,
    public readonly scope: 'minute' | 'day' | 'unknown',
  ) {
    super(message);
    this.name = 'LLMQuotaError';
  }
}

interface QuotaDetail {
  '@type'?: unknown;
  retryDelay?: string;
  violations?: Array<{ quotaId?: string }>;
}

const quotaScope = (details: QuotaDetail[]): 'minute' | 'day' | 'unknown' => {
  const violations = details.find((d) =>
    typeof d['@type'] === 'string' && (d['@type'] as string).endsWith('QuotaFailure'),
  )?.violations;
  if (!violations) return 'unknown';
  const ids = violations.map((v) => v.quotaId ?? '').join(',');
  if (ids.includes('PerDay')) return 'day';
  if (ids.includes('PerMinute')) return 'minute';
  return 'unknown';
};

const retrySeconds = (details: QuotaDetail[]): number | null => {
  const retryInfo = details.find((d) =>
    typeof d['@type'] === 'string' && (d['@type'] as string).endsWith('RetryInfo'),
  );
  if (!retryInfo?.retryDelay) return null;
  const n = parseFloat(retryInfo.retryDelay);
  return Number.isFinite(n) ? Math.ceil(n) : null;
};

// User-facing strings here are deliberately neutral endpoint-style
// — no provider names, no "AI" in the message — so transient
// failure toasts don't telegraph the upstream service. The provider
// names are surfaced once, and only once, in the consent disclosure
// where Apple requires them.
const buildGeminiMessage = (
  scope: 'minute' | 'day' | 'unknown',
  retry: number | null,
): string => {
  if (scope === 'day') {
    return 'Server is busy. Please wait and try again.';
  }
  if (retry) return `Server is busy. Try again in ${retry}s.`;
  return 'Server is busy. Please wait and try again.';
};

/**
 * Parse a Gemini 429 error body. Accepts the JSON the REST API returns
 * (or the SDK surfaces in `.message`). Falls back to a generic quota
 * message when the structure isn't recognised.
 */
export const parseGeminiQuotaError = (errText: string): LLMQuotaError => {
  let details: QuotaDetail[] = [];
  try {
    const parsed = JSON.parse(errText);
    details = Array.isArray(parsed?.error?.details) ? parsed.error.details : [];
  } catch {
    // Fall through — we still surface a quota error with a generic message.
  }
  const scope = quotaScope(details);
  const retry = retrySeconds(details);
  return new LLMQuotaError(buildGeminiMessage(scope, retry), retry, scope);
};

interface OpenAI429Like {
  message?: string;
  status?: number;
  headers?: Record<string, string | undefined>;
}

/**
 * Parse an OpenAI 429 error. Reads the `retry-after` / `retry-after-ms`
 * response headers (the SDK surfaces them on the thrown `APIError`).
 * Scope is always 'unknown' — OpenAI doesn't distinguish minute-vs-day
 * limits in the error shape the way Gemini does.
 */
export const parseOpenAIQuotaError = (err: OpenAI429Like): LLMQuotaError => {
  const headers = err.headers ?? {};
  const seconds = headers['retry-after'];
  const millis = headers['retry-after-ms'];
  let retry: number | null = null;
  if (millis) {
    const n = parseFloat(millis);
    if (Number.isFinite(n)) retry = Math.ceil(n / 1000);
  } else if (seconds) {
    const n = parseFloat(seconds);
    if (Number.isFinite(n)) retry = Math.ceil(n);
  }
  const message = retry
    ? `Server is busy. Try again in ${retry}s.`
    : 'Server is busy. Please wait and try again.';
  return new LLMQuotaError(message, retry, 'unknown');
};
