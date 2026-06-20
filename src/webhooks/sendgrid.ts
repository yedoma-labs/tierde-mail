import { createVerify } from 'node:crypto';
import type { WebhookEvent, WebhookEventType, WebhookHandler } from './types.js';
import { WebhookVerificationError } from './types.js';

interface SendGridWebhookConfig {
  /**
   * Base64-encoded ECDSA P-256 public key from the SendGrid Event Webhook settings.
   * May be raw base64 (DER SPKI) or a full PEM string.
   */
  publicKey: string;
  /** Max age of a webhook event in seconds. Default: 300 (5 min) */
  toleranceSeconds?: number;
}

export interface SendGridWebhookHandler extends WebhookHandler {
  /**
   * Verify signature and parse all events in the batch.
   * SendGrid delivers events as a JSON array; use this when you need every event.
   */
  verifyBatch(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent[];
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
  const val = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(val) ? (val[0] ?? '') : (val ?? '');
}

const EVENT_MAP: Record<string, WebhookEventType> = {
  delivered: 'email.delivered',
  bounce: 'email.bounced',
  dropped: 'email.bounced',
  deferred: 'email.delivery_delayed',
  spamreport: 'email.complained',
  unsubscribe: 'email.subscription_changed',
  group_unsubscribe: 'email.subscription_changed',
  group_resubscribe: 'email.subscription_changed',
  open: 'email.opened',
  click: 'email.clicked',
};

function toPem(key: string): string {
  if (key.includes('-----')) return key;
  const wrapped = key.match(/.{1,64}/g)?.join('\n') ?? key;
  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

function normalizeEvent(ev: Record<string, unknown>): WebhookEvent {
  const sgEvent = String(ev.event ?? '');
  const type: WebhookEventType = EVENT_MAP[sgEvent] ?? sgEvent;
  const to = String(ev.email ?? '');
  const msgId = String(ev.sg_message_id ?? ev.smtp_id ?? '');
  const timestamp = ev.timestamp
    ? new Date(Number(ev.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  return {
    type,
    provider: 'sendgrid',
    email: {
      id: msgId,
      to: to ? [to] : [],
      from: String(ev.from_email ?? ''),
      subject: ev.subject ? String(ev.subject) : undefined,
      timestamp,
    },
    raw: ev,
  };
}

class SendGridWebhookHandlerImpl implements SendGridWebhookHandler {
  readonly #pem: string;
  readonly #tolerance: number;

  constructor(config: SendGridWebhookConfig) {
    this.#pem = toPem(config.publicKey);
    this.#tolerance = config.toleranceSeconds ?? 300;
  }

  verify(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent {
    const events = this.verifyBatch(rawBody, headers);
    const first = events[0];
    if (!first) throw new WebhookVerificationError('SendGrid payload contained no events');
    return first;
  }

  verifyBatch(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent[] {
    const timestamp = getHeader(headers, 'X-Twilio-Email-Event-Webhook-Timestamp');
    const signature = getHeader(headers, 'X-Twilio-Email-Event-Webhook-Signature');

    if (!timestamp || !signature) {
      throw new WebhookVerificationError('Missing SendGrid webhook signature headers');
    }

    const ts = Number(timestamp);
    if (Number.isNaN(ts)) throw new WebhookVerificationError('Invalid webhook timestamp');
    const ageSeconds = Math.abs(Date.now() / 1000 - ts);
    if (ageSeconds > this.#tolerance) {
      throw new WebhookVerificationError(
        `Webhook timestamp too old (${Math.round(ageSeconds)}s > ${this.#tolerance}s)`,
      );
    }

    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const verifier = createVerify('SHA256');
    verifier.update(timestamp);
    verifier.update(body);

    let valid: boolean;
    try {
      valid = verifier.verify(this.#pem, signature, 'base64');
    } catch {
      throw new WebhookVerificationError('Webhook signature verification failed');
    }
    if (!valid) throw new WebhookVerificationError('Webhook signature verification failed');

    const payload = JSON.parse(body) as unknown[];
    return payload.map((item) => normalizeEvent(item as Record<string, unknown>));
  }
}

/**
 * Creates a SendGrid Event Webhook handler that verifies ECDSA P-256 signatures.
 *
 * ```ts
 * const handler = createSendGridWebhookHandler({
 *   publicKey: process.env.SENDGRID_WEBHOOK_PUBLIC_KEY!,
 * });
 *
 * // Express (use express.raw() for this route)
 * app.post('/webhooks/sendgrid', (req, res) => {
 *   const events = handler.verifyBatch(req.body, req.headers);
 *   for (const event of events) {
 *     if (event.type === 'email.bounced') { ... }
 *   }
 *   res.sendStatus(200);
 * });
 *
 * // Next.js App Router
 * export async function POST(request: Request) {
 *   const body = await request.text();
 *   const events = handler.verifyBatch(body, Object.fromEntries(request.headers));
 * }
 * ```
 */
export function createSendGridWebhookHandler(
  config: SendGridWebhookConfig,
): SendGridWebhookHandler {
  return new SendGridWebhookHandlerImpl(config);
}
