import { createHmac, timingSafeEqual } from 'node:crypto';
import type { WebhookEvent, WebhookEventType, WebhookHandler } from './types.js';
import { WebhookVerificationError } from './types.js';

interface PostmarkWebhookConfig {
  /** Webhook token from the Postmark server settings */
  token: string;
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
  const val = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(val) ? (val[0] ?? '') : (val ?? '');
}

const RECORD_TYPE_MAP: Record<string, WebhookEventType> = {
  Delivery: 'email.delivered',
  Bounce: 'email.bounced',
  SpamComplaint: 'email.complained',
  Open: 'email.opened',
  Click: 'email.clicked',
  SubscriptionChange: 'email.subscription_changed',
};

class PostmarkWebhookHandler implements WebhookHandler {
  readonly #token: string;

  constructor(config: PostmarkWebhookConfig) {
    this.#token = config.token;
  }

  verify(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent {
    const sig = getHeader(headers, 'X-Postmark-Signature-256');
    if (!sig) {
      throw new WebhookVerificationError('Missing X-Postmark-Signature-256 header');
    }

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const expected = createHmac('sha256', this.#token).update(body).digest('base64');
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(sig);

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      throw new WebhookVerificationError('Webhook signature verification failed');
    }

    const payload = JSON.parse(body) as Record<string, unknown>;
    return normalizePostmarkEvent(payload);
  }
}

function normalizePostmarkEvent(payload: Record<string, unknown>): WebhookEvent {
  const recordType = String(payload.RecordType ?? '');
  const type: WebhookEventType = RECORD_TYPE_MAP[recordType] ?? recordType.toLowerCase();

  const recipient = String(payload.Recipient ?? payload.Email ?? '');
  const messageId = String(payload.MessageID ?? '');

  // Postmark Bounce/Delivery include metadata about the original message
  const metadata = (payload.Metadata ?? {}) as Record<string, unknown>;
  const from = String(metadata.From ?? payload.From ?? '');
  const subject = metadata.Subject ? String(metadata.Subject) : undefined;

  const timestamp = String(
    payload.DeliveredAt ??
      payload.BouncedAt ??
      payload.ReceivedAt ??
      payload.Date ??
      new Date().toISOString(),
  );

  return {
    type,
    provider: 'postmark',
    email: {
      id: messageId,
      to: recipient ? [recipient] : [],
      from,
      subject,
      timestamp,
    },
    raw: payload,
  };
}

/**
 * Creates a Postmark webhook handler that verifies HMAC-SHA256 signatures.
 *
 * ```ts
 * const handler = createPostmarkWebhookHandler({ token: process.env.POSTMARK_WEBHOOK_TOKEN });
 *
 * // Express
 * app.post('/webhooks/postmark', express.raw({ type: 'application/json' }), (req, res) => {
 *   const event = handler.verify(req.body, req.headers);
 *   if (event.type === 'email.bounced') { ... }
 *   res.sendStatus(200);
 * });
 * ```
 */
export function createPostmarkWebhookHandler(config: PostmarkWebhookConfig): WebhookHandler {
  return new PostmarkWebhookHandler(config);
}
