import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookHandler, WebhookEvent } from './types.js';
import { WebhookVerificationError } from './types.js';

interface ResendWebhookConfig {
  /** Signing secret from the Resend dashboard (format: `whsec_...`) */
  secret: string;
  /** Max age of a webhook event in seconds before it's rejected. Default: 300 (5 min) */
  toleranceSeconds?: number;
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const val = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(val) ? val[0] ?? '' : val ?? '';
}

class ResendWebhookHandler implements WebhookHandler {
  readonly #key: Buffer;
  readonly #tolerance: number;

  constructor(config: ResendWebhookConfig) {
    const raw = config.secret.startsWith('whsec_')
      ? config.secret.slice('whsec_'.length)
      : config.secret;
    this.#key = Buffer.from(raw, 'base64');
    this.#tolerance = config.toleranceSeconds ?? 300;
  }

  verify(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent {
    const msgId = getHeader(headers, 'svix-id');
    const timestamp = getHeader(headers, 'svix-timestamp');
    const sigHeader = getHeader(headers, 'svix-signature');

    if (!msgId || !timestamp || !sigHeader) {
      throw new WebhookVerificationError('Missing Svix webhook headers');
    }

    // Reject expired timestamps
    const ts = Number(timestamp);
    if (Number.isNaN(ts)) {
      throw new WebhookVerificationError('Invalid svix-timestamp');
    }
    const ageSeconds = Math.abs(Date.now() / 1000 - ts);
    if (ageSeconds > this.#tolerance) {
      throw new WebhookVerificationError(
        `Webhook timestamp too old (${Math.round(ageSeconds)}s > ${this.#tolerance}s)`,
      );
    }

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const toSign = `${msgId}.${timestamp}.${body}`;
    const expected = createHmac('sha256', this.#key).update(toSign).digest('base64');
    const expectedBuf = Buffer.from(expected);

    // svix-signature may contain multiple space-separated "v1,BASE64" values
    const valid = sigHeader.split(' ').some((part) => {
      const [, sig] = part.split(',');
      if (!sig) return false;
      const sigBuf = Buffer.from(sig);
      if (sigBuf.length !== expectedBuf.length) return false;
      return timingSafeEqual(sigBuf, expectedBuf);
    });

    if (!valid) {
      throw new WebhookVerificationError('Webhook signature verification failed');
    }

    const payload = JSON.parse(body) as Record<string, unknown>;
    return normalizeResendEvent(payload);
  }
}

function normalizeResendEvent(payload: Record<string, unknown>): WebhookEvent {
  const type = String(payload['type'] ?? '');
  const data = (payload['data'] ?? {}) as Record<string, unknown>;

  const to = Array.isArray(data['to'])
    ? (data['to'] as unknown[]).map(String)
    : [String(data['to'] ?? '')];

  return {
    type,
    provider: 'resend',
    email: {
      id: String(data['email_id'] ?? ''),
      to,
      from: String(data['from'] ?? ''),
      subject: data['subject'] ? String(data['subject']) : undefined,
      timestamp: String(data['created_at'] ?? new Date().toISOString()),
    },
    raw: payload,
  };
}

/**
 * Creates a Resend webhook handler that verifies Svix signatures.
 *
 * ```ts
 * const handler = createResendWebhookHandler({ secret: process.env.RESEND_WEBHOOK_SECRET });
 *
 * // Express (use express.raw() middleware for this route)
 * app.post('/webhooks/resend', (req, res) => {
 *   const event = handler.verify(req.body, req.headers);
 *   if (event.type === 'email.bounced') { ... }
 *   res.sendStatus(200);
 * });
 *
 * // Next.js App Router
 * export async function POST(request: Request) {
 *   const body = await request.text();
 *   const event = handler.verify(body, Object.fromEntries(request.headers));
 * }
 * ```
 */
export function createResendWebhookHandler(config: ResendWebhookConfig): WebhookHandler {
  return new ResendWebhookHandler(config);
}
