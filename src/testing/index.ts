import { executeBatch } from '../mailer.js';
import { htmlToPlainText } from '../plain-text.js';
import { renderEmail } from '../render.js';
import type {
  BatchSendOptions,
  BatchSendResult,
  CreateMailerConfig,
  EmailAddress,
  EmailMessage,
  EmailProvider,
  EmailTemplate,
  Mailer,
  SendOptions,
  SendResult,
} from '../types.js';
import { normalizeAddress, normalizeAddresses } from '../validate.js';

export interface CapturedEmail {
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  html: string;
  text: string;
  attachments: NonNullable<EmailMessage['attachments']>;
  headers: Record<string, string>;
}

class CaptureProvider implements EmailProvider {
  readonly name = 'capture';
  readonly #inbox: CapturedEmail[];

  constructor(inbox: CapturedEmail[]) {
    this.#inbox = inbox;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const captured: CapturedEmail = {
      from: message.from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text ?? '',
      attachments: message.attachments ?? [],
      headers: message.headers ?? {},
    };
    if (message.cc) {
      captured.cc = Array.isArray(message.cc) ? message.cc : [message.cc];
    }
    if (message.bcc) {
      captured.bcc = Array.isArray(message.bcc) ? message.bcc : [message.bcc];
    }
    if (message.replyTo) {
      captured.replyTo = message.replyTo;
    }
    this.#inbox.push(captured);

    const id = `capture-${this.#inbox.length}`;
    return { id, provider: this.name };
  }
}

class CaptureMailer implements Mailer {
  readonly #from: EmailAddress;
  readonly #provider: CaptureProvider;

  constructor(from: EmailAddress, provider: CaptureProvider) {
    this.#from = from;
    this.#provider = provider;
  }

  async send<Props>(
    template: EmailTemplate<Props>,
    options: SendOptions<Props>,
  ): Promise<SendResult> {
    const props = options.props;
    const subject = template.subject(props);
    const element = template.component(props);
    const html = renderEmail(element);
    const text = htmlToPlainText(html);

    const message: EmailMessage = {
      from: this.#from,
      to: normalizeAddresses(options.to),
      ...(options.cc ? { cc: normalizeAddresses(options.cc) } : {}),
      ...(options.bcc ? { bcc: normalizeAddresses(options.bcc) } : {}),
      ...(options.replyTo ? { replyTo: normalizeAddress(options.replyTo) } : {}),
      subject,
      html,
      text,
      attachments: options.attachments ?? [],
      headers: options.headers ?? {},
    };

    return this.#provider.send(message);
  }

  sendBatch<Props>(
    template: EmailTemplate<Props>,
    options: BatchSendOptions<Props>,
  ): Promise<BatchSendResult<Props>> {
    return executeBatch(this, template, options);
  }
}

export interface CaptureResult {
  mailer: Mailer;
  inbox: CapturedEmail[];
  clear(): void;
}

export function captureEmails(from: string = 'test@example.com'): CaptureResult {
  const inbox: CapturedEmail[] = [];
  const provider = new CaptureProvider(inbox);
  const fromAddr = normalizeAddress(from);
  const mailer = new CaptureMailer(fromAddr, provider);

  return {
    mailer,
    inbox,
    clear() {
      inbox.length = 0;
    },
  };
}

// ─── Assertion helpers ──────────────────────────────────────────────────────

/**
 * Asserts that a captured email has at least one attachment matching the given
 * criteria. Throws a descriptive error if no match is found.
 *
 * ```ts
 * const { mailer, inbox } = captureEmails();
 * await mailer.send(InvoiceEmail, { to: '...', props: { ... }, attachments: [pdf] });
 * expectAttachment(inbox[0], { filename: 'invoice.pdf', contentType: 'application/pdf' });
 * ```
 */
export function expectAttachment(
  email: CapturedEmail,
  criteria: { filename?: string; contentType?: string; minBytes?: number },
): void {
  const { filename, contentType, minBytes } = criteria;
  const match = email.attachments.find((a) => {
    if (filename && a.filename !== filename) return false;
    if (contentType && a.contentType !== contentType) return false;
    if (minBytes !== undefined) {
      const size = Buffer.isBuffer(a.content) ? a.content.byteLength : Buffer.byteLength(a.content);
      if (size < minBytes) return false;
    }
    return true;
  });

  if (!match) {
    const got =
      email.attachments.map((a) => `${a.filename} (${a.contentType})`).join(', ') || 'none';
    const wanted = [
      filename ? `filename="${filename}"` : null,
      contentType ? `contentType="${contentType}"` : null,
      minBytes !== undefined ? `minBytes=${minBytes}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    throw new Error(`Expected attachment matching {${wanted}} but got: ${got}`);
  }
}

/**
 * Asserts that a captured email has exactly N attachments.
 *
 * ```ts
 * expectAttachmentCount(inbox[0], 2);
 * ```
 */
export function expectAttachmentCount(email: CapturedEmail, count: number): void {
  if (email.attachments.length !== count) {
    throw new Error(`Expected ${count} attachment(s) but found ${email.attachments.length}`);
  }
}

/**
 * Asserts that a captured email has no attachments.
 */
export function expectNoAttachments(email: CapturedEmail): void {
  expectAttachmentCount(email, 0);
}

export type { CreateMailerConfig };
