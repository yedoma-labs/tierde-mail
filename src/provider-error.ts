/**
 * Error thrown by HTTP-based providers when the API answers with a non-2xx status.
 * `message` keeps the historical `<Provider> API error <status>: <body>` format;
 * `status` and `retryAfterMs` let the mailer's retry logic act on the response
 * without parsing the message.
 */
export class ProviderHttpError extends Error {
  readonly status: number;
  /** Delay requested by the server via `Retry-After`, in milliseconds. Undefined when absent or unparseable. */
  readonly retryAfterMs: number | undefined;

  constructor(
    message: string,
    options: { status: number; retryAfterMs?: number | undefined; cause?: unknown },
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ProviderHttpError';
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
  }
}

/**
 * Parses a `Retry-After` header value: either delay-seconds or an HTTP-date (RFC 9110 §10.2.3).
 * Returns milliseconds (never negative), or `undefined` when the value is missing or invalid.
 */
export function parseRetryAfter(
  value: string | null | undefined,
  now: number = Date.now(),
): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  // An HTTP-date always contains letters (weekday, month, GMT); reject bare numbers like "-5".
  if (!/[A-Za-z]/.test(trimmed)) return undefined;
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - now);
}

/** Builds the error for a non-2xx provider response. `body` is the already-read response text. */
export function providerHttpError(
  response: Response,
  prefix: string,
  body: string,
): ProviderHttpError {
  return new ProviderHttpError(`${prefix} ${response.status}: ${body}`, {
    status: response.status,
    // Optional chaining: test doubles and some runtimes may not provide headers.
    retryAfterMs: parseRetryAfter(response.headers?.get('retry-after')),
  });
}
