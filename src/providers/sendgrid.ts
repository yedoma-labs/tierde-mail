import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface SendGridConfig {
  apiKey: string;
}

function toPersonalization(addr: EmailAddress | EmailAddress[]) {
  const arr = Array.isArray(addr) ? addr : [addr];
  return arr.map((a) => (a.name ? { email: a.email, name: a.name } : { email: a.email }));
}

class SendGridProvider implements EmailProvider {
  readonly name = 'sendgrid';
  readonly #apiKey: string;

  constructor(config: SendGridConfig) {
    this.#apiKey = config.apiKey;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const body: Record<string, unknown> = {
      personalizations: [
        {
          to: toPersonalization(message.to),
          ...(message.cc ? { cc: toPersonalization(message.cc) } : {}),
          ...(message.bcc ? { bcc: toPersonalization(message.bcc) } : {}),
        },
      ],
      from: message.from.name
        ? { email: message.from.email, name: message.from.name }
        : { email: message.from.email },
      subject: message.subject,
      content: [
        { type: 'text/html', value: message.html },
        ...(message.text ? [{ type: 'text/plain', value: message.text }] : []),
      ],
    };

    if (message.replyTo) {
      body.reply_to = message.replyTo.name
        ? { email: message.replyTo.email, name: message.replyTo.name }
        : { email: message.replyTo.email };
    }

    if (message.attachments && message.attachments.length > 0) {
      body.attachments = message.attachments.map((a) => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
        type: a.contentType,
        disposition: 'attachment',
      }));
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SendGrid API error ${response.status}: ${text}`);
    }

    const messageId = response.headers.get('X-Message-Id') ?? `sg-${Date.now()}`;
    return { id: messageId, provider: this.name };
  }
}

export function sendgrid(config: SendGridConfig): EmailProvider {
  return new SendGridProvider(config);
}
