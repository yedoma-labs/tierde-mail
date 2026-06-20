import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface MailerSendConfig {
  apiToken: string;
  baseUrl?: string;
}

function toAddr(addr: EmailAddress): { email: string; name?: string } {
  return addr.name ? { email: addr.email, name: addr.name } : { email: addr.email };
}

function toAddrs(addrs: EmailAddress | EmailAddress[]): { email: string; name?: string }[] {
  return (Array.isArray(addrs) ? addrs : [addrs]).map(toAddr);
}

class MailerSendProvider implements EmailProvider {
  readonly name = 'mailersend';
  readonly #apiToken: string;
  readonly #baseUrl: string;

  constructor(config: MailerSendConfig) {
    this.#apiToken = config.apiToken;
    this.#baseUrl = config.baseUrl ?? 'https://api.mailersend.com';
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const body: Record<string, unknown> = {
      from: toAddr(message.from),
      to: toAddrs(message.to),
      subject: message.subject,
      html: message.html,
    };

    if (message.text) body.text = message.text;
    if (message.cc) body.cc = toAddrs(message.cc);
    if (message.bcc) body.bcc = toAddrs(message.bcc);
    if (message.replyTo) body.reply_to = toAddr(message.replyTo);

    if (message.headers && Object.keys(message.headers).length > 0) {
      body.headers = Object.entries(message.headers).map(([name, value]) => ({ name, value }));
    }

    if (message.attachments && message.attachments.length > 0) {
      body.attachments = message.attachments.map((a) => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
        disposition: a.cid ? 'inline' : 'attachment',
        ...(a.cid ? { id: a.cid } : {}),
      }));
    }

    const response = await fetch(`${this.#baseUrl}/v1/email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.#apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MailerSend API error ${response.status}: ${text}`);
    }

    // 202 Accepted — message ID is in the X-Message-Id response header
    const id = response.headers.get('X-Message-Id') ?? `ms-${Date.now()}`;
    return { id, provider: this.name };
  }
}

/**
 * Creates a MailerSend email provider.
 *
 * ```ts
 * import { mailersend } from '@yedoma-labs/tierde-mail/providers/mailersend';
 *
 * const mailer = createMailer({
 *   provider: mailersend({ apiToken: process.env.MAILERSEND_API_TOKEN! }),
 *   from: 'hello@example.com',
 * });
 * ```
 */
export function mailersend(config: MailerSendConfig): EmailProvider {
  return new MailerSendProvider(config);
}
