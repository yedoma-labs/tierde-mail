import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface PostmarkConfig {
  serverToken: string;
  baseUrl?: string;
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string {
  if (Array.isArray(addrs)) return addrs.map(formatAddress).join(', ');
  return formatAddress(addrs);
}

class PostmarkProvider implements EmailProvider {
  readonly name = 'postmark';
  readonly #serverToken: string;
  readonly #baseUrl: string;

  constructor(config: PostmarkConfig) {
    this.#serverToken = config.serverToken;
    this.#baseUrl = config.baseUrl ?? 'https://api.postmarkapp.com';
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const body: Record<string, unknown> = {
      From: formatAddress(message.from),
      To: formatAddresses(message.to),
      Subject: message.subject,
      HtmlBody: message.html,
      TextBody: message.text,
      MessageStream: 'outbound',
    };

    if (message.cc) body.Cc = formatAddresses(message.cc);
    if (message.bcc) body.Bcc = formatAddresses(message.bcc);
    if (message.replyTo) body.ReplyTo = formatAddress(message.replyTo);

    if (message.headers && Object.keys(message.headers).length > 0) {
      body.Headers = Object.entries(message.headers).map(([Name, Value]) => ({
        Name,
        Value,
      }));
    }

    if (message.attachments && message.attachments.length > 0) {
      body.Attachments = message.attachments.map((a) => ({
        Name: a.filename,
        Content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
        ContentType: a.contentType,
        ...(a.cid ? { ContentID: `cid:${a.cid}` } : {}),
      }));
    }

    const response = await fetch(`${this.#baseUrl}/email`, {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.#serverToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Postmark API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { MessageID: string };
    return { id: data.MessageID, provider: this.name };
  }
}

export function postmark(config: PostmarkConfig): EmailProvider {
  return new PostmarkProvider(config);
}
