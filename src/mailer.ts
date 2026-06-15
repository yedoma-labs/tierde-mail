import { renderEmail } from './render.js';
import { htmlToPlainText } from './plain-text.js';
import { normalizeAddress, normalizeAddresses, validateAttachment } from './validate.js';
import type {
  EmailMessage,
  CreateMailerConfig,
  EmailProvider,
  EmailTemplate,
  Mailer,
  SendOptions,
  SendResult,
  MultiProviderMailerConfig,
} from './types.js';

function isMultiProvider(config: CreateMailerConfig): config is MultiProviderMailerConfig {
  return 'providers' in config;
}

class MailerImpl implements Mailer {
  readonly #from;
  readonly #defaultReplyTo;
  readonly #providers: EmailProvider[];
  readonly #strategy: 'failover' | 'round-robin';
  #roundRobinIndex = 0;

  constructor(config: CreateMailerConfig) {
    this.#from = normalizeAddress(config.from);
    this.#defaultReplyTo = config.defaultReplyTo
      ? normalizeAddress(config.defaultReplyTo)
      : undefined;

    if (isMultiProvider(config)) {
      this.#providers = config.providers;
      this.#strategy = config.strategy;
    } else {
      this.#providers = [config.provider];
      this.#strategy = 'failover';
    }
  }

  async send<Props>(template: EmailTemplate<Props>, options: SendOptions<Props>): Promise<SendResult> {
    for (const attachment of options.attachments ?? []) {
      validateAttachment(attachment);
    }

    const props = options.props;
    const subject = template.subject(props);
    const element = template.component(props);
    const html = renderEmail(element);
    const text = htmlToPlainText(html);

    const replyTo = options.replyTo
      ? normalizeAddress(options.replyTo)
      : this.#defaultReplyTo;

    const message: EmailMessage = {
      from: this.#from,
      to: normalizeAddresses(options.to),
      ...(options.cc ? { cc: normalizeAddresses(options.cc) } : {}),
      ...(options.bcc ? { bcc: normalizeAddresses(options.bcc) } : {}),
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
      text,
      attachments: options.attachments ?? [],
      headers: options.headers ?? {},
    };

    if (this.#strategy === 'round-robin') {
      const idx = this.#roundRobinIndex % this.#providers.length;
      this.#roundRobinIndex++;
      const provider = this.#providers[idx];
      if (!provider) throw new Error('No providers configured');
      return provider.send(message);
    }

    // failover: try each provider in order
    let lastError: unknown;
    for (const provider of this.#providers) {
      try {
        return await provider.send(message);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  toString(): string {
    return `Mailer(providers=[${this.#providers.map((p) => p.name).join(', ')}])`;
  }
}

export function createMailer(config: CreateMailerConfig): Mailer {
  return new MailerImpl(config);
}
