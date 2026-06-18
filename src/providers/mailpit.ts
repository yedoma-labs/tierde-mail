import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface MailpitConfig {
  /** SMTP host. Default: `'localhost'` */
  host?: string;
  /** SMTP port. Default: `1025` */
  port?: number;
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email;
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string {
  if (Array.isArray(addrs)) return addrs.map(formatAddress).join(', ');
  return formatAddress(addrs);
}

class MailpitProvider implements EmailProvider {
  readonly name = 'mailpit';
  readonly #host: string;
  readonly #port: number;

  constructor(config: MailpitConfig = {}) {
    this.#host = config.host ?? 'localhost';
    this.#port = config.port ?? 1025;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const nodemailer = await import('nodemailer').catch(() => {
      throw new Error(
        'nodemailer is required for the Mailpit provider. Install it: pnpm add nodemailer',
      );
    });

    const transporter = nodemailer.createTransport({
      host: this.#host,
      port: this.#port,
      secure: false,
      auth: undefined,
      tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
      from: formatAddress(message.from),
      to: formatAddresses(message.to),
      cc: message.cc ? formatAddresses(message.cc) : undefined,
      bcc: message.bcc ? formatAddresses(message.bcc) : undefined,
      replyTo: message.replyTo ? formatAddress(message.replyTo) : undefined,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.headers,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        encoding: a.encoding,
      })),
    });

    const id = info.messageId ?? `mailpit-${crypto.randomUUID()}`;
    return { id, provider: this.name };
  }
}

/**
 * Local email capture provider for Mailpit and MailHog.
 *
 * Zero-config for the default Mailpit/MailHog SMTP port:
 * ```ts
 * const mailer = createMailer({ provider: mailpit(), from: 'dev@localhost' });
 * ```
 *
 * Custom host/port (e.g. Docker):
 * ```ts
 * mailpit({ host: 'mailpit', port: 1025 })
 * ```
 *
 * Requires `nodemailer` (optional peer dependency):
 * ```
 * pnpm add nodemailer
 * ```
 */
export function mailpit(config?: MailpitConfig): EmailProvider {
  return new MailpitProvider(config);
}
