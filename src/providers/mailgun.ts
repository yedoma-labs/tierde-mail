import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface MailgunConfig {
  apiKey: string;
  domain: string;
  /** 'us' (default) → api.mailgun.net · 'eu' → api.eu.mailgun.net */
  region?: 'us' | 'eu';
  /** Override the base URL — useful for testing against a local mock */
  baseUrl?: string;
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string {
  const arr = Array.isArray(addrs) ? addrs : [addrs];
  return arr.map(formatAddress).join(', ');
}

class MailgunProvider implements EmailProvider {
  readonly name = 'mailgun';
  readonly #apiKey: string;
  readonly #domain: string;
  readonly #baseUrl: string;

  constructor(config: MailgunConfig) {
    this.#apiKey = config.apiKey;
    this.#domain = config.domain;
    const defaultBase =
      config.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
    this.#baseUrl = config.baseUrl ?? defaultBase;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const form = new FormData();
    form.set('from', formatAddress(message.from));
    form.set('to', formatAddresses(message.to));
    form.set('subject', message.subject);
    form.set('html', message.html);
    if (message.text) form.set('text', message.text);
    if (message.cc) form.set('cc', formatAddresses(message.cc));
    if (message.bcc) form.set('bcc', formatAddresses(message.bcc));
    if (message.replyTo) form.set('h:Reply-To', formatAddress(message.replyTo));

    for (const [key, value] of Object.entries(message.headers ?? {})) {
      form.set(`h:${key}`, value);
    }

    if (message.attachments && message.attachments.length > 0) {
      for (const a of message.attachments) {
        const buf =
          typeof a.content === 'string' ? Buffer.from(a.content, 'base64') : a.content;
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
        const blob = new Blob([ab], { type: a.contentType });
        form.append(a.cid ? 'inline' : 'attachment', blob, a.filename);
      }
    }

    const credentials = Buffer.from(`api:${this.#apiKey}`).toString('base64');
    const response = await fetch(`${this.#baseUrl}/v3/${this.#domain}/messages`, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mailgun API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { id?: string };
    const id = (data.id ?? `mg-${Date.now()}`).replace(/[<>]/g, '');
    return { id, provider: this.name };
  }
}

export function mailgun(config: MailgunConfig): EmailProvider {
  return new MailgunProvider(config);
}
