import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface SparkPostConfig {
  apiKey: string;
  /** Override base URL — e.g. https://api.eu.sparkpost.com for EU tenants */
  baseUrl?: string;
  /** Sandbox mode — sends are accepted but not delivered. Default: false */
  sandbox?: boolean;
}

function toAddr(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

type SparkRecipientAddress = { email: string; name?: string; header_to?: string };

function toRecipients(addrs: EmailAddress | EmailAddress[]): { address: SparkRecipientAddress }[] {
  const arr = Array.isArray(addrs) ? addrs : [addrs];
  return arr.map((a) => ({
    address: a.name ? { email: a.email, name: a.name } : { email: a.email },
  }));
}

class SparkPostProvider implements EmailProvider {
  readonly name = 'sparkpost';
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #sandbox: boolean;

  constructor(config: SparkPostConfig) {
    this.#apiKey = config.apiKey;
    this.#baseUrl = config.baseUrl ?? 'https://api.sparkpost.com';
    this.#sandbox = config.sandbox ?? false;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const recipients = toRecipients(message.to);

    if (message.cc) {
      for (const r of toRecipients(message.cc)) {
        recipients.push({
          ...r,
          address: {
            ...r.address,
            header_to: toAddr(
              Array.isArray(message.to) ? (message.to[0] as EmailAddress) : message.to,
            ),
          },
        });
      }
    }
    if (message.bcc) {
      for (const r of toRecipients(message.bcc)) {
        recipients.push({
          ...r,
          address: {
            ...r.address,
            header_to: toAddr(
              Array.isArray(message.to) ? (message.to[0] as EmailAddress) : message.to,
            ),
          },
        });
      }
    }

    const content: Record<string, unknown> = {
      from: toAddr(message.from),
      subject: message.subject,
      html: message.html,
    };

    if (message.text) content.text = message.text;
    if (message.replyTo) content.reply_to = toAddr(message.replyTo);
    if (message.headers && Object.keys(message.headers).length > 0) {
      content.headers = message.headers;
    }

    if (message.attachments && message.attachments.length > 0) {
      const attachments: unknown[] = [];
      const inlineImages: unknown[] = [];
      for (const a of message.attachments) {
        const data = typeof a.content === 'string' ? a.content : a.content.toString('base64');
        const item = { name: a.filename, type: a.contentType, data };
        if (a.cid) {
          inlineImages.push({ ...item, name: a.cid });
        } else {
          attachments.push(item);
        }
      }
      if (attachments.length > 0) content.attachments = attachments;
      if (inlineImages.length > 0) content.inline_images = inlineImages;
    }

    const payload: Record<string, unknown> = {
      recipients,
      content,
    };
    if (this.#sandbox) payload.options = { sandbox: true };

    const response = await fetch(`${this.#baseUrl}/api/v1/transmissions`, {
      method: 'POST',
      headers: {
        Authorization: this.#apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SparkPost API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { results?: { id?: string } };
    const id = data.results?.id ?? `sp-${Date.now()}`;
    return { id, provider: this.name };
  }
}

/**
 * Creates a SparkPost email provider.
 *
 * ```ts
 * import { sparkpost } from '@yedoma-labs/tierde-mail/providers/sparkpost';
 *
 * const mailer = createMailer({
 *   provider: sparkpost({ apiKey: process.env.SPARKPOST_API_KEY! }),
 *   from: 'hello@example.com',
 * });
 *
 * // EU tenant
 * sparkpost({ apiKey: '...', baseUrl: 'https://api.eu.sparkpost.com' })
 * ```
 */
export function sparkpost(config: SparkPostConfig): EmailProvider {
  return new SparkPostProvider(config);
}
