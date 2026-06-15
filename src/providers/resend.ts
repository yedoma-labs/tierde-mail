import type { EmailProvider, EmailMessage, SendResult, EmailAddress } from '../types.js';

interface ResendConfig {
  apiKey: string;
  baseUrl?: string;
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string | string[] {
  if (Array.isArray(addrs)) return addrs.map(formatAddress);
  return formatAddress(addrs);
}

class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  readonly #apiKey: string;
  readonly #baseUrl: string;

  constructor(config: ResendConfig) {
    this.#apiKey = config.apiKey;
    this.#baseUrl = config.baseUrl ?? 'https://api.resend.com';
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const body: Record<string, unknown> = {
      from: formatAddress(message.from),
      to: formatAddresses(message.to),
      subject: message.subject,
      html: message.html,
      text: message.text,
    };

    if (message.cc) body['cc'] = formatAddresses(message.cc);
    if (message.bcc) body['bcc'] = formatAddresses(message.bcc);
    if (message.replyTo) body['reply_to'] = formatAddress(message.replyTo);
    if (message.headers && Object.keys(message.headers).length > 0) {
      body['headers'] = message.headers;
    }

    if (message.attachments && message.attachments.length > 0) {
      body['attachments'] = message.attachments.map((a) => ({
        filename: a.filename,
        content:
          typeof a.content === 'string'
            ? a.content
            : a.content.toString('base64'),
        content_type: a.contentType,
      }));
    }

    const response = await fetch(`${this.#baseUrl}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Resend API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { id: string };
    return { id: data.id, provider: this.name };
  }
}

export function resend(config: ResendConfig): EmailProvider {
  return new ResendProvider(config);
}
