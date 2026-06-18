import type { EmailAddress, EmailMessage, EmailProvider, SendResult } from '../types.js';

interface SmtpAuth {
  user: string;
  pass: string;
}

interface SmtpConfig {
  host: string;
  port?: number;
  secure?: boolean;
  auth?: SmtpAuth;
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email;
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string {
  if (Array.isArray(addrs)) return addrs.map(formatAddress).join(', ');
  return formatAddress(addrs);
}

class SmtpProvider implements EmailProvider {
  readonly name = 'smtp';
  readonly #config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.#config = config;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    // Dynamic import so nodemailer is truly optional
    const nodemailer = await import('nodemailer').catch(() => {
      throw new Error('nodemailer is required for SMTP provider. Install it: pnpm add nodemailer');
    });

    const port = this.#config.port ?? 587;
    // Default secure based on port: 465=SMTPS (secure), 587=STARTTLS (plaintext upgrade)
    const secure = this.#config.secure ?? port === 465;

    const transporter = nodemailer.createTransport({
      host: this.#config.host,
      port,
      secure,
      auth: this.#config.auth,
      tls: this.#config.tls,
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

    const id = info.messageId ?? `smtp-${crypto.randomUUID()}`;
    return { id, provider: this.name };
  }
}

export function smtp(config: SmtpConfig): EmailProvider {
  return new SmtpProvider(config);
}
