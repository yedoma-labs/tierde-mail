import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface BrevoConfig {
  apiKey: string;
  baseUrl?: string;
}

function toBrevoAddress(addr: EmailAddress): { email: string; name?: string } {
  return addr.name ? { email: addr.email, name: addr.name } : { email: addr.email };
}

function toBrevoAddresses(
  addrs: EmailAddress | EmailAddress[],
): { email: string; name?: string }[] {
  return (Array.isArray(addrs) ? addrs : [addrs]).map(toBrevoAddress);
}

class BrevoProvider implements EmailProvider {
  readonly name = 'brevo';
  readonly #apiKey: string;
  readonly #baseUrl: string;

  constructor(config: BrevoConfig) {
    this.#apiKey = config.apiKey;
    this.#baseUrl = config.baseUrl ?? 'https://api.brevo.com';
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const body: Record<string, unknown> = {
      sender: toBrevoAddress(message.from),
      to: toBrevoAddresses(message.to),
      subject: message.subject,
      htmlContent: message.html,
    };

    if (message.text) body.textContent = message.text;
    if (message.cc) body.cc = toBrevoAddresses(message.cc);
    if (message.bcc) body.bcc = toBrevoAddresses(message.bcc);
    if (message.replyTo) body.replyTo = toBrevoAddress(message.replyTo);
    if (message.headers && Object.keys(message.headers).length > 0) {
      body.headers = message.headers;
    }

    if (message.attachments && message.attachments.length > 0) {
      const regular: unknown[] = [];
      const inline: unknown[] = [];
      for (const a of message.attachments) {
        const content = typeof a.content === 'string' ? a.content : a.content.toString('base64');
        if (a.cid) {
          inline.push({ name: a.filename, content });
        } else {
          regular.push({ name: a.filename, content });
        }
      }
      if (regular.length > 0) body.attachment = regular;
      if (inline.length > 0) body.inlineAttachment = inline;
    }

    const response = await fetch(`${this.#baseUrl}/v3/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': this.#apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { messageId?: string };
    const id = data.messageId ?? `brevo-${Date.now()}`;
    return { id, provider: this.name };
  }
}

/**
 * Creates a Brevo (formerly Sendinblue) email provider.
 *
 * ```ts
 * import { brevo } from '@yedoma-labs/tierde-mail/providers/brevo';
 *
 * const mailer = createMailer({
 *   provider: brevo({ apiKey: process.env.BREVO_API_KEY! }),
 *   from: 'hello@example.com',
 * });
 * ```
 */
export function brevo(config: BrevoConfig): EmailProvider {
  return new BrevoProvider(config);
}
