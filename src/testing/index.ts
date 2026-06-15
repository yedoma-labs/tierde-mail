import { renderEmail } from '../render.js';
import { htmlToPlainText } from '../plain-text.js';
import { normalizeAddress, normalizeAddresses } from '../validate.js';
import type {
  EmailProvider,
  EmailMessage,
  EmailTemplate,
  SendOptions,
  SendResult,
  Mailer,
  CreateMailerConfig,
  EmailAddress,
} from '../types.js';

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

  async send<Props>(template: EmailTemplate<Props>, options: SendOptions<Props>): Promise<SendResult> {
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

export type { CreateMailerConfig };
