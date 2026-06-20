import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface MandrillConfig {
  apiKey: string;
  baseUrl?: string;
}

function toAddr(addr: EmailAddress): { email: string; name?: string } {
  return addr.name ? { email: addr.email, name: addr.name } : { email: addr.email };
}

type MandrillRecipient = { email: string; name?: string; type: 'to' | 'cc' | 'bcc' };

function toRecipients(
  addrs: EmailAddress | EmailAddress[],
  type: 'to' | 'cc' | 'bcc',
): MandrillRecipient[] {
  return (Array.isArray(addrs) ? addrs : [addrs]).map((a) => ({
    ...toAddr(a),
    type,
  }));
}

class MandrillProvider implements EmailProvider {
  readonly name = 'mandrill';
  readonly #apiKey: string;
  readonly #baseUrl: string;

  constructor(config: MandrillConfig) {
    this.#apiKey = config.apiKey;
    this.#baseUrl = config.baseUrl ?? 'https://mandrillapp.com';
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const to: MandrillRecipient[] = [
      ...toRecipients(message.to, 'to'),
      ...(message.cc ? toRecipients(message.cc, 'cc') : []),
      ...(message.bcc ? toRecipients(message.bcc, 'bcc') : []),
    ];

    const msg: Record<string, unknown> = {
      html: message.html,
      subject: message.subject,
      from_email: message.from.email,
      to,
    };

    if (message.from.name) msg.from_name = message.from.name;
    if (message.text) msg.text = message.text;
    if (message.replyTo) {
      msg.headers = {
        ...((message.headers as Record<string, string>) ?? {}),
        'Reply-To': message.replyTo.name
          ? `${message.replyTo.name} <${message.replyTo.email}>`
          : message.replyTo.email,
      };
    } else if (message.headers && Object.keys(message.headers).length > 0) {
      msg.headers = message.headers;
    }

    if (message.attachments && message.attachments.length > 0) {
      const attachments: unknown[] = [];
      const images: unknown[] = [];
      for (const a of message.attachments) {
        const content = typeof a.content === 'string' ? a.content : a.content.toString('base64');
        if (a.cid) {
          images.push({ type: a.contentType, name: a.cid, content });
        } else {
          attachments.push({ type: a.contentType, name: a.filename, content });
        }
      }
      if (attachments.length > 0) msg.attachments = attachments;
      if (images.length > 0) msg.images = images;
    }

    const response = await fetch(`${this.#baseUrl}/api/1.0/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: this.#apiKey, message: msg }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mandrill API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as Array<{
      _id?: string;
      status?: string;
      reject_reason?: string;
    }>;
    const first = data[0];
    if (first?.status === 'rejected' || first?.status === 'invalid') {
      throw new Error(`Mandrill rejected message: ${first.reject_reason ?? first.status}`);
    }
    const id = first?._id ?? `mandrill-${Date.now()}`;
    return { id, provider: this.name };
  }
}

/**
 * Creates a Mandrill (Mailchimp Transactional) email provider.
 *
 * ```ts
 * import { mandrill } from '@yedoma-labs/tierde-mail/providers/mandrill';
 *
 * const mailer = createMailer({
 *   provider: mandrill({ apiKey: process.env.MANDRILL_API_KEY! }),
 *   from: 'hello@example.com',
 * });
 * ```
 */
export function mandrill(config: MandrillConfig): EmailProvider {
  return new MandrillProvider(config);
}
