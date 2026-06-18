import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface SesConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

function toArray(addrs: EmailAddress | EmailAddress[]): EmailAddress[] {
  return Array.isArray(addrs) ? addrs : [addrs];
}

class SesProvider implements EmailProvider {
  readonly name = 'ses';
  readonly #config: SesConfig;

  constructor(config: SesConfig) {
    this.#config = config;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses').catch(() => {
      throw new Error(
        '@aws-sdk/client-ses is required for SES provider. Install it: pnpm add @aws-sdk/client-ses',
      );
    });

    const client = new SESClient({
      region: this.#config.region,
      ...(this.#config.credentials ? { credentials: this.#config.credentials } : {}),
    });

    try {
      const toAddresses = toArray(message.to).map((a) => a.email);
      const ccAddresses = message.cc ? toArray(message.cc).map((a) => a.email) : undefined;
      const bccAddresses = message.bcc ? toArray(message.bcc).map((a) => a.email) : undefined;

      const command = new SendEmailCommand({
        Source: formatAddress(message.from),
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        ReplyToAddresses: message.replyTo ? [formatAddress(message.replyTo)] : undefined,
        Message: {
          Subject: { Data: message.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: message.html, Charset: 'UTF-8' },
            ...(message.text ? { Text: { Data: message.text, Charset: 'UTF-8' } } : {}),
          },
        },
      });

      const result = await client.send(command);
      const id = result.MessageId ?? `ses-${crypto.randomUUID()}`;
      return { id, provider: this.name };
    } finally {
      client.destroy();
    }
  }
}

export function ses(config: SesConfig): EmailProvider {
  return new SesProvider(config);
}
