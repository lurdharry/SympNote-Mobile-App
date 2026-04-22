/** Typed error so the UI can distinguish rate limits from real failures. */
export class GeminiQuotaError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSec: number | null,
    public readonly scope: 'minute' | 'day' | 'unknown',
  ) {
    super(message);
    this.name = 'GeminiQuotaError';
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

const buildMessage = (
  scope: 'minute' | 'day' | 'unknown',
  retry: number | null,
): string => {
  if (scope === 'day') {
    return 'Daily Gemini free-tier limit reached. Try again tomorrow or upgrade your API plan.';
  }
  if (retry) return `Gemini rate limit — try again in ${retry}s.`;
  return 'Gemini rate limit reached. Please wait and try again.';
};

export const parseQuotaError = (errText: string): GeminiQuotaError => {
  let details: QuotaDetail[] = [];
  try {
    const parsed = JSON.parse(errText);
    details = Array.isArray(parsed?.error?.details) ? parsed.error.details : [];
  } catch {
    // Fall through — we still surface a quota error with a generic message.
  }
  const scope = quotaScope(details);
  const retry = retrySeconds(details);
  return new GeminiQuotaError(buildMessage(scope, retry), retry, scope);
};
